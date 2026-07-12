import { cn } from "@/lib/cn";

/**
 * The Xirevoa mark: a reflected X.
 *
 * The left arm is solid; the right is its faded reflection — you, and you in
 * the mirror, which is exactly what a virtual try-on is. Carries the Flare
 * gradient. Real vector geometry so it stays crisp at any size and picks up the
 * theme's gradient tokens.
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
      </defs>

      {/* Solid arm */}
      <path d="M4 3h6.6L28 29h-6.6L4 3Z" fill={`url(#${gradientId})`} />
      {/* Its reflection */}
      <path d="M28 3h-6.6L4 29h6.6L28 3Z" fill={`url(#${gradientId})`} opacity="0.34" />
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
