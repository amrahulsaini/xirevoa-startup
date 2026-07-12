import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

/**
 * Auth.js.
 *
 * ONE method per email, by design. Each address is bound to whichever method
 * created it: an email/password account can't sign in with Google, and a Google
 * account can't use email/password. There is deliberately NO account linking —
 * `allowDangerousEmailAccountLinking` is off, and the signIn callback rejects a
 * Google login whose email already owns a password account.
 *
 * Session strategy is JWT, not database: the Credentials provider cannot use the
 * database strategy — the adapter only creates a DB session for OAuth/email
 * sign-ins, so a credentials login would succeed and then have no session. JWT
 * covers all providers uniformly.
 */

export const isGoogleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    ...(isGoogleConfigured ? [Google] : []),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // No password hash = a Google-only account. Don't reveal which; just fail.
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username ?? user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Enforce one-method-per-email at the Google door: if this address already
      // owns a password account, refuse the Google login and tell them to use
      // their password. Returning a string redirects there.
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { passwordHash: true },
        });
        if (existing?.passwordHash) return "/signin?error=use-password";
      }
      return true;
    },
    jwt({ token, user }) {
      // `user` is only present on sign-in; persist the id onto the token.
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
