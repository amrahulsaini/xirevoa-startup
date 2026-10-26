import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CopySnippet } from "@/components/copy-snippet";

export const metadata: Metadata = { title: "Brand dashboard" };

const INSTALL = [
  ["Shopify", "Online Store → Themes → Customize → open a product page → Add block → Custom Liquid → paste → Save."],
  ["WooCommerce", "Install “WPCode” (or any header & footer plugin) → paste into the footer → Save."],
  ["Wix / Squarespace", "Settings → Custom Code → paste into the body, on all pages → Apply."],
  ["Custom site", "Paste it once before </body> on your product page template."],
];

const DAY = 24 * 60 * 60 * 1000;

const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

export default async function BrandDashboard() {
  const user = await requireUser("/business/dashboard");

  const brand = await prisma.brand.findUnique({ where: { userId: user.id } });
  if (!brand) redirect("/business");

  const where = { brandId: brand.id, createdAt: { gte: daysAgo(30) } };
  const served = { ...where, status: { in: ["ok" as const, "cached" as const] } };

  const [tryons, carted, failed, ever, top] = await Promise.all([
    prisma.brandTryOn.count({ where: served }),
    prisma.brandTryOn.count({ where: { ...served, addedToCart: true } }),
    prisma.brandTryOn.count({ where: { ...where, status: "failed" } }),
    prisma.brandTryOn.count({ where: { brandId: brand.id } }),
    prisma.brandTryOn.groupBy({
      by: ["productUrl", "productName"],
      where: served,
      _count: { _all: true },
      orderBy: { _count: { productUrl: "desc" } },
      take: 5,
    }),
  ]);

  const base = process.env.AUTH_URL ?? "https://xirevoa.com";
  const snippet = `<script src="${base}/widget.js" data-key="${brand.key}" async></script>`;
  const cartRate = tryons ? Math.round((carted / tryons) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 pt-32 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-bone-400 uppercase">{brand.domain}</p>
          <h1 className="mt-2 font-display text-4xl text-bone-50">{brand.name}</h1>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${ever ? "bg-flare-rose/15 text-flare-rose" : "bg-ink-800 text-bone-300"}`}
        >
          {ever ? "Live on your store" : "Waiting for your first try-on"}
        </span>
      </header>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-bone-100/10 sm:grid-cols-4">
        <Stat label="Try-ons left" value={brand.credits.toLocaleString("en-IN")} />
        <Stat label="Try-ons · 30 days" value={tryons.toLocaleString("en-IN")} />
        <Stat label="Added to cart" value={carted.toLocaleString("en-IN")} />
        <Stat label="Try-on → cart" value={`${cartRate}%`} />
      </div>
      {failed > 0 && (
        <p className="mt-3 text-xs text-bone-500">
          {failed} try-on{failed === 1 ? "" : "s"} failed in the last 30 days and weren&apos;t charged.
        </p>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl text-bone-50">Your install code</h2>
        <p className="mt-2 text-sm text-bone-400">
          Paste this once. The button shows up next to Add to Cart on every product page of{" "}
          {brand.domain}.
        </p>
        <CopySnippet code={snippet} />

        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-bone-100/10 sm:grid-cols-2">
          {INSTALL.map(([platform, how]) => (
            <div key={platform} className="bg-ink-950 p-5">
              <p className="text-sm font-medium text-bone-100">{platform}</p>
              <p className="mt-1 text-sm leading-relaxed text-bone-400">{how}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-bone-50">Most tried on</h2>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-bone-400">Nothing yet. Your top products will show up here.</p>
        ) : (
          <ul className="mt-4 divide-y divide-bone-100/10 overflow-hidden rounded-2xl bg-ink-900">
            {top.map((p) => (
              <li key={p.productUrl} className="flex items-center justify-between gap-4 px-5 py-4">
                <a
                  href={p.productUrl}
                  target="_blank"
                  rel="noopener"
                  className="truncate text-sm text-bone-100 hover:text-bone-50"
                >
                  {p.productName ?? p.productUrl}
                </a>
                <span className="shrink-0 text-sm text-bone-400">{p._count._all}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-950 p-6">
      <p className="text-xs tracking-wide text-bone-400 uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl text-bone-50">{value}</p>
    </div>
  );
}
