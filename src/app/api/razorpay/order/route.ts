import { NextResponse, type NextRequest } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { packById } from "@/lib/xpoints";

export const runtime = "nodejs";

const Body = z.object({ packId: z.string() });

/**
 * Creates a Razorpay order for an XPoints pack.
 *
 * The amount is taken from OUR pack table, never from the request body — a
 * client that could name its own price would be able to buy 700 XPoints for ₹1.
 * Points are NOT credited here; only the signature-verified webhook does that.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pack = packById(parsed.data.packId);
  if (!pack) {
    return NextResponse.json({ error: "Unknown pack." }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payments aren't configured yet." },
      { status: 503 },
    );
  }

  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await rzp.orders.create({
      amount: pack.amountPaise, // paise, from our table
      currency: "INR",
      receipt: `xp_${userId.slice(0, 8)}_${Date.now()}`,
      notes: { userId, packId: pack.id, xpoints: String(pack.xpoints) },
    });

    await prisma.order.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        packId: pack.id,
        amountPaise: pack.amountPaise,
        xpoints: pack.xpoints,
      },
    });

    // key_id is public by design (it goes in the checkout widget). The secret
    // never leaves the server.
    return NextResponse.json({
      orderId: order.id,
      amount: pack.amountPaise,
      currency: "INR",
      keyId,
      xpoints: pack.xpoints,
    });
  } catch (err) {
    console.error("[razorpay/order]", (err as Error).message);
    return NextResponse.json(
      { error: "Couldn't start the payment. Please try again." },
      { status: 502 },
    );
  }
}
