export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 80;

/** Practical email check shared by web + mobile (not full RFC). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterValidation =
  | { ok: true; data: RegisterInput }
  | { ok: false; error: string };

export function validateRegisterInput(input: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}): RegisterValidation {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");

  if (!name) {
    return { ok: false, error: "Name is required" };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return { ok: false, error: `Name must be at most ${NAME_MAX_LENGTH} characters` };
  }
  if (!email) {
    return { ok: false, error: "Email is required" };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    };
  }

  return { ok: true, data: { name, email, password } };
}
