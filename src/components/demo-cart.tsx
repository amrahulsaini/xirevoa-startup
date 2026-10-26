"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";

export function DemoCart() {
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setAdded(true)}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
    >
      {added ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
      {added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
