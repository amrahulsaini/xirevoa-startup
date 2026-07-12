import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, IndianRupee, Store, Users } from "lucide-react";
import { Aurora } from "@/components/aurora";
import { Reveal, RevealLine, RevealWords } from "@/components/reveal";

export const metadata: Metadata = {
  title: "For Stores",
  description:
    "List your stock on Xirevoa and let shoppers across India see themselves wearing it — before they walk in.",
};

const PITCH = [
  {
    icon: Camera,
    title: "Photograph it once",
    body: "Lay the garment flat against a white wall and take one photo. That's your listing. No models, no studio, no photoshoot budget.",
  },
  {
    icon: Users,
    title: "Every shopper is a fitting room",
    body: "They upload a photo of themselves and see your garment on their own body. Not a model who looks nothing like them.",
  },
  {
    icon: IndianRupee,
    title: "Fewer returns, more walk-ins",
    body: "People who've already seen themselves in a piece arrive knowing they want it. They come to buy, not to browse.",
  },
];

export default function StoresPage() {
  return (
    <>
      <section className="relative flex min-h-[85dvh] items-center overflow-hidden px-6 pt-32 pb-20">
        <Aurora />
        <div className="mx-auto max-w-3xl text-center">
          <Reveal delay={0.1}>
            <span className="hairline glass inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs tracking-wide text-bone-300 uppercase">
              <Store className="size-3.5 text-flare-amber" />
              Onboarding stores now
            </span>
          </Reveal>

          <h1 className="mt-8 font-display text-5xl leading-[1.05] tracking-tight text-bone-50 sm:text-6xl lg:text-7xl">
            <RevealWords text="Your shop." delay={0.2} />
            <br />
            <RevealLine
              text="All of India."
              delay={0.35}
              className="text-flare italic"
            />
          </h1>

          <Reveal delay={0.7}>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-bone-300">
              You already have the stock. Xirevoa gives it a fitting room that
              anyone in the country can walk into — from their phone, at midnight,
              wearing whatever you have on the rack.
            </p>
          </Reveal>

          <Reveal delay={0.85}>
            <Link
              href="/stores/apply"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-bone-100 px-7 py-4 font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
            >
              List your store
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <p className="mt-6 text-sm text-bone-400">
              Free during beta · No commission · Takes about five minutes
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-px overflow-hidden rounded-2xl bg-bone-100/10 md:grid-cols-3">
            {PITCH.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.12}>
                <div className="group h-full bg-ink-950 p-10 transition-colors duration-500 hover:bg-ink-900">
                  <p.icon className="size-6 text-flare-rose transition-transform duration-500 group-hover:-translate-y-1" />
                  <h2 className="mt-10 text-xl font-medium text-bone-50">
                    {p.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-bone-400">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight text-bone-50 sm:text-5xl">
              We&apos;re starting with a handful of stores.
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-bone-300">
              Every listing is reviewed by a person before it goes live. If you
              sell clothing, denim, eyewear or jewellery anywhere in India, we
              want to talk.
            </p>
            <Link
              href="/stores/apply"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-bone-100 px-7 py-4 font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
            >
              Apply to list
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
