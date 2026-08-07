"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function UploadHero() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "parsing">("idle");
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    setPhase("uploading");

    try {
      const createRes = await fetch("/api/sessions", { method: "POST" });
      if (!createRes.ok) {
        throw new Error("Could not start a split session");
      }
      const session = (await createRes.json()) as { id: string };

      setPhase("parsing");
      const form = new FormData();
      form.append("image", file);

      const parseRes = await fetch(`/api/sessions/${session.id}/parse`, {
        method: "POST",
        body: form,
      });

      const payload = await parseRes.json();
      if (!parseRes.ok) {
        throw new Error(payload.error ?? "Could not read that receipt");
      }

      startTransition(() => {
        router.push(`/s/${session.id}`);
      });
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Something went wrong");
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
