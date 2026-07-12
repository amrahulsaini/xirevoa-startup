import "server-only";
import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Email one-time codes for sign-up verification.
 *
 * Stored in the VerificationToken table (identifier = email, token = hashed
 * code). The code is hashed at rest so a database read can't reveal live codes.
 */

const TTL_MS = 10 * 60 * 1000;

const hash = (code: string) =>
  createHash("sha256").update(`${code}:${process.env.AUTH_SECRET ?? ""}`).digest("hex");

export async function issueOtp(email: string): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  // One live code per email — a new request invalidates the previous.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token: hash(code), expires: new Date(Date.now() + TTL_MS) },
  });

  return code;
}

/** Checks a code without consuming it — used to advance the sign-up UI. */
export async function checkOtp(email: string, code: string): Promise<boolean> {
  const row = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: hash(code) },
  });
  return Boolean(row && row.expires > new Date());
}

/** Checks and consumes a code — used at the point of account creation. */
export async function consumeOtp(email: string, code: string): Promise<boolean> {
  const ok = await checkOtp(email, code);
  if (ok) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  }
  return ok;
}
