import "server-only";
import { randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { prisma } from "@/lib/db";
import type { Category, ImageRef } from "@/lib/gemini";

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const newBrandKey = () => `xb_${randomBytes(12).toString("hex")}`;

export function domainOf(website: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    if (!url.hostname.includes(".")) return null;
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function originAllowed(origin: string | null, domain: string): boolean {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

export function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const privateRanges = new BlockList();
privateRanges.addSubnet("0.0.0.0", 8);
privateRanges.addSubnet("10.0.0.0", 8);
privateRanges.addSubnet("100.64.0.0", 10);
privateRanges.addSubnet("127.0.0.0", 8);
privateRanges.addSubnet("169.254.0.0", 16);
privateRanges.addSubnet("172.16.0.0", 12);
privateRanges.addSubnet("192.168.0.0", 16);
privateRanges.addAddress("::", "ipv6");
privateRanges.addAddress("::1", "ipv6");
privateRanges.addSubnet("fc00::", 7, "ipv6");
privateRanges.addSubnet("fe80::", 10, "ipv6");

async function publicHost(hostname: string): Promise<boolean> {
  const addrs = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true });
  return (
    addrs.length > 0 &&
    addrs.every(({ address }) => {
      const ip = address.replace(/^::ffff:/i, "");
      return !privateRanges.check(ip, isIP(ip) === 6 ? "ipv6" : "ipv4");
    })
  );
}

export async function fetchProductImage(src: string): Promise<ImageRef> {
  let url = new URL(src);

  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== "https:") throw new Error("Product image must be served over https");
    if (!(await publicHost(url.hostname))) throw new Error("Product image host is not public");

    const res = await fetch(url, {
      redirect: "manual",
      headers: { Accept: "image/webp,image/jpeg,image/png" },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) break;
      url = new URL(next, url);
      continue;
    }

    if (!res.ok) throw new Error(`Product image HTTP ${res.status}`);

    const mimeType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!IMAGE_TYPES.includes(mimeType)) {
      throw new Error(`Product image type ${mimeType || "unknown"} is not supported`);
    }
    if (Number(res.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) {
      throw new Error("Product image is too large");
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error("Product image is too large");
    return { data: buf.toString("base64"), mimeType };
  }

  throw new Error("Product image redirected too many times");
}

const CATEGORIES: Category[] = [
  "tshirt",
  "shirt",
  "jeans",
  "jacket",
  "dress",
  "shoes",
  "glasses",
  "jewellery",
  "tops",
  "kurti",
  "formal",
];

export interface ProductRead {
  category: Category | "none";
  onModel: boolean;
}

const reads = new Map<string, ProductRead>();

export async function readProduct(
  imageUrl: string,
  image: ImageRef,
  name: string | undefined,
): Promise<ProductRead> {
  const known = reads.get(imageUrl);
  if (known) return known;

  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(`${API}/gemini-2.5-flash:generateContent?key=${k}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            {
              text:
                `This is the main image from an online store's product page` +
                (name ? ` for "${name}"` : "") +
                `.\n` +
                `- category: which of these the product is. tshirt, shirt, jeans (any trousers or ` +
                `bottoms), jacket (any outer layer), dress, shoes, glasses, jewellery, tops ` +
                `(women's tops), kurti (kurtas and kurtis), formal (suits, blazers, sarees, ` +
                `lehengas and other formalwear). Use "none" if it is not something a person wears.\n` +
                `- onModel: true if the product is shown worn by a person or mannequin, false if ` +
                `it is a flat-lay or product-only shot.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: { type: "STRING", enum: [...CATEGORIES, "none"] },
            onModel: { type: "BOOLEAN" },
          },
          required: ["category", "onModel"],
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Product read HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Product read returned nothing");

  const read = JSON.parse(text) as ProductRead;
  if (read.category !== "none" && !CATEGORIES.includes(read.category)) {
    read.category = "none";
  }

  if (reads.size > 5000) reads.clear();
  reads.set(imageUrl, read);
  return read;
}

export async function spendCredit(brandId: string): Promise<boolean> {
  const { count } = await prisma.brand.updateMany({
    where: { id: brandId, credits: { gt: 0 } },
    data: { credits: { decrement: 1 } },
  });
  return count === 1;
}

export const refundCredit = (brandId: string) =>
  prisma.brand.update({
    where: { id: brandId },
    data: { credits: { increment: 1 } },
  });
