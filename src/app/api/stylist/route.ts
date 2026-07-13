import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { OCCASIONS, styleMe, type OccasionId } from "@/lib/stylist";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  person: z.string().regex(/^data:image\/(png|jpe?g|webp);base64,/),
  occasion: z.string(),
});

/**
 * The AI stylist. Free — it runs on the cheap text model and its whole job is to
 * funnel people into try-ons, which is where XPoints actually get spent. Charging
 * for the recommendation would tax the top of our own funnel.
 *
 * Rate limited anyway, because free still isn't zero.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to get styled.", signin: true },
      { status: 401 },
    );
  }

  const limit = rateLimit(`stylist:${userId}`, 40, 60 * 60 * 1000);
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

  const occasion = OCCASIONS.find((o) => o.id === parsed.data.occasion)?.id;
  if (!occasion) {
    return NextResponse.json({ error: "Unknown occasion." }, { status: 400 });
  }

  const [meta, b64] = parsed.data.person.split(",", 2);
  const mimeType = meta.slice(5, meta.indexOf(";"));

  try {
    const advice = await styleMe({ data: b64, mimeType }, occasion as OccasionId);

    if (advice.picks.length === 0) {
      return NextResponse.json(
        { error: "We couldn't put a look together from that photo. Try a clearer full-body shot." },
        { status: 422 },
      );
    }

    return NextResponse.json(advice);
  } catch (err) {
    console.error("[stylist]", (err as Error).message);
    return NextResponse.json(
      { error: "We couldn't read that photo. Try a clear, full-body shot." },
      { status: 422 },
    );
  }
}
