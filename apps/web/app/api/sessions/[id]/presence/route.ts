import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notifyOwnerPresenceJoined } from "@/lib/push";
import { getSessionPayload } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(80),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await prisma.splitSession.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const prior = await prisma.presence.findUnique({
    where: {
      sessionId_clientId: {
        sessionId: id,
        clientId: parsed.data.clientId,
      },
    },
  });
  const isNewPeer = !prior;

  const cutoff = new Date(Date.now() - 30_000);
  await prisma.presence.deleteMany({
    where: { sessionId: id, lastSeenAt: { lt: cutoff } },
  });

  await prisma.presence.upsert({
    where: {
      sessionId_clientId: {
        sessionId: id,
        clientId: parsed.data.clientId,
      },
    },
    create: {
      sessionId: id,
      clientId: parsed.data.clientId,
      name: parsed.data.name.trim(),
    },
    update: {
      name: parsed.data.name.trim(),
      lastSeenAt: new Date(),
    },
  });

  if (isNewPeer) {
    void notifyOwnerPresenceJoined({
      sessionId: id,
      ownerId: existing.ownerId,
      peerName: parsed.data.name.trim(),
      isNewPeer: true,
    });
  }

  const session = await getSessionPayload(id);
  return NextResponse.json({
    peers: session?.peers ?? [],
    version: session?.version,
  });
}
