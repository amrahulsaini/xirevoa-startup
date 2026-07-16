"use client";

import { useOptimistic, useTransition } from "react";
import { Globe, Lock } from "lucide-react";
import { setInFeed } from "@/app/share/actions";
import { cn } from "@/lib/cn";

/**
 * Put a look on the public feed, or take it off.
 *
 * Separate from the share button on purpose: sending a friend a link and posting
 * yourself to a public gallery are different decisions. This is the only thing
 * that puts anything on /feed.
 *
 * Optimistic so the toggle responds instantly — waiting on a round trip to see
 * your own switch move feels broken.
 */
export function FeedToggle({
  lookId,
  inFeed,
  compact,
  className,
}: {
  lookId: string;
  inFeed: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(inFeed);

  const toggle = () => {
    start(async () => {
      setOptimistic(!optimistic);
      await setInFeed(lookId, !optimistic);
    });
  };

  const label = optimistic ? "Remove from feed" : "Add to feed";

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={pending}
        aria-label={label}
        title={label}
        className={cn(
          "grid size-9 place-items-center rounded-full transition-transform hover:scale-110 disabled:opacity-60",
          optimistic
            ? "bg-flare-rose text-bone-50"
            : "glass text-bone-100",
          className,
        )}
      >
        {optimistic ? <Globe className="size-4" /> : <Lock className="size-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-full border py-2 text-xs transition-colors disabled:opacity-60",
        optimistic
          ? "border-flare-rose/60 bg-flare-rose/10 text-bone-100"
          : "hairline text-bone-300 hover:bg-bone-100/6 hover:text-bone-50",
        className,
      )}
    >
      {optimistic ? (
        <>
          <Globe className="size-3.5" />
          On feed
        </>
      ) : (
        <>
          <Lock className="size-3.5" />
          Private
        </>
      )}
    </button>
  );
}
