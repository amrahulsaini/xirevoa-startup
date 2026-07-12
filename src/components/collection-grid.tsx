"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search, X } from "lucide-react";
import { CATALOG, CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export function CollectionGrid({ initialCategory }: { initialCategory: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");

  // 245 pieces is too many to browse by category alone, so search matches name,
  // fit and tagline. Memoised so typing doesn't re-scan on unrelated renders.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.fit?.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.category.includes(q)
      );
    });
  }, [category, query]);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
      <header>
        <h1 className="font-display text-5xl text-bone-50 sm:text-6xl">
          The <span className="text-flare italic">Collection</span>
        </h1>
        <p className="mt-4 max-w-xl text-bone-400">
          {CATALOG.length}&nbsp;pieces, every one try-on ready. No prices yet —
          while we onboard India&apos;s local stores, this collection exists
          purely so you can see yourself in it.
        </p>
      </header>

      {/* Search */}
      <div className="relative mt-10 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-bone-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — baggy, silver, chelsea, mustard…"
          className="hairline w-full rounded-full border bg-ink-900 py-3 pr-10 pl-11 text-sm text-bone-100 placeholder:text-bone-500"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center rounded-full text-bone-400 hover:text-bone-100"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-6 mb-12 flex flex-wrap gap-2">
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

      {visible.length === 0 && (
        <div className="hairline rounded-2xl border border-dashed py-24 text-center">
          <p className="font-medium text-bone-100">Nothing matches “{query}”.</p>
          <p className="mt-2 text-sm text-bone-400">
            Try a fit, a colour, or a style — like “bootcut”, “olive” or “loafer”.
          </p>
        </div>
      )}

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
                      Try this on
                      <ArrowRight className="size-4" />
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
