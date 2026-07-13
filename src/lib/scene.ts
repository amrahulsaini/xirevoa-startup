import { POSES } from "./poses";
import type { ImageRef } from "./gemini";

const API = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}

export interface SceneRead {
  /** The pose slug it recommends. */
  pose: string;
  /** Why — one short sentence, spoken to the shopper. */
  why: string;
  /** Concrete, physical corrections. "Step back two paces", not "improve framing". */
  tips: string[];
  /** Is the frame actually good enough to try on from? */
  ready: boolean;
  /** What's wrong, if anything. Empty when ready. */
  problem: string;
}

/**
 * Reads a live camera frame and coaches the shot.
 *
 * Runs on gemini-2.5-flash — this is a judgement, not a picture, and it's called
 * repeatedly while the viewfinder is open, so it has to be cheap and fast. Free
 * to the user for the same reason the stylist is: it exists to produce a GOOD
 * photo, and a good photo is what makes the paid try-on worth buying.
 *
 * The tips are deliberately constrained to physical actions. "Improve the
 * lighting" is useless to someone holding a phone; "turn so the window is in
 * front of you" is something they can actually do.
 */
export async function readScene(frame: ImageRef): Promise<SceneRead> {
  const poseList = POSES.map((p) => `${p.slug}: ${p.name} — ${p.suits}`).join("\n");

  const res = await fetch(
    `${API}/gemini-2.5-flash:generateContent?key=${apiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: frame.mimeType, data: frame.data } },
              {
                text:
                  `This is a live camera frame. Someone is about to take a full-body photo of themselves ` +
                  `to virtually try on clothes. Coach them.\n\n` +
                  `Judge the frame:\n` +
                  `- Is the WHOLE body visible, head to feet, with a little space around them?\n` +
                  `- Is the light good — face lit, not backlit, not in deep shadow?\n` +
                  `- Is the background plain enough that the clothes will read clearly?\n\n` +
                  `Set "ready" to true ONLY if a good try-on could be made from this exact frame. ` +
                  `If not, set ready=false and put the single biggest problem in "problem" — one short, ` +
                  `plain sentence (e.g. "Your legs are cut off" or "The window behind you is blowing out the shot").\n\n` +
                  `Give 1-3 "tips". Each must be a PHYSICAL ACTION they can take right now — ` +
                  `"Step back two paces", "Turn so the window is in front of you", "Hold the phone at chest height". ` +
                  `Never write vague advice like "improve the lighting" or "use a better background".\n\n` +
                  `Then pick the best POSE for this specific scene from the list below, considering the ` +
                  `space, the light and what's behind them. Explain the choice in "why" — one short sentence, ` +
                  `speaking to them directly ("you").\n\n` +
                  `POSES:\n${poseList}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              pose: { type: "STRING", enum: POSES.map((p) => p.slug) },
              why: { type: "STRING" },
              tips: { type: "ARRAY", items: { type: "STRING" } },
              ready: { type: "BOOLEAN" },
              problem: { type: "STRING" },
            },
            required: ["pose", "why", "tips", "ready", "problem"],
          },
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Scene HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Scene read returned nothing");

  const read = JSON.parse(text) as SceneRead;

  // Never trust the pose id — a hallucinated slug would leave the overlay blank.
  if (!POSES.some((p) => p.slug === read.pose)) read.pose = "straight";
  read.tips = (read.tips ?? []).slice(0, 3);

  return read;
}
