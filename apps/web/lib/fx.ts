type CacheEntry = { rates: Record<string, number>; fetchedAt: number };

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000;

async function fetchRates(base: string): Promise<Record<string, number>> {
  const key = base.toUpperCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) {
    return hit.rates;
  }

  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(key)}`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) {
    throw new Error("Could not fetch FX rates");
  }
  const data = (await res.json()) as { rates: Record<string, number> };
  const rates = { ...data.rates, [key]: 1 };
  cache.set(key, { rates, fetchedAt: Date.now() });
  return rates;
}

export async function getRate(from: string, to: string): Promise<number> {
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  if (source === target) return 1;
  const rates = await fetchRates(source);
  const rate = rates[target];
  if (!rate) {
    throw new Error(`No FX rate for ${source}→${target}`);
  }
  return rate;
}

export function convertAmount(amount: number, rate: number) {
  return Math.round(amount * rate * 100) / 100;
}
