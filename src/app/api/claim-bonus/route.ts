import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { grantSignupBonus, getBalance } from "@/lib/xpoints";

export const runtime = "nodejs";

const Body = z.object({
  // SHA-256 hex of the device signals.
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
});

/**
 * Claims the signup bonus for the signed-in account.
 *
 * Called once from the client after sign-up/first sign-in, because the device
 * fingerprint can only be computed in the browser. The IP is read server-side —
 * never taken from the request body, which the client controls.
 *
 * Safe to call repeatedly: the grant is gated on a unique fingerprint row, so a
 * second call is a no-op.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Signed out." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Any account that has already received a signup bonus is done.
  const already = await prisma.xPointTx.findFirst({
    where: { userId, reason: "signup_bonus" },
    select: { id: true },
  });
  if (already) {
    return NextResponse.json({ granted: 0, xpoints: await getBalance(userId) });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const granted = await grantSignupBonus(userId, parsed.data.fingerprint, ip);

  return NextResponse.json({ granted, xpoints: await getBalance(userId) });
}
