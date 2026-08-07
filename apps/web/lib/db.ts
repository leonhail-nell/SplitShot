import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveSqlitePath(url: string): string {
  const filePath = url.startsWith("file:") ? url.slice("file:".length) : url;
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(/* turbopackIgnore: true */ process.cwd(), filePath);
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const resolved = resolveSqlitePath(url);

  // Default better-sqlite3 busy timeout is 5s. Concurrent Next route handlers
  // (and any other process on the same file) can exceed that and surface as
  // register 500s: "Operation has timed out".
  const adapter = new PrismaBetterSqlite3({
    url: resolved,
    timeout: 30_000,
  });
  const client = new PrismaClient({ adapter });

  // WAL allows readers during a write and cuts SQLITE_BUSY storms vs DELETE mode.
  void client.$queryRawUnsafe("PRAGMA journal_mode=WAL").catch((err) => {
    console.error("Failed to enable SQLite WAL mode", err);
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
