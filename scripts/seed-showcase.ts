/**
 * Generates the landing-page hero showcase: one "before" model photo and the
 * "after" of them wearing a full layered look.
 *
 * Doubles as an end-to-end exercise of the multi-garment try-on path.
 */
import fs from "node:fs";
import path from "node:path";
import { tryOn, type ImageRef, type TryOnGarment } from "../src/lib/gemini";
import { bySlug } from "../src/lib/catalog";

const PUB = path.join(process.cwd(), "public");
const OUT = path.join(PUB, "showcase");

const load = (p: string): ImageRef => ({
  data: fs.readFileSync(p).toString("base64"),
  mimeType: "image/png",
});

// The "user upload" stand-in. In production this is the shopper's own photo.
const BEFORE = path.join(OUT, "before.png");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  if (!fs.existsSync(BEFORE)) {
    throw new Error(`Missing ${BEFORE} — drop the base model photo there first.`);
  }

  const look: { slug: string; name: string }[] = [
    { slug: "tiger-tee", name: "the oversized mustard tiger tee" },
    { slug: "baggy-blue", name: "the baggy wide-leg blue jeans" },
    { slug: "aviator-gold", name: "the gold aviator sunglasses" },
  ];

  const garments: TryOnGarment[] = look.map(({ slug, name }) => {
    const item = bySlug(slug);
    if (!item) throw new Error(`Unknown catalog slug: ${slug}`);
    return {
      category: item.category,
      name,
      image: load(path.join(PUB, "catalog", `${slug}.png`)),
    };
  });

  console.log(`Layering ${garments.length} garments in a single pass…`);
  const result = await tryOn({ person: load(BEFORE), garments, aspectRatio: "3:4" });

  fs.writeFileSync(path.join(OUT, "after.png"), Buffer.from(result.data, "base64"));
  console.log("✓ public/showcase/after.png");
}

main();
