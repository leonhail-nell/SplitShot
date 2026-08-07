import { API_URL } from "@/lib/config";
import { clearAuth, getToken, setAuth } from "@/lib/authStorage";
import { isOnline } from "@/lib/network";
import {
  getCachedHistory,
  getCachedSession,
  setCachedHistory,
  setCachedSession,
} from "@/lib/offline/cache";
import { enqueue, flushQueue } from "@/lib/offline/queue";
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from "@/lib/notifications";
import type {
  AuthUser,
  HistorySession,
  SessionItem,
  SessionPayload,
  SessionPerson,
} from "@/lib/types";

let lastPushToken: string | null = null;

async function authHeaders(
  extra?: Record<string, string>,
): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {};
    }
  }
  if (!res.ok) {
    throw new Error(
      typeof (payload as { error?: string })?.error === "string"
        ? (payload as { error: string }).error
        : "Request failed",
    );
  }
  return payload as T;
}

export async function login(email: string, password: string) {
  if (!isOnline()) {
    throw new Error("Needs connection to sign in");
  }
  const res = await fetch(`${API_URL}/api/mobile/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await readJson<{ token: string; user: AuthUser }>(res);
  await setAuth(data.token, data.user);
  lastPushToken = (await registerForPushNotifications()) ?? null;
  void flushQueue();
  return data;
}

export async function register(name: string, email: string, password: string) {
  if (!isOnline()) {
    throw new Error("Needs connection to register");
  }
  const res = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  await readJson(res);
  return login(email, password);
}

export async function fetchMe() {
  const res = await fetch(`${API_URL}/api/mobile/me`, {
    headers: await authHeaders(),
  });
  return readJson<{ user: AuthUser }>(res);
}

export async function logout() {
  await unregisterPushNotifications(lastPushToken);
  lastPushToken = null;
  await clearAuth();
}

export async function listSessions(): Promise<HistorySession[]> {
  if (!isOnline()) {
    const cached = await getCachedHistory();
    if (cached) return cached;
    throw new Error("Needs connection to load history");
  }

  try {
    const res = await fetch(`${API_URL}/api/sessions`, {
      headers: await authHeaders(),
    });
    const data = await readJson<{ sessions: HistorySession[] }>(res);
    await setCachedHistory(data.sessions);
    return data.sessions;
  } catch (err) {
    const cached = await getCachedHistory();
    if (cached) return cached;
    throw err;
  }
}

export async function createSession(): Promise<SessionPayload> {
  if (!isOnline()) {
    throw new Error("Needs connection to scan a receipt");
  }
  const res = await fetch(`${API_URL}/api/sessions`, {
    method: "POST",
    headers: await authHeaders(),
  });
  const session = await readJson<SessionPayload>(res);
  await setCachedSession(session);
  return session;
}

export async function getSession(id: string): Promise<SessionPayload> {
  if (!isOnline()) {
    const cached = await getCachedSession(id);
    if (cached) return cached;
    throw new Error("Needs connection — this split is not cached");
  }

  try {
    const res = await fetch(`${API_URL}/api/sessions/${id}`, {
      headers: await authHeaders(),
    });
    const session = await readJson<SessionPayload>(res);
    await setCachedSession(session);
    return session;
  } catch (err) {
    const cached = await getCachedSession(id);
    if (cached) return cached;
    throw err;
  }
}

export async function parseReceipt(
  id: string,
  asset: { uri: string; mimeType?: string | null; fileName?: string | null },
): Promise<SessionPayload> {
  if (!isOnline()) {
    throw new Error("Needs connection to scan a receipt");
  }

  const form = new FormData();
  const mimeType = asset.mimeType ?? "image/jpeg";
  const name =
    asset.fileName ??
    `receipt.${mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg"}`;

  form.append("image", {
    uri: asset.uri,
    type: mimeType,
    name,
  } as unknown as Blob);

  const res = await fetch(`${API_URL}/api/sessions/${id}/parse`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  const session = await readJson<SessionPayload>(res);
  await setCachedSession(session);
  return session;
}

export async function updateSession(
  id: string,
  data: {
    version: number;
    merchant: string | null;
    currency: string;
    displayCurrency: string;
    tax: number;
    tip: number;
    items: SessionItem[];
    people: SessionPerson[];
  },
): Promise<SessionPayload> {
  const optimistic: SessionPayload = {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: data.version,
    ownerId: null,
    merchant: data.merchant,
    currency: data.currency,
    displayCurrency: data.displayCurrency,
    tax: data.tax,
    tip: data.tip,
    imagePath: null,
    imageUrl: null,
    items: data.items,
    people: data.people,
    totals: {
      itemsSubtotal: 0,
      tax: data.tax,
      tip: data.tip,
      grandTotal: 0,
      byPerson: [],
      unassignedSubtotal: 0,
    },
    displayTotals: {
      itemsSubtotal: 0,
      tax: data.tax,
      tip: data.tip,
      grandTotal: 0,
      byPerson: [],
      unassignedSubtotal: 0,
    },
    fxRate: 1,
    fxNote: null,
    peers: [],
  };

  const cached = await getCachedSession(id);
  if (cached) {
    optimistic.createdAt = cached.createdAt;
    optimistic.ownerId = cached.ownerId;
    optimistic.imagePath = cached.imagePath;
    optimistic.imageUrl = cached.imageUrl;
    optimistic.peers = cached.peers;
    optimistic.totals = cached.totals;
    optimistic.displayTotals = cached.displayTotals;
    optimistic.fxRate = cached.fxRate;
    optimistic.fxNote = cached.fxNote;
  }

  if (!isOnline()) {
    const local: SessionPayload = {
      ...optimistic,
      version: data.version,
      items: data.items,
      people: data.people,
      merchant: data.merchant,
      currency: data.currency,
      displayCurrency: data.displayCurrency,
      tax: data.tax,
      tip: data.tip,
    };
    await setCachedSession(local);
    await enqueue("PATCH", `/api/sessions/${id}`, data);
    return local;
  }

  const res = await fetch(`${API_URL}/api/sessions/${id}`, {
    method: "PATCH",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  if (res.status === 409) {
    const payload = await res.json();
    if (payload.session) {
      await setCachedSession(payload.session as SessionPayload);
    }
    const err = new Error("Version conflict") as Error & {
      session?: SessionPayload;
    };
    err.session = payload.session as SessionPayload;
    throw err;
  }

  const session = await readJson<SessionPayload>(res);
  await setCachedSession(session);
  return session;
}

export async function postPresence(
  id: string,
  body: { clientId: string; name: string },
) {
  if (!isOnline()) {
    return { peers: [] as SessionPayload["peers"] };
  }
  const res = await fetch(`${API_URL}/api/sessions/${id}/presence`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return readJson<{
    peers: SessionPayload["peers"];
    version?: number;
  }>(res);
}

export async function createCheckout(id: string, personId: string) {
  if (!isOnline()) {
    throw new Error("Needs connection to pay");
  }
  const res = await fetch(`${API_URL}/api/sessions/${id}/checkout`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ personId }),
  });
  return readJson<{ url: string }>(res);
}

export async function fetchConfig() {
  if (!isOnline()) {
    return { stripeEnabled: false };
  }
  const res = await fetch(`${API_URL}/api/config`);
  return readJson<{ stripeEnabled: boolean }>(res);
}

export function absoluteMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function ensurePushRegistered() {
  if (!isOnline()) return;
  const token = await getToken();
  if (!token) return;
  lastPushToken = (await registerForPushNotifications()) ?? lastPushToken;
}
