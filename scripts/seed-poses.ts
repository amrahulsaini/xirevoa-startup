/**
 * Generates the pose silhouettes used as the camera overlay.
 *
 * They must be clean flat black shapes on pure white — the browser masks them
 * into a glowing outline, and any shading or detail turns that outline to mush.
 *
 *   npm run seed:poses            # only what's missing
 *   npm run seed:poses -- --force
 */
import fs from "node:fs";
import path from "node:path";
import { POSES } from "../src/lib/poses";

const OUT = path.join(process.cwd(), "public", "poses");
const force = process.argv.includes("--force");
const KEY = process.env.GEMINI_API_KEY;

async function silhouette(prompt: string): Promise<Buffer> {
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
                  `A single flat SOLID BLACK silhouette of a person ${prompt}. ` +
                  `Pure white background. The silhouette is one solid black shape with NO interior detail, ` +
                  `no face, no clothing, no shading, no gradient, no outline stroke — just the black shape ` +
                  `of the body against white. ` +
                  `The ENTIRE body from the top of the head to the soles of the feet is visible, centred, ` +
                  `with clear white margin above the head and below the feet. ` +
                  `Simple, clean, graphic, like a pictogram.`,
              },
            ],
          },
        ],
        // Portrait: it overlays a phone viewfinder held upright.
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "9:16" },
        },
      }),
    },
  );

  const j = await res.json();
  const p = j.candidates?.[0]?.content?.parts?.find(
    (x: { inlineData?: unknown }) => x.inlineData,
  );
  if (!p) throw new Error(JSON.stringify(j).slice(0, 200));
  return Buffer.from(p.inlineData.data, "base64");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const todo = POSES.filter(
    (p) => force || !fs.existsSync(path.join(OUT, `${p.slug}.png`)),
  );
  if (todo.length === 0) {
    console.log("Poses already complete.");
    return;
  }

  console.log(`Generating ${todo.length} of ${POSES.length} pose silhouettes…\n`);
  const queue = [...todo];
  const failed: string[] = [];

  const worker = async () => {
    for (let pose = queue.shift(); pose; pose = queue.shift()) {
      try {
        fs.writeFileSync(
          path.join(OUT, `${pose.slug}.png`),
          await silhouette(pose.prompt),
        );
        console.log(`  ✓ ${pose.name}`);
      } catch (err) {
        failed.push(pose.slug);
        console.error(`  ✗ ${pose.name} — ${(err as Error).message.slice(0, 80)}`);
      }
    }
  };

  await Promise.all(Array.from({ length: 3 }, worker));

  console.log(`\nDone. ${todo.length - failed.length}/${todo.length}.`);
  if (failed.length) {
    console.error(`Failed: ${failed.join(", ")} — rerun to retry.`);
    process.exitCode = 1;
  }
}

main();
