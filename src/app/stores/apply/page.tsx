import type { Metadata } from "next";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Aurora } from "@/components/aurora";
import { Reveal } from "@/components/reveal";
import { StoreForm } from "@/components/store-form";
import { StoreStatusCard } from "@/components/store-status";

export const metadata: Metadata = {
  title: "List your store",
};

const Application = z.object({
  name: z.string().trim().min(2, "Please enter your store's name").max(80),
  city: z.string().trim().min(2, "Please enter your city").max(60),
  state: z.string().trim().min(2, "Please enter your state").max(60),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[- ]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

/** URL-safe, collision-resistant store handle. */
function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  // Suffix guarantees uniqueness — two "Sharma Garments" in different cities
  // is the normal case, not the edge case.
  return `${base || "store"}-${Math.random().toString(36).slice(2, 7)}`;
}

export default async function ApplyPage() {
  const { id: userId } = await requireUser("/stores/apply");

  const existing = await prisma.store.findUnique({ where: { userId } });

  async function apply(_prev: unknown, formData: FormData) {
    "use server";

    const parsed = Application.safeParse({
      name: formData.get("name"),
      city: formData.get("city"),
      state: formData.get("state"),
      phone: formData.get("phone"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    // One store per account. Without this, a double-submit or a back-button
    // resubmit creates a duplicate application for the same shop.
    const already = await prisma.store.findUnique({ where: { userId } });
    if (already) return { error: "You've already applied." };

    await prisma.store.create({
      data: {
        userId,
        slug: slugify(parsed.data.name),
        ...parsed.data,
      },
    });

    return { ok: true };
  }

  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-32">
      <Aurora />
      <Reveal className="w-full max-w-md">
        {existing ? (
          <StoreStatusCard name={existing.name} status={existing.status} />
        ) : (
          <div className="hairline glass rounded-3xl border p-8 sm:p-10">
            <h1 className="font-display text-4xl leading-tight text-bone-50">
              List your <span className="text-flare italic">store</span>.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-bone-400">
              Tell us about your shop. A person reviews every application — we&apos;ll
              call you on the number below.
            </p>
            <StoreForm action={apply} />
          </div>
        )}
      </Reveal>
    </section>
  );
}
