"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PASSWORD_MIN_LENGTH,
  validateRegisterInput,
} from "@splitshot/shared";

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) {
    return res.ok ? "" : "Registration failed";
  }
  try {
    const payload = JSON.parse(text) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Non-JSON bodies (HTML/empty) — never surface Safari's cryptic parse error.
  }
  return "Registration failed";
}

function friendlyError(err: unknown, fallback: string): string {
  if (!(err instanceof Error) || !err.message) return fallback;
  const msg = err.message;
  if (/did not match the expected pattern|unexpected end of json|JSON/i.test(msg)) {
    return fallback;
  }
  return msg;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Sync guard — React state alone cannot block a double-click before re-render.
  const inFlight = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);

    const parsed = validateRegisterInput({ name, email, password });
    if (!parsed.ok) {
      setError(parsed.error);
      inFlight.current = false;
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      try {
        const login = await signIn("credentials", {
          email: parsed.data.email,
          password: parsed.data.password,
          redirect: false,
        });
        if (login?.error) {
          setError("Account created — please sign in");
          return;
        }
      } catch (signInErr) {
        // Auth.js may return an empty body; Safari then throws a cryptic
        // "expected pattern" TypeError from response.json().
        setError(
          friendlyError(signInErr, "Account created — please sign in"),
        );
        return;
      }

      router.push("/history");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err, "Registration failed"));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={onSubmit} noValidate>
        <p className="brand-mark">
          <Link href="/">SplitShot</Link>
        </p>
        <h1>Create account</h1>
        <label>
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="share-btn" disabled={busy}>
          {busy ? "Creating…" : "Register"}
        </button>
        <p className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
        <p className="auth-switch">
          <Link href="/">Back home</Link>
        </p>
      </form>
    </main>
  );
}
