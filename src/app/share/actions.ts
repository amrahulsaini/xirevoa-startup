"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Visibility is two separate decisions, not one.
 *
 *   shared  → a link exists; anyone holding /share/<id> can view it.
 *   inFeed  → it's listed on the public /feed.
 *
 * They used to be the same flag, which meant tapping "Share" to send a friend a
 * link also published you to a public gallery — and cancelling the share sheet
 * published you anyway. Sending someone a photo and putting it on a billboard
 * are not the same choice.
 *
 * Both default to off. A look is a photograph of the user's face and body.
 */

/** Turn the share link on or off. */
export async function setShared(lookId: string, shared: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Signed out." };

  // Scoped to the owner, so nobody can publish someone else's look by guessing
  // an id.
  const { count } = await prisma.look.updateMany({
    where: { id: lookId, userId: session.user.id },
    // Unsharing the link must also pull it from the feed, or a "private" look
    // would still be sitting on the public gallery.
    data: shared ? { shared: true } : { shared: false, inFeed: false },
  });
  if (count === 0) return { error: "Not found." };

  if (!shared) revalidatePath("/feed");
  return { ok: true, url: shared ? `/share/${lookId}` : null };
}

/** Add to or remove from the public feed. */
export async function setInFeed(lookId: string, inFeed: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Signed out." };

  const { count } = await prisma.look.updateMany({
    where: { id: lookId, userId: session.user.id },
    // A feed entry links to /share/<id>, so posting must also make that page
    // resolve — otherwise the feed would be full of 404s.
    data: inFeed ? { inFeed: true, shared: true } : { inFeed: false },
  });
  if (count === 0) return { error: "Not found." };

  // The feed is cached; without this the change wouldn't show for a minute.
  revalidatePath("/feed");
  return { ok: true, inFeed };
}
