import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validateRegisterInput } from "@splitshot/shared";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function isUniqueEmailError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    (Array.isArray(err.meta?.target)
      ? err.meta.target.includes("email")
      : true)
  );
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
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    );
  } catch (err) {
    console.error("register failed", err);
    if (isUniqueEmailError(err)) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }
    const detail =
      process.env.NODE_ENV !== "production" && err instanceof Error
        ? err.message
        : undefined;
    return NextResponse.json(
      {
        error: "Could not create account. Please try again.",
        ...(detail ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}
