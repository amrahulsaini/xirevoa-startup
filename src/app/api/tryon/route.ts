import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { cacheKey, tryOn, type ImageRef, type TryOnGarment } from "@/lib/gemini";
import { bySlug } from "@/lib/catalog";
import { getObject, putObject } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// A layered try-on runs 20-40s. The default serverless timeout would kill it.
export const maxDuration = 120;

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_GARMENTS = 4;

const Body = z.object({
  /** data: URL of the shopper's photo. */
  person: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Must be a PNG, JPEG or WebP data URL"),
  slugs: z.array(z.string()).min(1).max(MAX_GARMENTS),
});

/** Catalog art lives in public/ and is read straight off disk — it isn't user data. */
async function loadGarmentImage(slug: string): Promise<ImageRef> {
  const file = path.join(process.cwd(), "public", "catalog", `${slug}.png`);
  const buf = await fs.readFile(file);
  return { data: buf.toString("base64"), mimeType: "image/png" };
}

export async function POST(req: NextRequest) {
  // Rate limit before parsing — a flood shouldn't get to do work.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const limit = rateLimit(`tryon:${ip}`, 12, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `You've used all your try-ons for this hour. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { person, slugs } = parsed.data;

  const [meta, b64] = person.split(",", 2);
  const mimeType = meta.slice(5, meta.indexOf(";"));
  const personBytes = Buffer.from(b64, "base64");

  if (personBytes.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "That photo is over 8MB. Please use a smaller one." },
      { status: 413 },
    );
  }

  const items = slugs.map(bySlug);
  const unknown = slugs.filter((_, i) => !items[i]);
  if (unknown.length) {
    return NextResponse.json(
      { error: `Unknown garment: ${unknown.join(", ")}` },
      { status: 400 },
    );
  }

  // Same person + same garments = same result. Serve it from storage rather
  // than paying Gemini twice. Sorted so garment order doesn't fragment the cache.
  const key = cacheKey([
    "v1",
    cacheKey([b64]),
    [...slugs].sort().join(","),
  ]);
  const objectKey = `tryon/${key}.png`;

  const cached = await getObject(objectKey);
  if (cached) {
    return NextResponse.json({
      url: `/api/media/${objectKey}`,
      cached: true,
      remaining: limit.remaining,
    });
  }

  const garments: TryOnGarment[] = await Promise.all(
    items.map(async (item) => ({
      category: item!.category,
      name: `the ${item!.name} (${item!.fit ?? item!.category})`,
      image: await loadGarmentImage(item!.slug),
    })),
  );

  try {
    const result = await tryOn({
      person: { data: b64, mimeType },
      garments,
      aspectRatio: "3:4",
    });

    const { url } = await putObject(
      objectKey,
      Buffer.from(result.data, "base64"),
      result.mimeType,
    );

    return NextResponse.json({ url, cached: false, remaining: limit.remaining });
  } catch (err) {
    const message = (err as Error).message;
    console.error("[tryon]", message);

    // Gemini blocks generations it considers unsafe. That's a user-actionable
    // problem (usually a photo it won't process), not a server fault.
    if (/SAFETY|PROHIBITED|blocked|no image/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "We couldn't process that photo. Try a clear, well-lit, full-body shot of one person.",
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "The fitting room is busy. Please try again in a moment." },
      { status: 502 },
    );
  }
}
