import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getRequestUser } from "@/lib/mobileAuth";

export const runtime = "nodejs";

const upsertSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web", "unknown"]).default("unknown"),
});

const deleteSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const row = await prisma.deviceToken.upsert({
    where: { token: parsed.data.token },
    create: {
      userId: user.id,
      token: parsed.data.token,
      platform: parsed.data.platform,
    },
    update: {
      userId: user.id,
      platform: parsed.data.platform,
    },
  });

  return NextResponse.json({ id: row.id, token: row.token });
}

export async function DELETE(request: Request) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.deviceToken.deleteMany({
    where: { userId: user.id, token: parsed.data.token },
  });

  return NextResponse.json({ ok: true });
}
