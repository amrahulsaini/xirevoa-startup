"use client";

import { useState, useTransition } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { setShared } from "@/app/share/actions";
import { cn } from "@/lib/cn";

/**
 * Share a look.
 *
 * Two things have to happen before a link is worth anything:
 *   1. The look must be marked shared — until then /share/<id> 404s, because a
 *      look is a photo of someone's face and privacy is the default.
 *   2. We hand out the /share/<id> PAGE, not the raw image URL. The page carries
 *      Open Graph tags, so the link previews as a picture in WhatsApp and
 *      Instagram instead of a grey box, and it has a way back to Xirevoa.
 *
 * Uses the native share sheet where it exists (that's how anything actually gets
 * shared on a phone) and falls back to copying the link.
 */
export function ShareButton({
  lookId,
  label,
  className,
  compact,
}: {
  lookId: string;
  label: string;
  className?: string;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const share = () => {
    start(async () => {
      const res = await setShared(lookId, true);
      if (!res.ok || !res.url) return;

      const url = `${window.location.origin}${res.url}`;

      // navigator.share must be called in the same task as the user gesture on
      // some browsers; the await above is fine because it's inside a transition
      // started by the click.
      if (navigator.share) {
        try {
          await navigator.share({
            title: "My Xirevoa look",
            text: `${label} — see how it looks on me.`,
            url,
          });
          return;
        } catch {
          // User dismissed the sheet, or it's unavailable. Fall through to copy.
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
        window.prompt("Copy this link:", url);
      }
    });
  };

  if (compact) {
    return (
      <button
        onClick={share}
        disabled={pending}
        aria-label="Share"
        className={cn(
          "glass grid size-9 place-items-center rounded-full text-bone-100 transition-transform hover:scale-110 disabled:opacity-60",
          className,
        )}
      >
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={share}
      disabled={pending}
      className={cn(
        "hairline flex items-center justify-center gap-2 rounded-full border py-3 text-sm text-bone-200 transition-colors hover:bg-bone-100/6 hover:text-bone-50 disabled:opacity-60",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Link copied
        </>
      ) : pending ? (
        <>
          <Link2 className="size-4" />
          Preparing…
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          Share
        </>
      )}
    </button>
  );
}
