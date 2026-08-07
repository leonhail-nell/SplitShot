export type SessionItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assigneeIds: string[];
};

export type SessionPerson = {
  id: string;
  name: string;
  paid: boolean;
};

export type PersonTotal = {
  personId: string;
  name: string;
  itemsSubtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
};

export type SessionTotals = {
  itemsSubtotal: number;
  tax: number;
  tip: number;
  grandTotal: number;
  byPerson: PersonTotal[];
  unassignedSubtotal: number;
};

export type PresencePeer = {
  clientId: string;
  name: string;
  lastSeenAt: string;
};

export type SessionPayload = {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  ownerId: string | null;
  merchant: string | null;
  currency: string;
  displayCurrency: string;
  tax: number;
  tip: number;
  imagePath: string | null;
  imageUrl: string | null;
  items: SessionItem[];
  people: SessionPerson[];
  totals: SessionTotals;
  displayTotals: SessionTotals;
  fxRate: number;
  fxNote: string | null;
  peers: PresencePeer[];
};

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export type HistorySession = {
  id: string;
  merchant: string | null;
  createdAt: string;
  updatedAt: string;
  currency: string;
  displayCurrency: string;
  imageUrl: string | null;
  grandTotal: number;
};
