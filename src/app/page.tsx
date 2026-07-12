import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera, Layers, Sparkles, Store } from "lucide-react";
import { Aurora } from "@/components/aurora";
import { BeforeAfter } from "@/components/before-after";
import { Reveal, RevealLine, RevealWords } from "@/components/reveal";
import { CATALOG } from "@/lib/catalog";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <HowItWorks />
      <CollectionRail />
      <ForStores />
      <FinalCta />
    </>
  );
}

/* ─────────────────────────────── Hero ─────────────────────────────── */

function Hero() {
  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden px-6 pt-32 pb-20">
      <Aurora />

      {/* Text column gets the extra room — the display serif headline is wide,
          and the showcase image is happiest at its natural 3:4. */}
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Reveal delay={0.1}>
            <span className="hairline glass inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs tracking-wide text-bone-300 uppercase">
              <Sparkles className="size-3.5 text-flare-amber" />
              Now in open beta
            </span>
          </Reveal>

          <h1 className="mt-8 font-display text-5xl leading-[1.05] tracking-tight text-nowrap text-bone-50 sm:text-6xl lg:text-7xl">
            <RevealWords text="Try it on." delay={0.2} />
            <br />
            <RevealLine
              text="Before you own it."
              delay={0.35}
              className="text-flare italic"
            />
          </h1>

          <Reveal delay={0.7}>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-bone-300">
              Upload one photo. See yourself in denim, tees, shirts, eyewear and
              jewellery — on your body, your skin, your face. No fitting room,
              no queue, no guessing.
            </p>
          </Reveal>

          <Reveal delay={0.85}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/studio"
                className="group flex items-center gap-2 rounded-full bg-bone-100 px-7 py-4 font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
              >
                Open the Studio
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/collection"
                className="hairline rounded-full border px-7 py-4 font-medium text-bone-200 transition-colors duration-300 hover:bg-bone-100/6 hover:text-bone-50"
              >
                Browse the collection
              </Link>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <p className="mt-8 text-sm text-bone-400">
              Free while in beta · Your photo is never shown to anyone else
            </p>
          </Reveal>
        </div>

        {/* The proof. Drag it. */}
        <Reveal delay={0.4} y={40}>
          <div className="flare-border relative mx-auto w-full max-w-md rounded-2xl">
            <BeforeAfter before="/showcase/before.png" after="/showcase/after.png" />
          </div>
          <p className="mt-5 text-center text-sm text-bone-400">
            Drag to reveal — one upload, three garments, one pass.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────── Marquee ───────────────────────────── */

const TICKER = [
  "Baggy",
  "Straight",
  "Bootcut",
  "Slim",
  "Oversized",
  "Boxy",
  "Linen",
  "Silk",
  "Aviators",
  "Jhumkas",
  "Cuban Links",
  "Trucker Denim",
];

function Marquee() {
  return (
    <section className="hairline overflow-hidden border-y py-6">
      {/* Track is duplicated so the -50% translate loops seamlessly */}
      <div
        className="flex w-max gap-10 whitespace-nowrap"
        style={{ animation: "marquee 32s linear infinite" }}
      >
        {[...TICKER, ...TICKER].map((word, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-display text-2xl text-bone-400"
          >
            {word}
            <span className="size-1 rounded-full bg-flare-rose" />
          </span>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────── How it works ────────────────────────── */

const STEPS = [
  {
    icon: Camera,
    step: "01",
    title: "Upload one photo",
    body: "A single full-body shot, taken on your phone against any plain wall. That's the whole setup.",
  },
  {
    icon: Layers,
    step: "02",
    title: "Stack a look",
    body: "Pick a tee, add jeans, throw on aviators and a chain. Xirevoa fits them all in one pass — so your face never drifts.",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "See yourself",
    body: "Not a model who looks nothing like you. You — your build, your skin tone, your face, wearing the actual garment.",
  },
];

function HowItWorks() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl font-display text-5xl leading-tight text-bone-50 sm:text-6xl">
            The fitting room, <span className="text-flare italic">reduced</span> to
            three steps.
          </h2>
        </Reveal>

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl bg-bone-100/10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.12}>
              <div className="group h-full bg-ink-950 p-10 transition-colors duration-500 hover:bg-ink-900">
                <div className="flex items-center justify-between">
                  <s.icon className="size-6 text-flare-rose transition-transform duration-500 group-hover:-translate-y-1" />
                  <span className="font-display text-5xl text-ink-600 transition-colors duration-500 group-hover:text-ink-500">
                    {s.step}
                  </span>
                </div>
                <h3 className="mt-10 text-xl font-medium text-bone-50">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-bone-400">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Collection preview ─────────────────────── */

function CollectionRail() {
  const featured = CATALOG.slice(0, 8);

  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-5xl leading-tight text-bone-50 sm:text-6xl">
              The founding <span className="text-flare italic">collection</span>
            </h2>
            <Link
              href="/collection"
              className="group flex items-center gap-2 text-sm text-bone-300 transition-colors hover:text-bone-50"
            >
              See all {CATALOG.length} pieces
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((item, i) => (
            <Reveal key={item.slug} delay={(i % 4) * 0.08}>
              <Link
                href={`/studio?add=${item.slug}`}
                className="group block overflow-hidden rounded-xl"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-bone-50">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                  {/* Reveals on hover — the whole promise in one line */}
                  <div className="absolute inset-0 flex items-end bg-linear-to-t from-ink-950/80 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <span className="flex items-center gap-2 text-sm font-medium text-bone-50">
                      <Sparkles className="size-4" />
                      Try this on
                    </span>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium text-bone-50">{item.name}</h3>
                    {item.fit && (
                      <span className="shrink-0 text-xs tracking-wide text-bone-400 uppercase">
                        {item.fit}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-bone-400">{item.tagline}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── For stores ─────────────────────────── */

function ForStores() {
  return (
    <section className="px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="hairline relative overflow-hidden rounded-3xl border bg-ink-900 px-8 py-20 text-center sm:px-16">
            <div
              aria-hidden
              className="absolute -top-32 left-1/2 size-[40rem] -translate-x-1/2 rounded-full opacity-20 blur-[100px]"
              style={{
                background:
                  "radial-gradient(circle, var(--color-flare-violet), transparent 65%)",
              }}
            />
            <Store className="mx-auto size-7 text-flare-amber" />
            <h2 className="mx-auto mt-8 max-w-3xl font-display text-4xl leading-tight text-bone-50 sm:text-5xl">
              Every shop on your street is about to get a{" "}
              <span className="text-flare italic">
                fitting room the size of India
              </span>
              .
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-bone-300">
              We&apos;re onboarding local stores now. List your stock, and shoppers
              anywhere can see themselves wearing it — before they walk in.
            </p>
            <Link
              href="/stores"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-bone-100 px-7 py-4 font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
            >
              List your store
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────── Final CTA ──────────────────────────── */

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-6 py-40 text-center">
      <Aurora />
      <Reveal>
        <h2 className="mx-auto max-w-4xl font-display text-6xl leading-[0.95] text-bone-50 sm:text-8xl">
          Stop imagining <span className="text-flare italic">the fit</span>.
        </h2>
        <Link
          href="/studio"
          className="group mt-12 inline-flex items-center gap-2 rounded-full bg-bone-100 px-8 py-4 text-lg font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
        >
          Open the Studio
          <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </section>
  );
}
