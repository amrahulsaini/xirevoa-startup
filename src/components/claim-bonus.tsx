"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFingerprint } from "@/lib/fingerprint";
import { pushNote } from "@/lib/notifications";

/**
 * Claims the signup bonus once per account.
 *
 * Lives on the client because the device fingerprint can only be computed in a
 * browser — that fingerprint is what stops the same person collecting free
 * points again from an incognito window.
 *
 * Rendered only for signed-in users who have never been granted the bonus, so in
 * the normal case it never runs at all.
 */
export function ClaimBonus() {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    (async () => {
      const fingerprint = await getFingerprint();
      if (!fingerprint) return;

      const res = await fetch("/api/claim-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint }),
      }).catch(() => null);
      if (!res?.ok) return;

      const { granted } = await res.json();
      if (granted > 0) {
        pushNote({
          title: `${granted} XPoints added`,
          body: "Welcome to Xirevoa — that's a couple of try-ons on us.",
          href: "/studio",
        });
        router.refresh();
      }
    })();
  }, [router]);

  return null;
}
