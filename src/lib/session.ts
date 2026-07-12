import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Account model: one row per email. Google and email/password both resolve to
 * the same User (Google links by verified email via
 * allowDangerousEmailAccountLinking), so a person never ends up with two
 * identities for one address.
 *
 * Username is mandatory but Google doesn't supply one, so signed-in users
 * without a username are funnelled through /welcome before they can use the
 * account. The check hits the DB rather than the JWT so that setting a username
 * takes effect on the very next request without a token refresh dance.
 */

export type SessionUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
};

/** The signed-in user's full record, or null if signed out. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      image: true,
      createdAt: true,
    },
  });
  return u ?? null;
}

/**
 * Require a fully-onboarded user (signed in AND has a username).
 * Redirects to sign-in, or to /welcome to choose a username.
 */
export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(nextPath)}`);
  if (!user.username) redirect(`/welcome?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/**
 * For pages usable while signed out (e.g. the Studio): don't force sign-in, but
 * if they ARE signed in without a username, send them to pick one first.
 */
export async function gateUsername(nextPath: string): Promise<SessionUser | null> {
  const user = await currentUser();
  if (user && !user.username) {
    redirect(`/welcome?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
