import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { corsHeaders, originAllowed } from "@/lib/brand";

export const runtime = "nodejs";

const Body = z.object({
  key: z.string().min(8).max(64),
  id: z.string().min(1).max(64),
  type: z.literal("add_to_cart"),
});

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const done = (status: number) => new NextResponse(null, { status, headers: corsHeaders(origin) });

  const parsed = Body.safeParse(await req.text().then(JSON.parse).catch(() => null));
  if (!parsed.success) return done(400);

  const brand = await prisma.brand.findUnique({
    where: { key: parsed.data.key },
    select: { id: true, domain: true },
  });
  if (!brand || !originAllowed(origin, brand.domain)) return done(403);

  await prisma.brandTryOn.updateMany({
    where: { id: parsed.data.id, brandId: brand.id },
    data: { addedToCart: true },
  });
  return done(204);
}
