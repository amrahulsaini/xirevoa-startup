import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft } from "lucide-react";
import { DemoCart } from "@/components/demo-cart";

export const metadata: Metadata = {
  title: "Try the button — live demo",
  description: "A sample product page with the Xirevoa try-on button installed. Upload a photo and see it work.",
  openGraph: { images: ["/business/og.jpg"] },
};

export default function DemoPage() {
  const key = process.env.DEMO_BRAND_KEY;

  return (
    <div className="px-6 pt-28 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-900 px-5 py-4">
          <p className="text-sm text-bone-200">
            <span className="font-medium text-bone-50">Live demo.</span> This is a sample store page
            with our button installed. Tap “Try it on” and upload a photo of yourself.
          </p>
          <Link
            href="/business"
            className="flex items-center gap-1.5 text-sm text-bone-300 transition-colors hover:text-bone-50"
          >
            <ArrowLeft className="size-4" />
            For brands
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-2xl shadow-black/10 ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <p className="text-sm font-semibold tracking-[0.25em]">NORTHLINE</p>
            <p className="text-xs text-neutral-500">Men · Women · New in</p>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-50">
              <Image
                src="/business/product.jpg"
                alt="Leather biker jacket"
                fill
                sizes="(min-width: 768px) 480px, 100vw"
                className="object-cover"
                priority
              />
            </div>

            <div className="flex flex-col">
              <p className="text-xs tracking-widest text-neutral-400 uppercase">Northline</p>
              <h1 className="mt-2 text-3xl font-semibold">Leather Biker Jacket</h1>
              <p className="mt-2 text-lg text-neutral-700">₹4,999</p>
              <p className="mt-5 text-sm leading-relaxed text-neutral-600">
                Black full-grain leather with an asymmetric zip, notched lapels and zipped cuffs.
                Regular fit.
              </p>

              <p className="mt-6 text-xs font-medium tracking-wide text-neutral-500 uppercase">Size</p>
              <div className="mt-2 flex gap-2">
                {["S", "M", "L", "XL"].map((s) => (
                  <span
                    key={s}
                    className={`grid size-10 place-items-center rounded-md border text-sm ${s === "M" ? "border-neutral-900" : "border-neutral-200 text-neutral-500"}`}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <DemoCart />
                {key ? (
                  <div data-xirevoa-tryon="" data-image="/business/product.jpg" data-name="Leather Biker Jacket" />
                ) : (
                  <p className="mt-3 text-sm text-neutral-500">The demo is switched off right now.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {key && <Script src="/widget.js" data-key={key} strategy="afterInteractive" />}
    </div>
  );
}
