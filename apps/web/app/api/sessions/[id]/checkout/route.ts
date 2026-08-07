import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionPayload } from "@/lib/session";
import { getStripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

const schema = z.object({
  personId: z.string().min(1),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await getSessionPayload(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const person = session.people.find((p) => p.id === parsed.data.personId);
  const total = session.displayTotals.byPerson.find(
    (p) => p.personId === parsed.data.personId,
  );
  if (!person || !total) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  if (total.total <= 0) {
    return NextResponse.json(
      { error: "Nothing to charge for this person" },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const currency = (session.displayCurrency || session.currency).toLowerCase();

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/s/${id}?paid=${person.id}`,
    cancel_url: `${origin}/s/${id}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(total.total * 100),
          product_data: {
            name: `SplitShot — ${session.merchant || "receipt"} (${person.name})`,
          },
        },
      },
    ],
    metadata: {
      sessionId: id,
      personId: person.id,
    },
  });

  await prisma.splitSession.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ url: checkout.url });
}
