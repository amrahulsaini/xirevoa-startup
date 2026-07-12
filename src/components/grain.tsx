/**
 * Film grain overlay.
 *
 * Large flat dark areas band badly on cheap panels and read as "dead". A very
 * low-opacity animated noise layer hides the banding and gives the whole site
 * a photographic feel. Fixed, non-interactive, never scrolls.
 */
export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
        animation: "grain 800ms steps(1) infinite",
      }}
    />
  );
}
