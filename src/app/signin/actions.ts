"use server";

import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { hashPassword, validateCredentials } from "@/lib/password";
import { issueOtp, checkOtp, consumeOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type OtpState =
  | { ok?: boolean; error?: string; email?: string }
  | null;

// The client navigates on `redirectTo` rather than the action issuing the
// redirect: in this Auth.js beta, signIn() inside a server action sets the
// session cookie but returns the URL instead of throwing NEXT_REDIRECT, so a
// server-side redirect never fires. Returning the target and doing a full-page
// navigation on the client also guarantees the server components (navbar, etc.)
// re-render with the new session.
export type AuthState = { error?: string; field?: string; redirectTo?: string } | null;

/** Only ever redirect within our own origin — guards against open redirects. */
function safe(next: string | undefined) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/studio";
}

/** Step 1 of sign-up: email a 6-digit verification code. */
export async function requestOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  // Cap code sends so the mailbox (and our SMTP reputation) can't be flooded.
  const gate = rateLimit(`otp:${email}`, 5, 15 * 60 * 1000);
  if (!gate.ok) {
    return { error: "Too many codes requested. Try again in a few minutes." };
  }

  // One method per email: if this address is registered by ANY method, it can't
  // sign up again — send them to sign in with the method it already uses.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true, accounts: { select: { provider: true } } },
  });
  if (existing) {
    const isGoogle = existing.accounts.some((a) => a.provider === "google");
    return {
      error: isGoogle
        ? "This email is registered with Google. Use “Continue with Google” to sign in."
        : "This email already has an account. Sign in instead.",
    };
  }

  try {
    await sendOtpEmail(email, await issueOtp(email));
  } catch {
    return { error: "We couldn't send the code. Check the address and try again." };
  }
  return { ok: true, email };
}

/** Step 2: confirm the code before showing the username/password fields. */
export async function verifyOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  if (!(await checkOtp(email, code))) {
    return { error: "That code is wrong or has expired." };
  }
  return { ok: true, email };
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safe(String(formData.get("next") ?? ""));

  // A Google-first account has no password. Point them at Google (or at adding a
  // password) instead of the useless "email and password don't match".
  const acct = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  });
  if (acct && !acct.passwordHash) {
    return {
      error: "This email uses Google sign-in. Continue with Google, or create a password on the sign-up page.",
      field: "password",
    };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "That email and password don't match.", field: "password" };
    }
    throw err;
  }
  return { redirectTo: next };
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safe(String(formData.get("next") ?? ""));

  const { ok, errors } = validateCredentials({ username, password });
  if (!ok) {
    const field = errors.username ? "username" : "password";
    return { error: errors[field], field };
  }

  // The email was proven at the OTP step; consume the code here so account
  // creation/update and email verification are one atomic decision.
  if (!(await consumeOtp(email, code))) {
    return { error: "Your email verification expired. Start again.", field: "email" };
  }

  // One method per email. requestOtp already blocks known emails; re-check here
  // to close the race between requesting the code and submitting the form.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { error: "This email already has an account. Sign in instead.", field: "email" };
  }

  const usernameTaken = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (usernameTaken) return { error: "That username is taken.", field: "username" };

  try {
    await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        username: username.toLowerCase(),
        name: username,
        passwordHash: await hashPassword(password),
      },
    });
  } catch {
    return { error: "Could not create your account. Please try again." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    // Account exists now; if auto-sign-in somehow fails, send them to sign in.
    if (err instanceof AuthError) return { redirectTo: "/signin" };
    throw err;
  }
  return { redirectTo: next };
}
