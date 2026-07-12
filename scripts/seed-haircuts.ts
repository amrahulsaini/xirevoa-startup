/**
 * Generates the Salon lookbook: ONE face, every haircut.
 *
 * Using the same model for every cut is the whole point — it's the only way a
 * shopper can actually compare styles rather than compare people. So we generate
 * a base portrait once, then run each cut through the real tryHaircut() edit.
 *
 *   npm run seed:haircuts            # only what's missing
 *   npm run seed:haircuts -- --force # regenerate everything
 */
import fs from "node:fs";
import path from "node:path";
import { HAIRCUTS } from "../src/lib/haircuts";
import { tryHaircut } from "../src/lib/salon";
import type { ImageRef } from "../src/lib/gemini";

const OUT = path.join(process.cwd(), "public", "haircuts");
const BASE = path.join(OUT, "_base.png");
const force = process.argv.includes("--force");
const LIMIT = 3;

const KEY = process.env.GEMINI_API_KEY;

/** The base model — one neutral, well-lit portrait everything else is cut from. */
async function generateBase(): Promise<ImageRef> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "Studio headshot photograph of a young Indian man, head and shoulders, facing the camera " +
                  "straight on, neutral expression, plain light grey seamless background, soft even studio " +
                  "lighting. He has short dark hair and is clean-shaven. Sharp focus, photorealistic, " +
                  "the whole head visible with space above the hair.",
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "1:1" },
        },
      }),
    },
  );
  const j = await res.json();
  const p = j.candidates?.[0]?.content?.parts?.find(
    (x: { inlineData?: unknown }) => x.inlineData,
  );
  if (!p) throw new Error("base: " + JSON.stringify(j).slice(0, 300));
  return { data: p.inlineData.data, mimeType: "image/png" };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  let base: ImageRef;
  if (fs.existsSync(BASE) && !force) {
    base = { data: fs.readFileSync(BASE).toString("base64"), mimeType: "image/png" };
    console.log("Using existing base portrait.");
  } else {
    console.log("Generating the base portrait…");
    base = await generateBase();
    fs.writeFileSync(BASE, Buffer.from(base.data, "base64"));
    console.log("✓ base portrait");
  }

  const todo = HAIRCUTS.filter(
    (h) => force || !fs.existsSync(path.join(OUT, `${h.slug}.png`)),
  );
  if (todo.length === 0) {
    console.log("Lookbook already complete.");
    return;
  }

  console.log(`Cutting ${todo.length} of ${HAIRCUTS.length} styles…\n`);
  const queue = [...todo];
  const failed: string[] = [];

  const worker = async () => {
    for (let cut = queue.shift(); cut; cut = queue.shift()) {
      try {
        const img = await tryHaircut({
          person: base,
          cutPrompt: cut.prompt,
          cutName: cut.name,
          aspectRatio: "1:1",
        });
        fs.writeFileSync(
          path.join(OUT, `${cut.slug}.png`),
          Buffer.from(img.data, "base64"),
        );
        console.log(`  ✓ ${cut.name}`);
      } catch (err) {
        failed.push(cut.slug);
        console.error(`  ✗ ${cut.name} — ${(err as Error).message.slice(0, 90)}`);
      }
    }
  };

  await Promise.all(Array.from({ length: LIMIT }, worker));

  console.log(`\nDone. ${todo.length - failed.length}/${todo.length}.`);
  if (failed.length) {
    console.error(`Failed: ${failed.join(", ")} — rerun to retry just these.`);
    process.exitCode = 1;
  }
}

main();
