"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Safari can throw "The string did not match the expected pattern"
    // when response.json() hits empty/non-JSON bodies.
    throw new Error(
      res.ok
        ? "Unexpected server response. Please try again."
        : "Upload failed. Please try again.",
    );
  }
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Something went wrong";
  if (/did not match the expected pattern|unexpected end of json|JSON/i.test(msg)) {
    return "Upload failed. Please try again.";
  }
  return msg;
}

export function UploadHero() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "parsing">("idle");
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);

  async function handleFile(file: File) {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setPhase("uploading");

    try {
      const createRes = await fetch("/api/sessions", { method: "POST" });
      const created = await readJson(createRes);
      if (!createRes.ok) {
        throw new Error(
          typeof created.error === "string"
            ? created.error
            : "Could not start a split session",
        );
      }
      const sessionId = created.id;
      if (typeof sessionId !== "string" || !sessionId) {
        throw new Error("Could not start a split session");
      }

      setPhase("parsing");
      const form = new FormData();
      form.append("image", file);

      const parseRes = await fetch(`/api/sessions/${sessionId}/parse`, {
        method: "POST",
        body: form,
      });
      const payload = await readJson(parseRes);
      if (!parseRes.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Could not read that receipt",
        );
      }

      startTransition(() => {
        router.push(`/s/${sessionId}`);
      });
    } catch (err) {
      setPhase("idle");
      setError(friendlyError(err));
    } finally {
      inFlight.current = false;
    }
  }

  const busy = phase !== "idle" || pending;

  return (
    <div className="upload-panel">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <button
        type="button"
        className="upload-cta"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <span className="upload-cta-label">
          {phase === "uploading" && "Starting…"}
          {phase === "parsing" && "Reading receipt…"}
          {phase === "idle" && !pending && "Upload receipt photo"}
          {pending && "Opening split…"}
        </span>
        <span className="upload-cta-hint">JPEG, PNG, or WebP · under 10MB</span>
      </button>

      {busy && (
        <div className="parse-progress" aria-live="polite">
          <div className="parse-bar" />
          <p>
            {phase === "parsing"
              ? "AI is pulling line items from your photo"
              : "Preparing your split"}
          </p>
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
