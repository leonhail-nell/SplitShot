import type { HistorySession, SessionPayload } from "@/lib/types";
import { getDb } from "@/lib/offline/db";

export async function getCachedSession(id: string) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ json: string }>(
    "SELECT json FROM session_cache WHERE id = ?",
    [id],
  );
  if (!row) return null;
  try {
    return JSON.parse(row.json) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setCachedSession(session: SessionPayload) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO session_cache (id, json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
    [session.id, JSON.stringify(session), Date.now()],
  );
}

export async function getCachedHistory() {
  const db = await getDb();
  const row = await db.getFirstAsync<{ json: string }>(
    "SELECT json FROM kv_cache WHERE key = ?",
    ["history"],
  );
  if (!row) return null;
  try {
    return JSON.parse(row.json) as HistorySession[];
  } catch {
    return null;
  }
}

export async function setCachedHistory(sessions: HistorySession[]) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO kv_cache (key, json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
    ["history", JSON.stringify(sessions), Date.now()],
  );
}
