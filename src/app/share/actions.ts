"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Sharing is opt-in, per look.
 *
 * A look is a photograph of the user's face and body, so it stays private until
 * they explicitly say otherwise. Flipping `shared` is what makes /share/<id>
 * resolve at all — without it that page 404s even if you know the id.
 */
export async function setShared(lookId: string, shared: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Signed out." };

  // Scope the update to the owner, so nobody can publish someone else's look by
  // guessing an id.
  const { count } = await prisma.look.updateMany({
    where: { id: lookId, userId: session.user.id },
    data: { shared },
  });
  if (count === 0) return { error: "Not found." };

  return { ok: true, url: shared ? `/share/${lookId}` : null };
}
