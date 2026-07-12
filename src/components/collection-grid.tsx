"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { CATALOG, CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export function CollectionGrid({ initialCategory }: { initialCategory: string }) {
  const [category, setCategory] = useState(initialCategory);

  const visible =
    category === "all"
      ? CATALOG
      : CATALOG.filter((item) => item.category === category);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
      <header>
        <h1 className="font-display text-5xl text-bone-50 sm:text-6xl">
          The <span className="text-flare italic">Collection</span>
        </h1>
        <p className="mt-4 max-w-xl text-bone-400">
          Every piece is try-on ready. No prices yet — while we onboard India&apos;s
          local stores, this collection exists purely so you can see yourself in it.
        </p>
      </header>

      <div className="mt-10 mb-12 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm transition-colors duration-300",
              category === c.id
                ? "bg-bone-100 text-ink-950"
                : "hairline border text-bone-300 hover:bg-bone-100/6 hover:text-bone-50",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* `layout` on the grid animates cards into their new positions when the
          filter changes, instead of them snapping. */}
      <motion.div layout className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((item) => (
            <motion.div
              key={item.slug}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/studio?add=${item.slug}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-product">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end bg-linear-to-t from-ink-950/80 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <span className="flex items-center gap-2 text-sm font-medium text-bone-50">
                      <Sparkles className="size-4" />
                      Try this on
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2 pt-4">
                  <h2 className="font-medium text-bone-50">{item.name}</h2>
                  {item.fit && (
                    <span className="shrink-0 text-xs tracking-wide text-bone-400 uppercase">
                      {item.fit}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-bone-400">{item.tagline}</p>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
