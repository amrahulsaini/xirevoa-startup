import "server-only";
import bcrypt from "bcryptjs";

// bcryptjs (pure JS) rather than native bcrypt: the app builds and runs on a
// plain Linux VM with no toolchain, and a native module would need compiling there.

const ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);

export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

/** Sign-up validation shared by the server action and the client hints. */
export function validateCredentials(input: {
  username?: string;
  password?: string;
}) {
  const errors: Record<string, string> = {};

  const username = input.username?.trim() ?? "";
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    errors.username =
      "3–20 characters, letters, numbers and underscores only.";
  }

  const password = input.password ?? "";
  if (password.length < 8) {
    errors.password = "At least 8 characters.";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
