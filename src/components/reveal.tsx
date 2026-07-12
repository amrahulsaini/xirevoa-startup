"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Scroll-triggered reveal. `once` so content doesn't re-animate when the user
 * scrolls back up — re-triggering reads as a bug, not a flourish.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Whole-line mask reveal.
 *
 * Use this instead of RevealWords whenever the line carries a gradient
 * (`.text-flare`): the gradient is clipped to the text of a single box, and
 * splitting the line into per-word inline-blocks gives each word its own box
 * that the parent's background never paints into — every word would render
 * transparent. Masking at line level keeps one continuous gradient.
 */
export function RevealLine({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className="inline-block overflow-hidden align-bottom pb-[0.12em]">
      <motion.span
        className={cn("inline-block", className)}
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {text}
      </motion.span>
    </span>
  );
}

/**
 * Headline reveal, word by word. Each word rides up from behind a clipping
 * mask, which is what makes editorial type feel like it was *set* rather than
 * faded in.
 *
 * Do NOT wrap this in `.text-flare` — see RevealLine.
 */
export function RevealWords({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.9,
              delay: delay + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {/* Non-breaking space keeps the word boxes from collapsing together */}
            {" "}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
