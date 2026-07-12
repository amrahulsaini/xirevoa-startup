"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "./spinner";
import { cn } from "@/lib/cn";

/**
 * Razorpay checkout.
 *
 * The button never credits points itself — it can't be trusted to. It creates an
 * order server-side (where the price comes from our own table), opens Razorpay's
 * widget, and then waits for the signed webhook to land before showing the new
 * balance. That's why success polls rather than optimistically adding points.
 */

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme?: { color?: string };
  handler: (r: { razorpay_payment_id: string }) => void;
  modal?: { ondismiss?: () => void };
}
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => { open: () => void };
  }
}

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_JS;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function BuyButton({
  packId,
  label,
  signedIn,
  highlight,
}: {
  packId: string;
  label: string;
  signedIn: boolean;
  highlight?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const buy = async () => {
    if (!signedIn) {
      router.push("/signin?next=/pricing");
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const ok = await loadCheckout();
      if (!ok) throw new Error("checkout script blocked");

      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Could not start payment");

      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Xirevoa",
        description: `${order.xpoints} XPoints`,
        order_id: order.orderId,
        theme: { color: "#e8367a" },
        handler: () => {
          // Payment captured on Razorpay's side. Points are credited by the
          // signed webhook, which may land a beat later — so we poll rather than
          // pretending we know the balance.
          setStatus("Payment received — adding your XPoints…");
          setTimeout(() => router.refresh(), 2500);
          setTimeout(() => router.refresh(), 6000);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setStatus(null);
          },
        },
      });

      rzp.open();
    } catch (err) {
      setStatus((err as Error).message || "Couldn't start the payment.");
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={buy}
        disabled={busy}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70",
          highlight
            ? "bg-bone-100 text-ink-950 hover:scale-[1.02]"
            : "hairline border text-bone-100 hover:bg-bone-100/6",
        )}
      >
        {busy ? (
          <>
            <Spinner className="text-sm" />
            Opening…
          </>
        ) : (
          label
        )}
      </button>
      {status && <p className="mt-3 text-center text-xs text-bone-400">{status}</p>}
    </div>
  );
}
