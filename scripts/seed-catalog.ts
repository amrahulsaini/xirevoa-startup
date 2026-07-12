/**
 * Generates every garment in the Xirevoa catalog and writes it to public/catalog.
 *
 *   npm run seed:catalog          # only missing items
 *   npm run seed:catalog -- --force   # regenerate everything
 *
 * Idempotent by default so a rerun after adding one item costs one API call,
 * not fourteen.
 */
import fs from "node:fs";
import path from "node:path";
import { CATALOG } from "../src/lib/catalog";
import { generateGarment } from "../src/lib/gemini";

const OUT = path.join(process.cwd(), "public", "catalog");
const force = process.argv.includes("--force");

// Bounded concurrency — the API rate-limits, and too wide a burst gets throttled.
// generateImage() retries 429s with backoff, so this just paces the fleet.
const LIMIT = 3;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const todo = CATALOG.filter(
    (item) => force || !fs.existsSync(path.join(OUT, `${item.slug}.png`)),
  );

  if (todo.length === 0) {
    console.log("Catalog is already complete. Pass --force to regenerate.");
    return;
  }

  console.log(`Generating ${todo.length} of ${CATALOG.length} items…\n`);
  const failures: string[] = [];
  const queue = [...todo];

  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        const img = await generateGarment(item.category, item.prompt);
        fs.writeFileSync(
          path.join(OUT, `${item.slug}.png`),
          Buffer.from(img.data, "base64"),
        );
        console.log(`  ✓ ${item.name}`);
      } catch (err) {
        failures.push(item.slug);
        console.error(`  ✗ ${item.name} — ${(err as Error).message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: LIMIT }, worker));

  console.log(`\nDone. ${todo.length - failures.length}/${todo.length} generated.`);
  if (failures.length) {
    console.error(`Failed: ${failures.join(", ")} — rerun to retry just these.`);
    process.exitCode = 1;
  }
}

main();
