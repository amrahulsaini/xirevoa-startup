import type { Metadata } from "next";
import { Check } from "lucide-react";
import { auth } from "@/auth";
import { getBalance, PACKS, COST, SIGNUP_BONUS } from "@/lib/xpoints";
import { Aurora } from "@/components/aurora";
import { Reveal } from "@/components/reveal";
import { BuyButton } from "@/components/buy-button";

export const metadata: Metadata = {
  title: "XPoints",
  description: "Top up your XPoints to keep trying things on.",
};

const rupees = (paise: number) => (paise / 100).toLocaleString("en-IN");

export default async function PricingPage() {
  const session = await auth();
  const balance = session?.user?.id ? await getBalance(session.user.id) : null;

  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24">
      <Aurora />

      <div className="mx-auto max-w-5xl">
        <Reveal>
          <header className="text-center">
            <h1 className="font-display text-5xl leading-tight text-bone-50 sm:text-6xl">
              Top up your <span className="text-flare italic">XPoints</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-bone-400">
              Every try-on costs {COST.tryon} XPoints. New accounts start with{" "}
              {SIGNUP_BONUS} free.
            </p>
            {balance !== null && (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-bone-100/10 bg-ink-900 px-5 py-2.5 text-sm text-bone-200">
                Balance
                <span className="font-semibold text-bone-50">{balance} XP</span>
                <span className="text-bone-500">
                  · {Math.floor(balance / COST.tryon)} try-ons
                </span>
              </p>
            )}
          </header>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PACKS.map((pack, i) => (
            <Reveal key={pack.id} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-7 ${
                  pack.popular
                    ? "border-flare-rose/50 bg-ink-900"
                    : "hairline border bg-ink-950"
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-7 rounded-full bg-flare-rose px-3 py-1 text-xs font-medium text-bone-50">
                    Most popular
                  </span>
                )}

                <h2 className="text-sm tracking-[0.18em] text-bone-400 uppercase">
                  {pack.label}
                </h2>

                <p className="mt-4 font-display text-5xl text-bone-50">
                  ₹{rupees(pack.amountPaise)}
                </p>

                <p className="mt-2 text-bone-300">
                  {pack.xpoints} XPoints
                  <span className="text-bone-500"> · {pack.blurb}</span>
                </p>

                <ul className="mt-6 space-y-2.5 text-sm text-bone-400">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-flare-rose" />
                    {pack.blurb} at {COST.tryon} XP each
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-flare-rose" />
                    Points never expire
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-flare-rose" />
                    Refunded if a fit fails
                  </li>
                </ul>

                <div className="mt-8 pt-2">
                  <BuyButton
                    packId={pack.id}
                    label={session?.user ? "Buy XPoints" : "Sign in to buy"}
                    signedIn={Boolean(session?.user)}
                    highlight={pack.popular}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="mt-12 text-center text-xs leading-relaxed text-bone-500">
            Payments are handled by Razorpay. We never see your card details.
            <br />
            A cached look — the same photo in the same pieces — is always free.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
