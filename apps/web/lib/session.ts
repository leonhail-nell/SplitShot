import { prisma } from "@/lib/db";
import { convertAmount, getRate } from "@/lib/fx";
import { computeTotals } from "@/lib/totals";

const PRESENCE_TTL_MS = 10_000;

export async function getSessionPayload(id: string) {
  const session = await prisma.splitSession.findUnique({
    where: { id },
    include: {
      items: {
        include: { assignments: true },
        orderBy: { name: "asc" },
      },
      people: { orderBy: { name: "asc" } },
      presence: true,
    },
  });

  if (!session) return null;

  const items = session.items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    assigneeIds: item.assignments.map((a) => a.personId),
  }));

  const people = session.people.map((p) => ({
    id: p.id,
    name: p.name,
    paid: p.paid,
  }));

  const totals = computeTotals(items, people, session.tax, session.tip);

  const now = Date.now();
  const peers = session.presence
    .filter((p) => now - p.lastSeenAt.getTime() < PRESENCE_TTL_MS)
    .map((p) => ({
      clientId: p.clientId,
      name: p.name,
      lastSeenAt: p.lastSeenAt.toISOString(),
    }));

  const displayCurrency = session.displayCurrency || session.currency;
  let fxRate = 1;
  let fxNote: string | null = null;
  if (displayCurrency !== session.currency) {
    try {
      fxRate = await getRate(session.currency, displayCurrency);
      fxNote = `approx. @ ${fxRate.toFixed(4)} ${session.currency}→${displayCurrency}`;
    } catch {
      fxRate = 1;
      fxNote = "FX unavailable — showing receipt currency";
    }
  }

  const convert = (n: number) => convertAmount(n, fxRate);

  return {
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    version: session.version,
    ownerId: session.ownerId,
    merchant: session.merchant,
    currency: session.currency,
    displayCurrency,
    tax: session.tax,
    tip: session.tip,
    imagePath: session.imagePath,
    imageUrl: session.imagePath
      ? `/api/uploads/${session.imagePath.replace(/^uploads\//, "")}`
      : null,
    items,
    people,
    totals,
    displayTotals: {
      itemsSubtotal: convert(totals.itemsSubtotal),
      tax: convert(totals.tax),
      tip: convert(totals.tip),
      grandTotal: convert(totals.grandTotal),
      byPerson: totals.byPerson.map((row) => ({
        ...row,
        itemsSubtotal: convert(row.itemsSubtotal),
        taxShare: convert(row.taxShare),
        tipShare: convert(row.tipShare),
        total: convert(row.total),
      })),
      unassignedSubtotal: convert(totals.unassignedSubtotal),
    },
    fxRate,
    fxNote,
    peers,
  };
}

export type SessionPayload = NonNullable<
  Awaited<ReturnType<typeof getSessionPayload>>
>;
