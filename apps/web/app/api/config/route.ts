import { NextResponse } from "next/server";
import { stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ stripeEnabled: stripeEnabled() });
}
