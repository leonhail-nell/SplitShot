import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("splitshot.db");
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS session_cache (
          id TEXT PRIMARY KEY NOT NULL,
          json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          method TEXT NOT NULL,
          path TEXT NOT NULL,
          body TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS kv_cache (
          key TEXT PRIMARY KEY NOT NULL,
          json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}
