/**
 * The hero's ambient light. Three heavily-blurred Flare-coloured blobs drifting
 * on long, offset cycles so the loop never visibly repeats.
 *
 * Pure CSS, no canvas, no JS — it must not cost anything on a mid-range Android.
 */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-1/3 -left-1/4 size-[70vw] rounded-full opacity-25 blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--color-flare-violet), transparent 65%)",
          animation: "aurora-drift 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/4 -right-1/4 size-[60vw] rounded-full opacity-20 blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--color-flare-rose), transparent 65%)",
          animation: "aurora-drift 28s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute -bottom-1/4 left-1/3 size-[50vw] rounded-full opacity-15 blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--color-flare-amber), transparent 65%)",
          animation: "aurora-drift 34s ease-in-out infinite",
        }}
      />
      {/* Vignette — pulls focus to the centre and stops the blobs bleeding off-edge */}
      <div className="absolute inset-0 bg-radial-[at_50%_40%] from-transparent to-ink-950 to-75%" />
    </div>
  );
}
