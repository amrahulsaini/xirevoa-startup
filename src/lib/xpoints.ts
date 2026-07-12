import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import type { XPointReason } from "@/generated/prisma/enums";

/**
 * The XPoints economy.
 *
 * Grounded in real cost: one try-on is a gemini-3-pro-image call at $0.134
 * (~₹11.5), plus input tokens — call it ~₹13 landed. At 7 XPoints per
 * generation, an XPoint must be worth more than ~₹1.90 just to break even, so
 * the packs below are priced from that floor, not plucked from the air.
 *
 * Balance lives on User.xpoints, but every change goes through spend()/grant()
 * here so the append-only XPointTx ledger and the cached balance can never drift.
 */

/** What each action costs. */
export const COST = {
  tryon: 7,
  haircut: 7,
} as const;

/** What a new account gets — worth ~2 try-ons. */
export const SIGNUP_BONUS = 20;

export interface Pack {
  id: string;
  xpoints: number;
  /** Paise. Money is never a float. */
  amountPaise: number;
  label: string;
  /** Marketing line — how many try-ons it buys. */
  blurb: string;
  popular?: boolean;
}

/**
 * Packs. Cost basis ~₹13/try-on (7 XP), so ~₹1.90 per XPoint at zero margin.
 * Bigger packs are cheaper per point — normal volume discounting, and the margin
 * still holds at the top tier.
 */
export const PACKS: Pack[] = [
  {
    id: "starter",
    xpoints: 70,
    amountPaise: 29900, // ₹299 → ₹4.27/XP → ₹29.90 per try-on vs ₹13 cost
    label: "Starter",
    blurb: "10 try-ons",
  },
  {
    id: "popular",
    xpoints: 210,
    amountPaise: 79900, // ₹799 → ₹3.80/XP → ₹26.63 per try-on
    label: "Regular",
    blurb: "30 try-ons",
    popular: true,
  },
  {
    id: "pro",
    xpoints: 700,
    amountPaise: 229900, // ₹2,299 → ₹3.28/XP → ₹22.99 per try-on
    label: "Pro",
    blurb: "100 try-ons",
  },
];

export const packById = (id: string) => PACKS.find((p) => p.id === id);

/* ─────────────────────────────── Balance ───────────────────────────────── */

export async function getBalance(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { xpoints: true },
  });
  return u?.xpoints ?? 0;
}

/**
 * Debit points for an action.
 *
 * Returns false if they can't afford it. The decrement is guarded by a
 * conditional update (`xpoints: { gte: amount }`) so two concurrent try-ons
 * can't both pass a balance check and drive the account negative.
 */
export async function spend(
  userId: string,
  amount: number,
  reason: XPointReason,
  note?: string,
): Promise<{ ok: boolean; balance: number }> {
  try {
    const updated = await prisma.user.update({
      // The `gte` guard is the whole point: it makes the check and the debit
      // one atomic statement.
      where: { id: userId, xpoints: { gte: amount } },
      data: { xpoints: { decrement: amount } },
      select: { xpoints: true },
    });

    await prisma.xPointTx.create({
      data: {
        userId,
        delta: -amount,
        reason,
        balance: updated.xpoints,
        note,
      },
    });

    return { ok: true, balance: updated.xpoints };
  } catch {
    // The conditional update matched no row → insufficient balance.
    return { ok: false, balance: await getBalance(userId) };
  }
}

/** Credit points (purchase, bonus, refund). */
export async function grant(
  userId: string,
  amount: number,
  reason: XPointReason,
  note?: string,
): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { xpoints: { increment: amount } },
    select: { xpoints: true },
  });

  await prisma.xPointTx.create({
    data: { userId, delta: amount, reason, balance: updated.xpoints, note },
  });

  return updated.xpoints;
}

/* ──────────────────────── Free-grant abuse guard ───────────────────────── */

export const hashIp = (ip: string) =>
  createHash("sha256").update(`${ip}:${process.env.AUTH_SECRET ?? ""}`).digest("hex");

/** More than this many free grants from one IP in the window looks like farming. */
const IP_LIMIT = 3;
const IP_WINDOW_DAYS = 30;

/**
 * Grant the signup bonus — once per device, and rate-limited per IP.
 *
 * Deliberately NOT one-per-IP: most Indian mobile traffic sits behind CGNAT, so
 * thousands of unrelated people share a single address and a hard block would
 * deny real users. The device fingerprint is the strong signal; the IP is only a
 * throttle on obvious farming.
 *
 * Returns the points actually granted (0 if refused).
 */
export async function grantSignupBonus(
  userId: string,
  fingerprint: string | null,
  ip: string,
): Promise<number> {
  // No fingerprint (JS blocked, exotic browser) → no free points rather than a
  // free-for-all. They can still buy, and support can grant manually.
  if (!fingerprint) return 0;

  const ipHash = hashIp(ip);

  const [deviceSeen, ipCount] = await Promise.all([
    prisma.freeGrant.findUnique({ where: { fingerprint }, select: { id: true } }),
    prisma.freeGrant.count({
      where: {
        ipHash,
        createdAt: {
          gte: new Date(Date.now() - IP_WINDOW_DAYS * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Already claimed on this device — incognito and cleared cookies don't help.
  if (deviceSeen) return 0;
  if (ipCount >= IP_LIMIT) return 0;

  try {
    await prisma.freeGrant.create({ data: { fingerprint, ipHash, userId } });
  } catch {
    // Unique violation → a concurrent signup claimed this device first.
    return 0;
  }

  await grant(userId, SIGNUP_BONUS, "signup_bonus", "New account bonus");
  return SIGNUP_BONUS;
}
