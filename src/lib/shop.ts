import "server-only";
import { prisma } from "@/lib/db";
import type { CatalogItem } from "@/lib/catalog";
import type { Category } from "@/lib/gemini";

/**
 * Real, buyable products — the ones imported from affiliate feeds or uploaded by
 * stores. These are the revenue surface: every one carries a `buyUrl` that earns
 * commission.
 *
 * Shaped as CatalogItem so the Studio and its cards render them exactly like the
 * demo catalog — the try-on doesn't care where a garment came from.
 */
export async function getShopProducts(): Promise<CatalogItem[]> {
  const rows = await prisma.garment.findMany({
    where: { published: true, buyUrl: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return rows.map((g) => ({
    slug: g.slug,
    name: g.name,
    category: g.category as Category,
    tagline: g.brand ?? "Shop",
    fit: g.fit ?? undefined,
    // Not used for filtering here, but the type needs it. Real products are
    // tagged by category, not gender, for now.
    gender: "unisex" as const,
    prompt: "",
    image: `/${g.imageKey}`,
    buyUrl: g.buyUrl ?? undefined,
    brand: g.brand ?? undefined,
    priceInPaise: g.priceInPaise ?? undefined,
  }));
}
