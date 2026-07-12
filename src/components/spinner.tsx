import { cn } from "@/lib/cn";

/**
 * The Xirevoa spinner — S6, the "fabric bars".
 *
 * Three bars in the Flare gradient breathing on a staggered cycle, like folds of
 * cloth. Scales with the container's font-size (bars are sized in `em`), so
 * `text-3xl` gives a big one and `text-base` an inline one.
 *
 * The `bob` keyframe lives in globals.css. Do not swap this for a rotating ring
 * — the fabric bars are the chosen mark.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center gap-[0.18em]", className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="spinner-bar block rounded-full"
          style={{
            width: "0.2em",
            height: "1em",
            background:
              "linear-gradient(var(--color-flare-amber), var(--color-flare-rose), var(--color-flare-violet))",
            animation: `bob 1s ease-in-out ${i * 0.14}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
