"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { validateCredentials } from "@/lib/password";

export type UsernameState = { error?: string; redirectTo?: string } | null;

function safe(next: string | undefined) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/studio";
}

/** Sets the signed-in user's username. Used by /welcome (and the account page). */
export async function setUsername(
  _prev: UsernameState,
  formData: FormData,
): Promise<UsernameState> {
  const session = await auth();
  if (!session?.user?.id) return { redirectTo: "/signin" };

  const username = String(formData.get("username") ?? "").trim();
  const next = safe(String(formData.get("next") ?? ""));

  const { ok, errors } = validateCredentials({ username, password: "placeholder8" });
  if (!ok && errors.username) return { error: errors.username };

  const taken = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (taken && taken.id !== session.user.id) {
    return { error: "That username is taken." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username: username.toLowerCase(), name: username },
    });
  } catch {
    return { error: "Could not save your username. Try again." };
  }

  return { redirectTo: next };
}
