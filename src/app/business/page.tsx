import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Code2, Gift, ShoppingBag, Shirt, Timer, Wrench } from "lucide-react";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser, requireUser } from "@/lib/session";
import { domainOf, newBrandKey } from "@/lib/brand";
import { Aurora } from "@/components/aurora";
import { Reveal } from "@/components/reveal";
import { BeforeAfter } from "@/components/before-after";
import { BrandForm } from "@/components/brand-form";

export const metadata: Metadata = {
  title: "Virtual try-on for your store",
  description:
    "Add a “Try it on” button to every product page. Shoppers see themselves wearing your clothes in about 30 seconds.",
  openGraph: {
    title: "Xirevoa for brands — virtual try-on in one line of code",
    description: "Shoppers see themselves in your clothes before they buy. 50 free try-ons to start.",
    images: ["/business/og.jpg"],
  },
};

const Signup = z.object({
  name: z.string().trim().min(2, "Please enter your brand's name").max(80),
  website: z.string().trim().min(4, "Please enter your store's website").max(200),
});

const STATS = [
  { icon: Code2, value: "1 line", label: "of code to install" },
  { icon: Timer, value: "~30 sec", label: "per try-on" },
  { icon: Wrench, value: "0", label: "developers needed" },
  { icon: Gift, value: "50", label: "free try-ons to start" },
];

const STEPS = [
  ["Sign up", "Tell us your brand and website. Takes a minute."],
  ["Paste one line", "Copy your code into your store once. We handle everything else."],
  ["Shoppers try it on", "A “Try it on” button appears next to Add to Cart on every product."],
];

const PLATFORMS = ["Shopify", "WooCommerce", "Wix", "Squarespace", "Custom sites"];

const FAQ = [
  [
    "Do I need to upload my catalog?",
    "No. The button reads the product photo already on your page, works out what the garment is, and puts it on the shopper. New products work the moment you publish them.",
  ],
  [
    "Will it slow my store down?",
    "No. The script loads in the background after your page, and nothing runs until a shopper taps the button.",
  ],
  [
    "What happens to shoppers' photos?",
    "A photo is used only to create that shopper's preview. It's never shown to you and never posted anywhere.",
  ],
  [
    "What can be tried on?",
    "Tees, shirts, tops, kurtis, jackets, jeans and trousers, dresses, formalwear, shoes, glasses and jewellery. On-model and flat-lay photos both work.",
  ],
  [
    "What does it cost after the free try-ons?",
    "Monthly plans based on how many try-ons your shoppers use. Failed try-ons are never charged, and a repeat of the same photo and product is free.",
  ],
];

