import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type RequestUser = {
  id: string;
  email: string | null;
  name: string | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(user: RequestUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyMobileToken(
  token: string,
): Promise<RequestUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

function bearerFromRequest(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

/** Resolve user from mobile Bearer JWT or Auth.js cookie session. */
export async function getRequestUser(
  request?: Request,
): Promise<RequestUser | null> {
  if (request) {
    const token = bearerFromRequest(request);
    if (token) {
      const fromJwt = await verifyMobileToken(token);
      if (fromJwt) {
        const dbUser = await prisma.user.findUnique({
          where: { id: fromJwt.id },
          select: { id: true, email: true, name: true },
        });
        if (dbUser) return dbUser;
      }
    }
  }

  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

export async function authenticateWithPassword(
  emailRaw: string,
  password: string,
): Promise<RequestUser | null> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
