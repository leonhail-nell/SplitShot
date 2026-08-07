import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateWithPassword,
  signMobileToken,
} from "@/lib/mobileAuth";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const user = await authenticateWithPassword(
    parsed.data.email,
    parsed.data.password,
  );
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  const token = await signMobileToken(user);
  return NextResponse.json({ token, user });
}
