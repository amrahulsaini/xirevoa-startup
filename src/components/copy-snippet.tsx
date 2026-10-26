"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopySnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative mt-4 rounded-xl bg-ink-900 p-4 pr-14">
      <code className="block font-mono text-xs leading-relaxed break-all text-bone-200">{code}</code>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute top-3 right-3 grid size-8 place-items-center rounded-lg bg-ink-800 text-bone-300 transition-colors hover:text-bone-50"
      >
        {copied ? <Check className="size-4 text-flare-rose" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
