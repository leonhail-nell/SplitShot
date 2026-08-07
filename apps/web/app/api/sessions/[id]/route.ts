import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notifyOwnerPersonPaid } from "@/lib/push";
import { getSessionPayload } from "@/lib/session";

export const runtime = "nodejs";

const patchSchema = z.object({
  // Optional for older mobile clients; when sent, enforces optimistic concurrency.
  version: z.number().int().positive().optional(),
  merchant: z.string().nullable().optional(),
  currency: z.string().min(1).optional(),
  displayCurrency: z.string().min(1).nullable().optional(),
  tax: z.number().min(0).optional(),
  tip: z.number().min(0).optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        price: z.number(),
        quantity: z.number().positive().default(1),
        assigneeIds: z.array(z.string()).default([]),
      }),
    )
    .optional(),
  people: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        paid: z.boolean().optional(),
      }),
    )
    .optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getSessionPayload(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await prisma.splitSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (
    data.version !== undefined &&
    data.version !== existing.version
  ) {
    const latest = await getSessionPayload(id);
    return NextResponse.json(
      { error: "Version conflict", session: latest },
      { status: 409 },
    );
  }

  const previouslyPaid = data.people
    ? new Set(
        (
          await prisma.person.findMany({
            where: { sessionId: id, paid: true },
            select: { id: true },
          })
        ).map((p) => p.id),
      )
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.splitSession.update({
      where: { id },
      data: {
        merchant: data.merchant === undefined ? undefined : data.merchant,
        currency: data.currency,
        displayCurrency:
          data.displayCurrency === undefined
            ? undefined
            : data.displayCurrency,
        tax: data.tax,
        tip: data.tip,
        version: { increment: 1 },
      },
    });

    if (data.people || data.items) {
      // Clear join rows first so person/item deletes cannot collide on recreate.
      await tx.itemAssignment.deleteMany({
        where: {
          OR: [{ item: { sessionId: id } }, { person: { sessionId: id } }],
        },
      });
    }

    if (data.items) {
      await tx.item.deleteMany({ where: { sessionId: id } });
    }

    if (data.people) {
      await tx.person.deleteMany({ where: { sessionId: id } });
      const incomingPersonIds = data.people
        .map((p) => p.id)
        .filter((pid): pid is string => Boolean(pid && pid.length > 0));
      if (incomingPersonIds.length > 0) {
        await tx.itemAssignment.deleteMany({
          where: { personId: { in: incomingPersonIds } },
        });
        await tx.person.deleteMany({
          where: { id: { in: incomingPersonIds } },
        });
      }
      if (data.people.length > 0) {
        await tx.person.createMany({
          data: data.people.map((p) => ({
            id: p.id && p.id.length > 0 ? p.id : nanoid(10),
            sessionId: id,
            name: p.name.trim(),
            paid: p.paid ?? false,
          })),
        });
      }
    }

    if (data.items) {
      const incomingItemIds = data.items
        .map((item) => item.id)
        .filter((iid): iid is string => Boolean(iid && iid.length > 0));
      if (incomingItemIds.length > 0) {
        await tx.itemAssignment.deleteMany({
          where: { itemId: { in: incomingItemIds } },
        });
        await tx.item.deleteMany({
          where: { id: { in: incomingItemIds } },
        });
      }

      const people = await tx.person.findMany({ where: { sessionId: id } });
      const personIds = new Set(people.map((p) => p.id));

      for (const item of data.items) {
        const itemId = item.id && item.id.length > 0 ? item.id : nanoid(10);
        await tx.item.create({
          data: {
            id: itemId,
            sessionId: id,
            name: item.name.trim(),
            price: item.price,
            quantity: item.quantity,
          },
        });

        const assignees = (item.assigneeIds ?? []).filter((pid) =>
          personIds.has(pid),
        );
        if (assignees.length > 0) {
          await tx.itemAssignment.createMany({
            data: assignees.map((personId) => ({ itemId, personId })),
          });
        }
      }
    }
  });

  const session = await getSessionPayload(id);

  if (data.people && previouslyPaid && session) {
    for (const person of session.people) {
      if (person.paid && !previouslyPaid.has(person.id)) {
        void notifyOwnerPersonPaid({
          sessionId: id,
          ownerId: existing.ownerId,
          personName: person.name,
        });
      }
    }
  }

  return NextResponse.json(session);
}
