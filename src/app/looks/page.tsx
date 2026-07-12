import type { Metadata } from "next";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Reveal } from "@/components/reveal";
import { LooksGallery, type LookCard } from "@/components/looks-gallery";

export const metadata: Metadata = {
  title: "Your Looks",
  description: "Every look and haircut you've generated on Xirevoa.",
};

export default async function LooksPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const user = await requireUser("/looks");
  const { kind } = await searchParams;

  const looks = await prisma.look.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { garments: { include: { garment: true } } },
    take: 120,
  });

  // Flatten to something the client gallery can render without leaking Prisma types.
  const cards: LookCard[] = looks.map((l) => ({
    id: l.id,
    kind: l.kind,
    url: `/api/media/${l.imageKey}`,
    title:
      l.kind === "haircut"
        ? (l.title ?? "Haircut")
        : l.garments.map((g) => g.garment.name).join(" · ") || "Try-on",
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
      <header>
        <h1 className="font-display text-5xl text-bone-50 sm:text-6xl">
          Your <span className="text-flare italic">Looks</span>
        </h1>
        <p className="mt-4 max-w-lg text-bone-400">
          Everything you&apos;ve generated — outfits and haircuts. Private to you;
          nobody else can see these.
        </p>
      </header>

      {cards.length === 0 ? (
        <Reveal className="mt-16">
          <div className="hairline flex flex-col items-center rounded-2xl border border-dashed py-24 text-center">
            <Shirt className="size-6 text-bone-500" />
            <p className="mt-5 font-medium text-bone-100">Nothing generated yet.</p>
            <p className="mt-2 max-w-xs text-sm text-bone-400">
              Fit an outfit in the Studio or try a new cut in the Salon, and it&apos;ll
              show up here.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/studio"
                className="rounded-full bg-bone-100 px-6 py-3 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03] active:scale-95"
              >
                Open the Studio
              </Link>
              <Link
                href="/salon"
                className="hairline rounded-full border px-6 py-3 text-sm font-medium text-bone-200 transition-colors hover:bg-bone-100/6 hover:text-bone-50"
              >
                Open the Salon
              </Link>
            </div>
          </div>
        </Reveal>
      ) : (
        <LooksGallery cards={cards} initialKind={kind ?? "all"} />
      )}
    </div>
  );
}
