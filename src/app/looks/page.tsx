import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Your Looks",
  description: "Every look you've fitted on Xirevoa.",
};

export default async function LooksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/looks");

  const looks = await prisma.look.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { garments: { include: { garment: true } } },
    take: 60,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
      <header>
        <h1 className="font-display text-5xl text-bone-50 sm:text-6xl">
          Your <span className="text-flare italic">Looks</span>
        </h1>
        <p className="mt-4 max-w-lg text-bone-400">
          Every look you&apos;ve fitted. Private to you — nobody else can see these.
        </p>
      </header>

      {looks.length === 0 ? (
        <Reveal className="mt-16">
          <div className="hairline flex flex-col items-center rounded-2xl border border-dashed py-24 text-center">
            <Sparkles className="size-6 text-bone-500" />
            <p className="mt-5 font-medium text-bone-100">Nothing fitted yet.</p>
            <p className="mt-2 max-w-xs text-sm text-bone-400">
              Head to the Studio, stack a look, and it&apos;ll show up here.
            </p>
            <Link
              href="/studio"
              className="mt-8 rounded-full bg-bone-100 px-6 py-3 text-sm font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
            >
              Open the Studio
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {looks.map((look, i) => (
            <Reveal key={look.id} delay={(i % 4) * 0.06}>
              <div className="group">
                <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-ink-900">
                  <Image
                    src={`/api/media/${look.imageKey}`}
                    alt={look.garments.map((g) => g.garment.name).join(", ")}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-bone-300">
                  {look.garments.map((g) => g.garment.name).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-bone-500">
                  {look.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
