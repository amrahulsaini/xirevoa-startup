import { NextResponse, type NextRequest } from "next/server";
import { imageSize } from "image-size";
import { z } from "zod";
import { cacheKey, nearestAspectRatio } from "@/lib/gemini";
import { analyseFace, tryHaircut } from "@/lib/salon";
import { haircutBySlug, HAIRCUTS, type FaceShape } from "@/lib/haircuts";
import { getObject, putObject } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { COST, getBalance, grant, spend } from "@/lib/xpoints";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const Body = z.object({
  person: z.string().regex(/^data:image\/(png|jpe?g|webp);base64,/),
  /** A haircut slug, or "recommend" to let the AI pick from the face shape. */
  slug: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to try a new haircut.", signin: true },
      { status: 401 },
    );
  }

  const limit = rateLimit(`salon:${userId}`, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "You've hit the hourly limit. Try again shortly." },
      { status: 429 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { person, slug } = parsed.data;

  const [meta, b64] = person.split(",", 2);
  const mimeType = meta.slice(5, meta.indexOf(";"));
  const personBytes = Buffer.from(b64, "base64");
  if (personBytes.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That photo is over 8MB." }, { status: 413 });
  }

  // "recommend" = read the face shape first, then pick the cut that suits it.
  // The analysis runs on the cheap text model, so it stays free.
  let cut = haircutBySlug(slug);
  let analysis: { shape: string; reason: string } | null = null;

  if (slug === "recommend") {
    try {
      analysis = await analyseFace({ data: b64, mimeType });
      const shape = analysis.shape as FaceShape;
      const matches = HAIRCUTS.filter(
        (h) => h.length !== "Beard" && h.suits.includes(shape),
      );
      cut = matches[0] ?? HAIRCUTS[1];
    } catch (err) {
      console.error("[salon] face analysis failed:", (err as Error).message);
      return NextResponse.json(
        { error: "We couldn't read that photo. Try a clear, front-facing shot." },
        { status: 422 },
      );
    }
  }

  if (!cut) {
    return NextResponse.json({ error: "Unknown haircut." }, { status: 400 });
  }

  // Same face + same cut = same result. Never pay twice.
  const key = cacheKey(["salon-v1", cacheKey([b64]), cut.slug]);
  const objectKey = `salon/${key}.png`;

  const cached = await getObject(objectKey);
  if (cached) {
    return NextResponse.json({
      url: `/api/media/${objectKey}`,
      cut: { slug: cut.slug, name: cut.name },
      analysis,
      cached: true,
      xpoints: await getBalance(userId),
    });
  }

  const charge = await spend(userId, COST.haircut, "haircut", cut.slug);
  if (!charge.ok) {
    return NextResponse.json(
      {
        error: `You need ${COST.haircut} XPoints and you have ${charge.balance}.`,
        insufficient: true,
        xpoints: charge.balance,
      },
      { status: 402 },
    );
  }

  let aspectRatio: ReturnType<typeof nearestAspectRatio> = "1:1";
  try {
    const { width, height } = imageSize(personBytes);
    if (width && height) aspectRatio = nearestAspectRatio(width, height);
  } catch {
    /* portrait fallback */
  }

  try {
    const result = await tryHaircut({
      person: { data: b64, mimeType },
      cutPrompt: cut.prompt,
      cutName: cut.name,
      aspectRatio,
    });

    const { url } = await putObject(
      objectKey,
      Buffer.from(result.data, "base64"),
      result.mimeType,
    );

    return NextResponse.json({
      url,
      cut: { slug: cut.slug, name: cut.name },
      analysis,
      cached: false,
      xpoints: charge.balance,
    });
  } catch (err) {
    const message = (err as Error).message;
    console.error("[salon]", message);

    // They paid for an image they didn't get.
    const refunded = await grant(userId, COST.haircut, "refund", "Failed haircut");

    return NextResponse.json(
      {
        error:
          "We couldn't do that cut. Try a clear, front-facing photo of your face. Your XPoints were not charged.",
        xpoints: refunded,
      },
      { status: 422 },
    );
  }
}
