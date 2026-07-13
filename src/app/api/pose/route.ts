import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { readScene } from "@/lib/scene";
import { poseBySlug } from "@/lib/poses";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  frame: z.string().regex(/^data:image\/(png|jpe?g|webp);base64,/),
});

/**
 * Reads a camera frame and coaches the shot.
 *
 * Free, and deliberately so: it exists to produce a GOOD photo, and a good photo
 * is what makes the paid try-on worth buying. Charging to be told "your legs are
 * cut off" would be perverse.
 *
 * Rate limited hard, because it's called from a live viewfinder and free still
 * isn't zero.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in first.", signin: true }, { status: 401 });
  }

  const limit = rateLimit(`pose:${userId}`, 120, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many reads. Take the photo, or come back shortly." },
      { status: 429 },
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const [meta, b64] = parsed.data.frame.split(",", 2);
  const mimeType = meta.slice(5, meta.indexOf(";"));

  try {
    const read = await readScene({ data: b64, mimeType });
    const pose = poseBySlug(read.pose)!;

    return NextResponse.json({
      ...read,
      poseName: pose.name,
      poseCue: pose.cue,
      poseImage: pose.image,
    });
  } catch (err) {
    console.error("[pose]", (err as Error).message);
    return NextResponse.json(
      { error: "Couldn't read the scene. Try again." },
      { status: 502 },
    );
  }
}
