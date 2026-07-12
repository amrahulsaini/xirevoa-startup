"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { hashPassword } from "@/lib/password";

export type PasswordState = { error?: string; ok?: boolean } | null;

/**
 * Sets (or replaces) the signed-in user's password.
 *
 * This is what lets a Google-first account also sign in with email + password —
 * both methods then resolve to the one account, which is the whole point of
 * keeping a single row per email.
 */
export async function setAccountPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You're signed out." };

  // One method per email: only an account that already uses a password may change
  // it. A Google account can't add a password (that would create a second method).
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!account?.passwordHash) {
    return { error: "This account signs in with Google." };
  }

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "At least 8 characters." };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  } catch {
    return { error: "Could not save your password. Try again." };
  }
  return { ok: true };
}