export default async function BusinessPage() {
  const user = await currentUser();

  if (user) {
    const brand = await prisma.brand.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (brand) redirect("/business/dashboard");
  }

  async function signup(_prev: unknown, formData: FormData) {
    "use server";

    const { id: userId } = await requireUser("/business");

    const parsed = Signup.safeParse({
      name: formData.get("name"),
      website: formData.get("website"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const domain = domainOf(parsed.data.website);
    if (!domain) return { error: "That doesn't look like a website address." };

    const already = await prisma.brand.findUnique({ where: { userId } });
    if (!already) {
      await prisma.brand.create({
        data: {
          userId,
          name: parsed.data.name,
          website: `https://${domain}`,
          domain,
          key: newBrandKey(),
        },
      });
    }

    redirect("/business/dashboard");
  }

  return (
    <>
      <section className="relative overflow-hidden px-6 pt-32 pb-20">
        <Aurora />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="text-xs tracking-[0.2em] text-bone-400 uppercase">For fashion brands</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-bone-50 sm:text-6xl">
              Let shoppers <span className="text-flare italic">see it on</span> before they buy.
            </h1>
            <p className="mt-6 max-w-md leading-relaxed text-bone-300">
              Add a “Try it on” button to every product page. Shoppers upload one photo and see
              themselves wearing your clothes in about 30 seconds. More confidence at checkout,
              fewer returns.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#start"
                className="flex items-center gap-2 rounded-full bg-bone-100 px-6 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Start free
                <ArrowRight className="size-4" />
              </a>
              <Link href="/demo" className="text-sm text-bone-300 transition-colors hover:text-bone-50">
                Try the button yourself →
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <StoreMock />
          </Reveal>
        </div>
      </section>

      <section className="px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-bone-100/10 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-ink-950 p-6 sm:p-8">
              <Icon className="size-5 text-flare-rose" />
              <p className="mt-4 font-display text-4xl text-bone-50">{value}</p>
              <p className="mt-1 text-sm text-bone-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="scroll-mt-28 px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <Reveal className="mx-auto w-full max-w-sm">
            <BeforeAfter
              before="/business/tryon-before.jpg"
              after="/business/tryon-after.jpg"
              beforeLabel="Shopper's photo"
              afterLabel="Wearing your jacket"
            />
          </Reveal>
          <Reveal>
            <p className="text-xs tracking-[0.2em] text-bone-400 uppercase">Real output, not a mock-up</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-bone-50 sm:text-5xl">
              Their face. Their body. <span className="text-flare italic">Your</span> product.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-bone-300">
              Drag the slider. This is one shopper photo and one product image, straight from the
              button. The face, build and background stay untouched; only the clothing changes,
              with your exact colour, cut and detail.
            </p>
            <div className="mt-8 flex items-center gap-4 rounded-2xl bg-ink-900 p-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-white">
                <Image src="/business/product.jpg" alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-bone-100">The input: your product photo</p>
                <p className="text-sm text-bone-400">Flat-lay or on-model, as it already is on your site.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="font-display text-4xl text-bone-50">
              Live in <span className="text-flare italic">two minutes</span>.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <Reveal key={title}>
                <div className="h-full rounded-2xl bg-ink-900 p-6">
                  <span className="grid size-9 place-items-center rounded-full bg-ink-800 text-sm text-bone-100">
                    {i + 1}
                  </span>
                  <p className="mt-5 font-medium text-bone-50">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-bone-400">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm text-bone-400">Works on</span>
            {PLATFORMS.map((p) => (
              <span key={p} className="hairline rounded-full border px-4 py-1.5 text-sm text-bone-200">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="relative scroll-mt-28 overflow-hidden px-6 pb-24">
        <div className="relative mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl text-bone-50">Questions brands ask</h2>
            <dl className="mt-8 divide-y divide-bone-100/10">
              {FAQ.map(([q, a]) => (
                <div key={q} className="py-5">
                  <dt className="font-medium text-bone-100">{q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-bone-400">{a}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="w-full lg:sticky lg:top-28">
            <div className="hairline glass rounded-3xl border p-8 sm:p-10">
              <h2 className="font-display text-3xl leading-tight text-bone-50">
                Start with <span className="text-flare italic">50 free</span> try-ons.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-bone-400">
                No card, no developer needed. You&apos;ll get your code on the next screen.
              </p>
              {user ? (
                <BrandForm action={signup} />
              ) : (
                <Link
                  href="/signin?next=/business"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-bone-100 px-6 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                >
                  Sign in to get started
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function StoreMock() {
  return (
    <div className="relative mx-auto max-w-xl pb-10 lg:pb-0">
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20 ring-1 ring-black/5">
        <div className="flex items-center gap-2 border-b border-black/5 bg-neutral-100 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11px] text-neutral-500">
            yourbrand.in/products/biker-jacket
          </span>
        </div>
        <div className="grid grid-cols-[1fr_1fr] gap-5 p-5 text-neutral-900">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-50">
            <Image src="/business/product.jpg" alt="" fill sizes="280px" className="object-cover" priority />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] tracking-widest text-neutral-400 uppercase">Your brand</p>
            <p className="mt-1 text-base leading-snug font-semibold">Leather Biker Jacket</p>
            <p className="mt-1 text-sm text-neutral-600">₹4,999</p>
            <div className="mt-3 flex gap-1.5">
              {["S", "M", "L", "XL"].map((s) => (
                <span
                  key={s}
                  className={`grid size-7 place-items-center rounded border text-[11px] ${s === "M" ? "border-neutral-900" : "border-neutral-200 text-neutral-500"}`}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-auto space-y-2 pt-4">
              <div className="flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 py-2.5 text-xs font-medium text-white">
                <ShoppingBag className="size-3.5" />
                Add to cart
              </div>
              <div className="relative flex items-center justify-center gap-1.5 rounded-md border-[1.5px] border-neutral-900 py-2.5 text-xs font-semibold">
                <Shirt className="size-3.5" />
                Try it on
                <span className="absolute -top-2 -right-2 rounded-full bg-flare-rose px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  NEW
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -left-2 w-28 -rotate-3 overflow-hidden rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 ring-1 ring-black/5 sm:-left-8 sm:w-40 lg:-bottom-16">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
          <Image src="/business/tryon-after.jpg" alt="A shopper wearing the jacket" fill sizes="176px" className="object-cover" />
        </div>
        <p className="px-1 pt-2 pb-1 text-center text-[10px] font-semibold whitespace-nowrap text-neutral-900 sm:text-[11px]">
          Here&apos;s you in it ✓
        </p>
      </div>
    </div>
  );
}
