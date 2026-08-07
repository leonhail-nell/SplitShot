import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/authStorage";
import { setCachedSession } from "@/lib/offline/cache";
import { getDb } from "@/lib/offline/db";
import type { SessionPayload } from "@/lib/types";

export type QueueItem = {
  id: number;
  method: string;
  path: string;
  body: string | null;
  created_at: number;
};

export async function enqueue(
  method: string,
  path: string,
  body?: unknown,
) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_queue (method, path, body, created_at) VALUES (?, ?, ?, ?)`,
    [method, path, body == null ? null : JSON.stringify(body), Date.now()],
  );
}

export async function listQueue(): Promise<QueueItem[]> {
  const db = await getDb();
  return db.getAllAsync<QueueItem>(
    "SELECT id, method, path, body, created_at FROM sync_queue ORDER BY id ASC",
  );
}

export async function removeQueueItem(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM sync_queue WHERE id = ?", [id]);
}

let flushing = false;

export async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const token = await getToken();
    const items = await listQueue();
    for (const item of items) {
      try {
        const res = await fetch(`${API_URL}${item.path}`, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: item.body,
        });

        if (res.status === 404) {
          await removeQueueItem(item.id);
          continue;
        }

        if (res.status === 409) {
          const payload = await res.json().catch(() => null);
          if (payload?.session) {
            await setCachedSession(payload.session as SessionPayload);
          }
          await removeQueueItem(item.id);
          continue;
        }

        if (!res.ok) {
          // Keep for retry on transient errors
          break;
        }

        const session = (await res.json()) as SessionPayload;
        if (session?.id) {
          await setCachedSession(session);
        }
        await removeQueueItem(item.id);
      } catch {
        break;
      }
    }
  } finally {
    flushing = false;
  }
}
