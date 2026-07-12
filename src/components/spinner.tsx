import { cn } from "@/lib/cn";

/**
 * The Xirevoa loading spinner (the "Fabric Bars").
 *
 * Three vertical bars in the Flare gradient, breathing on a staggered cycle
 * like folds of cloth. Used anywhere the app is working — most importantly the
 * Try-On Studio, where a fit takes 20–40s and the motion has to say "working",
 * not "hung".
 *
 * `bob` is defined in globals.css. Honour prefers-reduced-motion there.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center gap-[5px]", className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[5px] rounded-full"
          style={{
            height: "1.4em",
            background:
              "linear-gradient(var(--color-flare-amber), var(--color-flare-rose), var(--color-flare-violet))",
            animation: `bob 1s ease-in-out ${i * 0.14}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
