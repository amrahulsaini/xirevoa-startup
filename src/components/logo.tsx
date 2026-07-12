import { cn } from "@/lib/cn";

/**
 * The Xirevoa mark.
 *
 * A gradient tile with the X knocked out of it. The solid shape is what makes
 * it survive at 16px in a browser tab — a mark made of thin strokes turns to
 * mush at that size.
 *
 * `gradientId` must be unique per instance. Two SVGs on one page sharing a
 * <linearGradient> id means the second silently inherits the first's fill.
 */
export function LogoMark({
  className,
  gradientId = "xirevoa-flare",
}: {
  className?: string;
  gradientId?: string;
}) {
  const maskId = `${gradientId}-mask`;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      role="img"
      aria-label="Xirevoa"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-flare-amber)" />
          <stop offset="0.52" stopColor="var(--color-flare-rose)" />
          <stop offset="1" stopColor="var(--color-flare-violet)" />
        </linearGradient>

        {/* White = keep, black = cut. The X is cut straight out of the tile, so
            the canvas shows through it — the mark never needs to know what
            colour it's sitting on. */}
        <mask id={maskId}>
          <rect width="32" height="32" rx="8" fill="white" />
          <path
            d="M11 11 L21 21 M21 11 L11 21"
            stroke="black"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </mask>
      </defs>

      <rect
        width="32"
        height="32"
        rx="8"
        fill={`url(#${gradientId})`}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

/** Mark + wordmark, locked up. Use this anywhere the brand appears. */
export function Logo({
  className,
  gradientId,
}: {
  className?: string;
  gradientId?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-7" gradientId={gradientId} />
      <span className="font-sans text-[0.95em] font-semibold tracking-[0.2em] text-bone-50 uppercase">
        Xirevoa
      </span>
    </span>
  );
}
