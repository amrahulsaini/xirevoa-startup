/**
 * Imports real, buyable products from an affiliate feed into the catalog.
 *
 *   npm run import:products -- path/to/feed.json
 *
 * The feed is a JSON array of the fields every affiliate network exports (Amazon
 * PA-API, EarnKaro, Cuelinks, Flipkart — all give you at least these). Point a
 * tiny per-network adapter at this shape and any catalog on the internet becomes
 * a Xirevoa product, legally, with a commission-earning buy link.
 *
 * Idempotent by slug: re-running updates prices and links rather than
 * duplicating. Images are downloaded once into public/catalog so the try-on
 * engine reads them off local disk like everything else.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Category } from "../src/lib/gemini";

interface FeedProduct {
  /** Stable id from the source — becomes part of the slug so re-imports match. */
  id: string;
  title: string;
  imageUrl: string;
  /** The affiliate deep link. This is what earns the commission. */
  buyUrl: string;
  category: Category;
  priceInPaise: number;
  brand?: string;
  fit?: string;
  /** Defaults true — marketplace photos are on a model. */
  onModel?: boolean;
  source: string; // "myntra", "amazon", …
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const OUT = path.join(process.cwd(), "public", "catalog");

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const feedPath = process.argv[2];
  if (!feedPath) {
    console.error("usage: import:products -- <feed.json>");
    process.exit(1);
  }

  const products: FeedProduct[] = JSON.parse(fs.readFileSync(feedPath, "utf8"));
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`Importing ${products.length} products…\n`);

  let ok = 0;
  const failed: string[] = [];

  for (const p of products) {
    const slug = `${p.source}-${slugify(p.id)}`;
    const imageKey = `catalog/${slug}.png`;
    try {
      if (!fs.existsSync(path.join(OUT, `${slug}.png`))) {
        await download(p.imageUrl, path.join(OUT, `${slug}.png`));
      }

      await prisma.garment.upsert({
        where: { slug },
        create: {
          slug,
          name: p.title.slice(0, 90),
          category: p.category,
          fit: p.fit,
          brand: p.brand,
          imageKey,
          priceInPaise: p.priceInPaise,
          buyUrl: p.buyUrl,
          source: p.source,
          onModel: p.onModel ?? true,
        },
        // Prices and links change; the image and slug don't.
        update: {
          name: p.title.slice(0, 90),
          priceInPaise: p.priceInPaise,
          buyUrl: p.buyUrl,
          brand: p.brand,
        },
      });
      ok++;
      console.log(`  ✓ ${p.title.slice(0, 50)}`);
    } catch (err) {
      failed.push(slug);
      console.error(`  ✗ ${p.title.slice(0, 40)} — ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. ${ok}/${products.length} imported.`);
  if (failed.length) process.exitCode = 1;
  await prisma.$disconnect();
}

main();
