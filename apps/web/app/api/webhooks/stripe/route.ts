import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyOwnerPersonPaid } from "@/lib/push";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object;
    const sessionId = checkout.metadata?.sessionId;
    const personId = checkout.metadata?.personId;
    if (sessionId && personId) {
      const person = await prisma.person.findFirst({
        where: { id: personId, sessionId },
      });
      await prisma.person.updateMany({
        where: { id: personId, sessionId },
        data: { paid: true },
      });
      const split = await prisma.splitSession.update({
        where: { id: sessionId },
        data: { version: { increment: 1 } },
      });
      if (person && !person.paid) {
        void notifyOwnerPersonPaid({
          sessionId,
          ownerId: split.ownerId,
          personName: person.name,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
