import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { imageSize } from "image-size";
import { cacheKey, nearestAspectRatio, tryOn } from "@/lib/gemini";
import { getObject, putObject } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import {
  corsHeaders,
  fetchProductImage,
  originAllowed,
  readProduct,
  refundCredit,
  spendCredit,
} from "@/lib/brand";
import type { BrandTryOnStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const Body = z.object({
  key: z.string().min(8).max(64),
  person: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "Must be a PNG, JPEG or WebP photo"),
  image: z.url(),
  url: z.url(),
  name: z.string().trim().max(200).optional(),
});

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const reply = (body: object, status = 200) =>
    NextResponse.json(body, { status, headers: corsHeaders(origin) });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return reply({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const { key, person, image, url, name } = parsed.data;

  const brand = await prisma.brand.findUnique({ where: { key } });
  if (!brand?.active || !originAllowed(origin, brand.domain)) {
    return reply({ error: "Try-on isn't switched on for this store." }, 403);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const limit = rateLimit(`widget:${brand.id}:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.ok) {
    return reply(
      { error: `You've tried on a lot this hour. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.` },
      429,
    );
  }

  const [meta, b64] = person.split(",", 2);
  const mimeType = meta.slice(5, meta.indexOf(";"));
  const personBytes = Buffer.from(b64, "base64");
  if (personBytes.byteLength > MAX_UPLOAD_BYTES) {
    return reply({ error: "That photo is over 8MB. Please use a smaller one." }, 413);
  }

  const log = (status: BrandTryOnStatus, imageKey?: string) =>
    prisma.brandTryOn.create({
      data: { brandId: brand.id, productUrl: url, productName: name, productImage: image, status, imageKey },
      select: { id: true },
    });

  const base = process.env.AUTH_URL ?? req.nextUrl.origin;
  const objectKey = `tryon/${cacheKey(["brand-v1", cacheKey([b64]), image])}.png`;

  if (await getObject(objectKey)) {
    const { id } = await log("cached", objectKey);
    return reply({ id, url: new URL(`/api/media/${objectKey}`, base).href });
  }

  let garment;
  try {
    garment = await fetchProductImage(image);
  } catch (err) {
    console.error("[widget] product image:", (err as Error).message);
    return reply({ error: "We couldn't load this product's photo." }, 422);
  }

  let product;
  try {
    product = await readProduct(image, garment, name);
  } catch (err) {
    console.error("[widget] product read:", (err as Error).message);
    return reply({ error: "The fitting room is busy. Please try again in a moment." }, 502);
  }
  if (product.category === "none") {
    return reply({ error: "This product can't be tried on." }, 422);
  }

  let aspectRatio: ReturnType<typeof nearestAspectRatio> = "3:4";
  try {
    const { width, height } = imageSize(personBytes);
    if (width && height) aspectRatio = nearestAspectRatio(width, height);
  } catch {}

  if (!(await spendCredit(brand.id))) {
    return reply({ error: "Try-on is taking a break on this store. Please check back soon." }, 402);
  }

  try {
    const result = await tryOn({
      person: { data: b64, mimeType },
      garments: [
        {
          category: product.category,
          name: `the ${name ?? product.category}`,
          image: garment,
          onModel: product.onModel,
        },
      ],
      aspectRatio,
    });

    const stored = await putObject(objectKey, Buffer.from(result.data, "base64"), result.mimeType);
    const { id } = await log("ok", objectKey);
    return reply({ id, url: new URL(stored.url, base).href });
  } catch (err) {
    const message = (err as Error).message;
    console.error("[widget]", message);
    await refundCredit(brand.id);
    await log("failed");

    if (/SAFETY|PROHIBITED|blocked|no image/i.test(message)) {
      return reply(
        { error: "We couldn't use that photo. Try a clear, well-lit photo of just you." },
        422,
      );
    }
    return reply({ error: "The fitting room is busy. Please try again in a moment." }, 502);
  }
}
