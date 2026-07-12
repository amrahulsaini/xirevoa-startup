"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MoveHorizontal } from "lucide-react";

/**
 * Draggable before/after reveal.
 *
 * This is the single most persuasive element on the site — it lets someone see
 * the product work before they sign up. Supports pointer drag AND arrow keys,
 * because a slider that only works with a mouse is a slider half the audience
 * can't use.
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel = "Your photo",
  afterLabel = "On Xirevoa",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const pct = ((clientX - left) / width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  // Listen on window, not the element: if the pointer leaves the box mid-drag
  // the handle should keep tracking, and the drag should end wherever it's released.
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setFromClientX(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, setFromClientX]);

  return (
    <div
      ref={ref}
      onPointerDown={(e) => {
        setDragging(true);
        setFromClientX(e.clientX);
      }}
      className="group relative aspect-3/4 w-full cursor-ew-resize touch-none overflow-hidden rounded-2xl bg-ink-800 select-none"
    >
      {/* AFTER sits underneath, fully rendered */}
      <Image
        src={after}
        alt="The same person wearing garments from the Xirevoa collection"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 560px"
        className="object-cover"
      />

      {/* BEFORE is clipped from the right, revealing AFTER as the handle moves left */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src={before}
          alt="The original uploaded photo, before try-on"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 560px"
          className="object-cover"
        />
      </div>

      {/* Corner labels fade out while dragging so they don't fight the image */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ opacity: dragging ? 0 : 1 }}
      >
        <span className="glass absolute top-4 left-4 rounded-full px-3 py-1.5 text-xs tracking-wide text-bone-200 uppercase">
          {beforeLabel}
        </span>
        <span className="glass absolute top-4 right-4 rounded-full px-3 py-1.5 text-xs tracking-wide text-bone-200 uppercase">
          {afterLabel}
        </span>
      </div>

      {/* The handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-bone-100/90 shadow-[0_0_24px_rgba(245,242,236,0.5)]"
        style={{ left: `${pos}%` }}
      >
        <motion.div
          animate={{ scale: dragging ? 1.12 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="pointer-events-auto absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-bone-100 text-ink-950 shadow-xl"
        >
          <MoveHorizontal className="size-5" />
        </motion.div>
      </div>

      {/* Keyboard-accessible equivalent of the drag */}
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Reveal the try-on result"
        className="absolute inset-x-0 bottom-0 h-11 w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
