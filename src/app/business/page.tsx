import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser, requireUser } from "@/lib/session";
import { domainOf, newBrandKey } from "@/lib/brand";
import { Aurora } from "@/components/aurora";
import { Reveal } from "@/components/reveal";
import { BrandForm } from "@/components/brand-form";

export const metadata: Metadata = {
  title: "Try-on for your store",
};

const Signup = z.object({
  name: z.string().trim().min(2, "Please enter your brand's name").max(80),
  website: z.string().trim().min(4, "Please enter your store's website").max(200),
});

const STEPS = [
  ["Sign up", "Tell us your brand and website. Takes a minute."],
  ["Paste one line", "Copy your code into your store. Shopify, WooCommerce, Wix or custom."],
  ["Shoppers try it on", "A “Try it on” button appears next to Add to Cart on every product."],
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
    <section className="relative overflow-hidden px-6 pt-32 pb-24">
      <Aurora />
      <div className="relative mx-auto grid max-w-5xl items-start gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs tracking-[0.2em] text-bone-400 uppercase">For brands</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-bone-50 sm:text-6xl">
            Let shoppers <span className="text-flare italic">see it on</span> before they buy.
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-bone-300">
            Add a “Try it on” button to every product page. Shoppers upload one photo and see
            themselves wearing your clothes in about 30 seconds. More confidence at checkout,
            fewer returns.
          </p>

          <ol className="mt-10 space-y-5">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-800 text-sm text-bone-100">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-bone-50">{title}</p>
                  <p className="text-sm text-bone-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="w-full">
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
  );
}
