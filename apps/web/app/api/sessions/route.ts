import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestUser } from "@/lib/mobileAuth";
import { getSessionPayload } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.splitSession.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  const list = await Promise.all(
    rows.map(async (row) => {
      const payload = await getSessionPayload(row.id);
      return {
        id: row.id,
        merchant: row.merchant,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        currency: row.currency,
        displayCurrency: row.displayCurrency || row.currency,
        imageUrl: payload?.imageUrl ?? null,
        grandTotal: payload?.displayTotals.grandTotal ?? 0,
      };
    }),
  );

  return NextResponse.json({ sessions: list });
}

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  const id = nanoid(10);
  await prisma.splitSession.create({
    data: {
      id,
      ownerId: user?.id ?? null,
    },
  });

  const payload = await getSessionPayload(id);
  return NextResponse.json(payload, { status: 201 });
}
