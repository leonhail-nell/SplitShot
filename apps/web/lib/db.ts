import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function requirePostgresUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. On Vercel, link Neon/Postgres and set DATABASE_URL to a postgresql:// connection string.",
    );
  }
  if (
    url.startsWith("file:") ||
    (!url.startsWith("postgres://") && !url.startsWith("postgresql://"))
  ) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL URL (postgresql://...). SQLite file: URLs do not work on Vercel serverless.",
    );
  }
  return url;
}

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: requirePostgresUrl() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
