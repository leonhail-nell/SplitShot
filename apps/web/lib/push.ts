import { prisma } from "@/lib/db";

type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
};

export async function sendExpoPush(messages: PushMessage[]) {
  if (messages.length === 0) return;

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.warn("Expo push failed", res.status, await res.text());
    }
  } catch (err) {
    console.warn("Expo push error", err);
  }
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  if (tokens.length === 0) return;

  await sendExpoPush(
    tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data,
      sound: "default" as const,
    })),
  );
}

const presenceDebounce = new Map<string, number>();

export async function notifyOwnerPresenceJoined(params: {
  sessionId: string;
  ownerId: string | null | undefined;
  peerName: string;
  isNewPeer: boolean;
}) {
  if (!params.ownerId || !params.isNewPeer) return;

  const now = Date.now();
  const last = presenceDebounce.get(params.sessionId) ?? 0;
  if (now - last < 60_000) return;
  presenceDebounce.set(params.sessionId, now);

  await notifyUser(
    params.ownerId,
    "Someone joined your split",
    `${params.peerName} is viewing the receipt`,
    { sessionId: params.sessionId, type: "presence" },
  );
}

export async function notifyOwnerPersonPaid(params: {
  sessionId: string;
  ownerId: string | null | undefined;
  personName: string;
}) {
  if (!params.ownerId) return;
  await notifyUser(
    params.ownerId,
    "Someone paid up",
    `${params.personName} was marked paid`,
    { sessionId: params.sessionId, type: "paid" },
  );
}
