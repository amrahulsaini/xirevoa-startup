/**
 * Mirrors the static CATALOG into the database.
 *
 * The catalog lives in code (src/lib/catalog.ts) because it's the seed
 * collection and its prompts are versioned with the app. The DB copy exists so
 * a saved Look can reference a Garment by foreign key, and so store-supplied
 * inventory can later land in the same table.
 *
 *   npm run seed:db
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATALOG } from "../src/lib/catalog";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const item of CATALOG) {
    await prisma.garment.upsert({
      where: { slug: item.slug },
      // Xirevoa's own collection: storeId stays null, price stays null.
      create: {
        slug: item.slug,
        name: item.name,
        category: item.category,
        fit: item.fit,
        tagline: item.tagline,
        imageKey: `catalog/${item.slug}.png`,
      },
      update: {
        name: item.name,
        category: item.category,
        fit: item.fit,
        tagline: item.tagline,
      },
    });
  }

  const count = await prisma.garment.count();
  console.log(`✓ ${CATALOG.length} garments synced. ${count} total in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
