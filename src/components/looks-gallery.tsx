"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Maximize2, X } from "lucide-react";
import { ShareButton } from "./share-button";
import { FeedToggle } from "./feed-toggle";
import { cn } from "@/lib/cn";

export interface LookCard {
  id: string;
  kind: "tryon" | "haircut";
  url: string;
  title: string;
  createdAt: string;
  /** Listed on the public feed. Separate from having a share link. */
  inFeed: boolean;
}

const TABS = [
  { id: "all", label: "Everything" },
  { id: "tryon", label: "Outfits" },
  { id: "haircut", label: "Haircuts" },
  // So you can audit what you've made public without hunting through the grid.
  { id: "feed", label: "On feed" },
] as const;

/**
 * The saved-looks gallery.
 *
 * This is where a notification lands, so it has to actually be useful when you
 * get here: every card can be downloaded or opened full-size, and outfits and
 * haircuts live side by side because to the user they're the same thing.
 */
export function LooksGallery({
  cards,
  initialKind,
}: {
  cards: LookCard[];
  initialKind: string;
}) {
  const [kind, setKind] = useState(initialKind);
  const [zoom, setZoom] = useState<LookCard | null>(null);

  const visible =
    kind === "all"
      ? cards
      : kind === "feed"
        ? cards.filter((c) => c.inFeed)
        : cards.filter((c) => c.kind === kind);

  const counts = {
    all: cards.length,
    tryon: cards.filter((c) => c.kind === "tryon").length,
    haircut: cards.filter((c) => c.kind === "haircut").length,
    feed: cards.filter((c) => c.inFeed).length,
  };

  return (
    <>
      <div className="mt-10 mb-10 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setKind(t.id)}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm transition-colors duration-300",
              kind === t.id
                ? "bg-bone-100 text-ink-950"
                : "hairline border text-bone-300 hover:bg-bone-100/6 hover:text-bone-50",
            )}
          >
            {t.label}
            <span className="ml-2 text-xs opacity-60">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {visible.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl bg-ink-900",
                  c.kind === "haircut" ? "aspect-square" : "aspect-3/4",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- /api/media, already sized */}
                <img
                  src={c.url}
                  alt={c.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />

                {/* Actions — the thing that was missing entirely */}
                <div className="absolute inset-0 flex items-end justify-end gap-2 bg-linear-to-t from-ink-950/70 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    onClick={() => setZoom(c)}
                    aria-label="View full size"
                    className="glass grid size-9 place-items-center rounded-full text-bone-100 transition-transform hover:scale-110"
                  >
                    <Maximize2 className="size-4" />
                  </button>
                  <FeedToggle compact lookId={c.id} inFeed={c.inFeed} />
                  <ShareButton compact lookId={c.id} label={c.title} />
                  <a
                    href={c.url}
                    download={`xirevoa-${c.kind}-${c.id.slice(0, 6)}.png`}
                    aria-label="Download"
                    className="glass grid size-9 place-items-center rounded-full text-bone-100 transition-transform hover:scale-110"
                  >
                    <Download className="size-4" />
                  </a>
                </div>

                <span className="glass absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] tracking-wide text-bone-200 uppercase">
                  {c.kind === "haircut" ? "Haircut" : "Outfit"}
                </span>

                {/* Always visible, not just on hover — you should be able to see
                    at a glance what's public without touching anything. */}
                {c.inFeed && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-flare-rose px-2.5 py-1 text-[10px] font-medium tracking-wide text-bone-50 uppercase">
                    On feed
                  </span>
                )}
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-bone-300">
                {c.title}
              </p>
              <p className="mt-1 text-xs text-bone-500">
                {new Date(c.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              {/* Always visible on touch, where hover doesn't exist. */}
              <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden">
                <a
                  href={c.url}
                  download={`xirevoa-${c.kind}-${c.id.slice(0, 6)}.png`}
                  className="hairline flex items-center justify-center gap-1.5 rounded-full border py-2 text-xs text-bone-300 transition-colors hover:bg-bone-100/6 hover:text-bone-50"
                >
                  <Download className="size-3.5" />
                  Save
                </a>
                <ShareButton lookId={c.id} label={c.title} className="py-2 text-xs" />
                <FeedToggle lookId={c.id} inFeed={c.inFeed} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- /api/media */}
              <img
                src={zoom.url}
                alt={zoom.title}
                className="max-h-[80dvh] rounded-2xl object-contain"
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-bone-300">{zoom.title}</p>
                <div className="flex items-center gap-2">
                  <FeedToggle
                    lookId={zoom.id}
                    inFeed={zoom.inFeed}
                    className="px-4 py-2.5 text-sm"
                  />
                  <ShareButton
                    lookId={zoom.id}
                    label={zoom.title}
                    className="px-5 py-2.5"
                  />
                  <a
                    href={zoom.url}
                    download={`xirevoa-${zoom.kind}-${zoom.id.slice(0, 6)}.png`}
                    className="flex items-center gap-2 rounded-full bg-bone-100 px-5 py-2.5 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03]"
                  >
                    <Download className="size-4" />
                    Download
                  </a>
                </div>
              </div>
            </motion.div>

            <button
              onClick={() => setZoom(null)}
              aria-label="Close"
              className="glass absolute top-6 right-6 grid size-10 place-items-center rounded-full text-bone-100"
            >
              <X className="size-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
