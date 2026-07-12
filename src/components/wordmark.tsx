import { cn } from "@/lib/cn";

/**
 * The Xirevoa wordmark. The X is set in the display serif and carries the
 * Flare gradient; the rest is wide-tracked sans. The mixed setting is the
 * whole identity — don't "fix" it to one typeface.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline leading-none",
        className,
      )}
    >
      <span className="font-display text-flare text-[1.35em] italic">X</span>
      <span className="font-sans font-medium tracking-[0.24em] uppercase">
        irevoa
      </span>
    </span>
  );
}
