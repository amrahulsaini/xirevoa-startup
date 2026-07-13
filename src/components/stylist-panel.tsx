"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Ruler, Wand2 } from "lucide-react";
import { Spinner } from "./spinner";
import { OCCASIONS } from "@/lib/stylist";
import { cn } from "@/lib/cn";

export interface Advice {
  build: string;
  skinTone: string;
  sizeTop: string;
  sizeBottom: string;
  sizeNote: string;
  picks: string[];
  reason: string;
}

/**
 * "Style me" — reads the shopper and dresses them for an occasion.
 *
 * On success it hands the picked slugs back up so the Studio can select them,
 * which turns a 335-item catalog into a single decision: fit it, or don't.
 */
export function StylistPanel({
  person,
  disabled,
  onPicked,
}: {
  person: string | null;
  disabled?: boolean;
  onPicked: (slugs: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const style = async (occasion: string) => {
    if (!person) return;
    setBusy(true);
    setError(null);
    setAdvice(null);

    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, occasion }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Couldn't style you right now.");
        return;
      }

      setAdvice(data);
      onPicked(data.picks);
      setOpen(false);
    } catch {
      setError("Couldn't reach the stylist. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || !person || busy}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300",
          person && !busy
            ? "hairline border text-bone-100 hover:bg-bone-100/6"
            : "cursor-not-allowed bg-ink-800 text-bone-400",
        )}
      >
        {busy ? (
          <>
            <Spinner className="text-base" />
            Styling you…
          </>
        ) : (
          <>
            <Wand2 className="size-4" />
            Style me — free
          </>
        )}
      </button>

      {/* Occasion picker */}
      <AnimatePresence>
        {open && !busy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 mb-3 text-xs tracking-[0.18em] text-bone-400 uppercase">
              What&apos;s the occasion?
            </p>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => style(o.id)}
                  className="hairline rounded-full border px-4 py-2 text-sm text-bone-300 transition-colors hover:bg-bone-100/6 hover:text-bone-50"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-sm text-flare-rose">{error}</p>}

      {/* The read + the rationale */}
      <AnimatePresence>
        {advice && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="hairline mt-4 rounded-2xl border bg-ink-900 p-5"
          >
            <p className="text-sm leading-relaxed text-bone-200">{advice.reason}</p>

            <div className="hairline mt-4 flex items-center gap-4 border-t pt-4">
              <Ruler className="size-4 shrink-0 text-flare-rose" />
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-[0.18em] text-bone-400 uppercase">
                  Your likely size
                </p>
                <p className="mt-1 text-bone-100">
                  <span className="font-semibold">{advice.sizeTop}</span> on top ·{" "}
                  <span className="font-semibold">{advice.sizeBottom}</span> on the
                  bottom
                </p>
              </div>
            </div>

            {/* Say plainly that this is an estimate. Telling someone the wrong
                size with false confidence is how you earn a return. */}
            <p className="mt-3 text-xs leading-relaxed text-bone-500">
              An estimate from your photo — {advice.sizeNote} Always check the
              store&apos;s own size chart before buying.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
