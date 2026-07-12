import { NextResponse } from "next/server";
import { getObject } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Serves objects out of the storage driver.
 *
 * Try-on results are photographs of real people, so they deliberately do NOT
 * live in public/ where they'd be statically enumerable. They're reachable only
 * by their content hash, which is unguessable.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;

  // The key comes off the URL, so it must never be able to walk out of storage/.
  if (key.some((seg) => seg === ".." || seg.includes("\\") || seg.includes("\0"))) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const body = await getObject(key.join("/"));
  if (!body) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/png",
      // Content-addressed: the bytes for a given key can never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
