import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validateRegisterInput } from "@splitshot/shared";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/** Duck-type P2002 — instanceof can fail across Turbopack module copies. */
function isUniqueEmailError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    code?: unknown;
    meta?: { target?: unknown; driverAdapterError?: { cause?: { constraint?: { fields?: unknown } } } };
  };
  if (e.code !== "P2002") return false;
  const target = e.meta?.target;
  if (Array.isArray(target)) {
    return target.some((t) => t === "email" || String(t).includes("email"));
  }
  const fields = e.meta?.driverAdapterError?.cause?.constraint?.fields;
  if (Array.isArray(fields)) {
    return fields.some((t) => t === "email" || String(t).includes("email"));
  }
  // Unique on User without a clear target — treat as email conflict.
  return true;
}

function isDatabaseMisconfiguredError(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  return (
    msg.includes("database_url") ||
    msg.includes("cannot open database") ||
    msg.includes("directory does not exist") ||
    msg.includes("sqlite") ||
    msg.includes("must be a postgresql") ||
    msg.includes("can't reach database server") ||
    msg.includes("password authentication failed") ||
    msg.includes("tenant or user not found") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

async function createUser(name: string, email: string, passwordHash: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { kind: "exists" as const };
  }
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });
  return { kind: "created" as const, user };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid registration details" },
      { status: 400 },
    );
  }

  const parsed = validateRegisterInput(
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {},
  );
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await createUser(name, email, passwordHash);

    if (result.kind === "exists") {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("register failed", errorMessage(err), err);
    if (isUniqueEmailError(err)) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }
    if (isDatabaseMisconfiguredError(err)) {
      return NextResponse.json(
        {
          error:
            "Database is not ready. Production requires PostgreSQL (Neon) with migrations applied.",
          code: "DB_UNAVAILABLE",
          ...(process.env.NODE_ENV !== "production"
            ? { detail: errorMessage(err) }
            : {}),
        },
        { status: 503 },
      );
    }
    const detail =
      process.env.NODE_ENV !== "production" ? errorMessage(err) : undefined;
    return NextResponse.json(
      {
        error: "Could not create account. Please try again.",
        ...(detail ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}
