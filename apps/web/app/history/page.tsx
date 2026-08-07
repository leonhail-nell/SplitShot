import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteNav } from "@/components/SiteNav";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";
import { getSessionPayload } from "@/lib/session";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/history");
  }

  const rows = await prisma.splitSession.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const cards = await Promise.all(
    rows.map(async (row) => {
      const payload = await getSessionPayload(row.id);
      return {
        id: row.id,
        merchant: row.merchant || "Untitled receipt",
        updatedAt: row.updatedAt,
        imageUrl: payload?.imageUrl,
        total: payload?.displayTotals.grandTotal ?? 0,
        currency: payload?.displayCurrency ?? row.currency,
      };
    }),
  );

  return (
    <main className="history-page">
      <SiteNav />
      <section className="history-hero">
        <h1>Your splits</h1>
        <p>Receipts you uploaded while signed in.</p>
        <Link href="/" className="share-btn">
          New split
        </Link>
      </section>

      {cards.length === 0 ? (
        <p className="history-empty">No splits yet — upload a receipt to start.</p>
      ) : (
        <ul className="history-grid">
          {cards.map((card) => (
            <li key={card.id}>
              <Link href={`/s/${card.id}`} className="history-card">
                <div
                  className="history-thumb"
                  style={
                    card.imageUrl
                      ? { backgroundImage: `url(${card.imageUrl})` }
                      : undefined
                  }
                />
                <div className="history-meta">
                  <strong>{card.merchant}</strong>
                  <span>
                    {card.updatedAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <em>{formatMoney(card.total, card.currency)}</em>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
