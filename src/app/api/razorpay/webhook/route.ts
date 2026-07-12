import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { grant } from "@/lib/xpoints";

export const runtime = "nodejs";

/**
 * Razorpay webhook — the ONLY place XPoints get credited for a purchase.
 *
 * The browser is never trusted to say "I paid". It can lie, and a client-side
 * "payment succeeded, add my points" call would be free money. Razorpay signs
 * every webhook with a shared secret; we verify that signature against the RAW
 * body before believing a word of it.
 *
 * Idempotent: Razorpay retries, and a paid order is only ever credited once.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Must be the raw body — re-serialising parsed JSON changes the bytes and the
  // signature will never match.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = createHmac("sha256", secret).update(raw).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // timingSafeEqual throws on length mismatch, so check that first.
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    console.warn("[razorpay/webhook] bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  const payment = event?.payload?.payment?.entity;

  if (event?.event !== "payment.captured" || !payment?.order_id) {
    // Anything else (authorized, failed, refunds) — acknowledge so Razorpay
    // stops retrying, but don't credit.
    return NextResponse.json({ ok: true });
  }

  const order = await prisma.order.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });
  if (!order) {
    console.error("[razorpay/webhook] unknown order", payment.order_id);
    return NextResponse.json({ ok: true });
  }

  // Already credited — a retry, not a second purchase.
  if (order.status === "paid") return NextResponse.json({ ok: true });

  // Defence in depth: the amount Razorpay captured must equal what we billed.
  if (payment.amount !== order.amountPaise) {
    console.error(
      `[razorpay/webhook] amount mismatch: captured ${payment.amount}, expected ${order.amountPaise}`,
    );
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      razorpayPaymentId: payment.id,
      paidAt: new Date(),
    },
  });

  await grant(
    order.userId,
    order.xpoints,
    "purchase",
    `${order.packId} · ${payment.id}`,
  );

  return NextResponse.json({ ok: true });
}
