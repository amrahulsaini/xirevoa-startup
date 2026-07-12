import { cn } from "@/lib/cn";

/**
 * The Xirevoa loading spinner.
 *
 * A conic sweep of the Flare gradient rotating inside a ring — used wherever the
 * app is working, above all the Try-On Studio, where a fit takes 20–40s and the
 * motion has to say "working", not "hung". Size follows the font-size of the
 * container (1em), so `text-2xl` etc. scales it.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block", className)}
      style={{
        width: "1em",
        height: "1em",
        borderRadius: "50%",
        background:
          "conic-gradient(from 0deg, transparent 0%, var(--color-flare-amber) 25%, var(--color-flare-rose) 55%, var(--color-flare-violet) 80%, transparent 100%)",
        // Punch out the centre so it reads as a ring, not a disc.
        WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 0.15em), #000 0)",
        mask: "radial-gradient(farthest-side, transparent calc(100% - 0.15em), #000 0)",
        animation: "spin 0.9s linear infinite",
      }}
    />
  );
}
