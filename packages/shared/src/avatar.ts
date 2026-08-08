/** Initials for a person chip avatar (e.g. "Alex Kim" → "AK"). */
export function personInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

const AVATAR_TONES = [
  "#0d6e6e",
  "#1a5f4a",
  "#2a6b5c",
  "#0a4f4f",
  "#3d6b5e",
  "#145c63",
] as const;

/** Stable soft-teal tone from a person id/name seed. */
export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}
