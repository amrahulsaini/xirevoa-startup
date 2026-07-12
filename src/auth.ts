import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { magicLinkEmail } from "@/lib/email";

/**
 * Auth.js.
 *
 * Two ways in, on purpose: Google for the tap-and-go path, and a magic link for
 * the large share of Indian shoppers who don't want to hand a fashion site their
 * Google account. No passwords — nothing to leak, nothing to reset.
 */
/**
 * Google OAuth needs a client ID/secret that can only be minted in the Cloud
 * Console. Until those exist, registering the provider anyway would give
 * shoppers a "Continue with Google" button that dead-ends in an Auth.js error.
 * Magic-link sign-in works on its own, so we simply omit Google until it's real.
 */
export const isGoogleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
  },
  providers: [
    ...(isGoogleConfigured
      ? [
          Google({
            // Same human, same verified email — link the accounts rather than
            // stranding someone who used a magic link first and Google later.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Auth.js's default email is plain and unbranded; a shopper who asked for
      // a sign-in link and gets a bare grey box assumes it's phishing.
      sendVerificationRequest: magicLinkEmail,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      // Expose the user id so server code can load their looks without a
      // second lookup by email.
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
