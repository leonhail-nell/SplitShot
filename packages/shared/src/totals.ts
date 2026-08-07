import type { PersonTotal } from "./types";

export type { PersonTotal };

export type TotalsItem = {
  id: string;
  price: number;
  quantity: number;
  assigneeIds: string[];
};

export type TotalsPerson = {
  id: string;
  name: string;
};

export type SplitTotals = {
  itemsSubtotal: number;
  tax: number;
  tip: number;
  grandTotal: number;
  byPerson: PersonTotal[];
  unassignedSubtotal: number;
};

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

/** Evenly split shared items; tax/tip proportional to each person's item subtotal. */
export function computeTotals(
  items: TotalsItem[],
  people: TotalsPerson[],
  tax: number,
  tip: number,
): SplitTotals {
  const itemsSubtotal = roundMoney(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  const personMap = new Map<string, PersonTotal>(
    people.map((p) => [
      p.id,
      {
        personId: p.id,
        name: p.name,
        itemsSubtotal: 0,
        taxShare: 0,
        tipShare: 0,
        total: 0,
      },
    ]),
  );

  let unassignedSubtotal = 0;

  for (const item of items) {
    const line = item.price * item.quantity;
    const assignees = item.assigneeIds.filter((id) => personMap.has(id));

    if (assignees.length === 0) {
      unassignedSubtotal += line;
      continue;
    }

    const share = line / assignees.length;
    for (const id of assignees) {
      const row = personMap.get(id);
      if (row) row.itemsSubtotal += share;
    }
  }

  const assignedSubtotal = itemsSubtotal - unassignedSubtotal;

  for (const row of personMap.values()) {
    const ratio =
      assignedSubtotal > 0 ? row.itemsSubtotal / assignedSubtotal : 0;
    row.taxShare = roundMoney(tax * ratio);
    row.tipShare = roundMoney(tip * ratio);
    row.itemsSubtotal = roundMoney(row.itemsSubtotal);
    row.total = roundMoney(row.itemsSubtotal + row.taxShare + row.tipShare);
  }

  return {
    itemsSubtotal,
    tax: roundMoney(tax),
    tip: roundMoney(tip),
    grandTotal: roundMoney(itemsSubtotal + tax + tip),
    byPerson: Array.from(personMap.values()),
    unassignedSubtotal: roundMoney(unassignedSubtotal),
  };
}
