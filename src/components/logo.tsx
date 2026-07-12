import { cn } from "@/lib/cn";

/**
 * The Xirevoa mark: a ribbon monogram X.
 *
 * Two thick crossing bars with mitred ends. The "folded ribbon" quality comes
 * from shading facets, NOT from cutting voids out of the arms — an earlier
 * version carved chevrons out and the mark read as shattered rather than
 * folded. Solid geometry, shaded.
 *
 * Built as real vector geometry (not a traced bitmap) so it stays crisp at any
 * size and picks up the theme's gradient tokens.
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
  const clipId = `${gradientId}-clip`;

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
          x1="3"
          y1="3"
          x2="29"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-flare-amber)" />
          <stop offset="0.5" stopColor="var(--color-flare-rose)" />
          <stop offset="1" stopColor="var(--color-flare-violet)" />
        </linearGradient>

        {/* Confines the fold shading to the X itself, so the facets can be drawn
            as simple rectangles without spilling outside the mark. */}
        <clipPath id={clipId}>
          <path d="M3 3h7.6L29 29h-7.6L3 3Z" />
          <path d="M29 3h-7.6L3 29h7.6L29 3Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect width="32" height="32" fill={`url(#${gradientId})`} />
        {/* The fold: the right half of each ribbon sits fractionally in shadow. */}
        <path d="M16 0h16v32H16z" fill="#000" opacity="0.13" />
        <path d="M0 16h32v16H0z" fill="#000" opacity="0.07" />
      </g>
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
