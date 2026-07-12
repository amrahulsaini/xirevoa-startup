import { MODEL, type ImageRef, type AspectRatio } from "./gemini";

const API = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

async function call(model: string, parts: Part[], config: object) {
  let res!: Response;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(`${API}/${model}:generateContent?key=${apiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: config,
      }),
    });
    if (res.status !== 429 && res.status !== 503) break;
    await sleep(Math.min(15_000 * (attempt + 1), 45_000));
  }
  if (!res.ok) {
    throw new Error(`Gemini ${model} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

/* ───────────────────────────── Haircut try-on ──────────────────────────── */

/**
 * Put a haircut on someone.
 *
 * Same edit-not-generate discipline as the garment try-on, but tightened for the
 * head: a hair edit is one of the easiest ways to accidentally change a person's
 * whole face, because the model treats the head as one object. The prompt is
 * therefore explicit that the face, jaw, ears, skin and background are off-limits
 * and only the hair may move.
 */
export async function tryHaircut({
  person,
  cutPrompt,
  cutName,
  aspectRatio = "1:1",
}: {
  person: ImageRef;
  cutPrompt: string;
  cutName: string;
  aspectRatio?: AspectRatio;
}): Promise<ImageRef> {
  const parts: Part[] = [
    { inlineData: { mimeType: person.mimeType, data: person.data } },
    {
      text:
        `TASK: Edit this photograph. Change ONLY the hair. Give this person ${cutPrompt}.\n\n` +
        `The result must be the SAME photograph of the SAME person, with a new hairstyle — ` +
        `NOT a new photo of someone who resembles them.\n\n` +
        `DO NOT CHANGE, pixel for pixel:\n` +
        `  · The face. Eyes, eyebrows, nose, mouth, jawline, cheekbones, chin, ears, ` +
        `skin tone, skin texture, blemishes, expression. Do NOT slim the face, do NOT ` +
        `beautify, do NOT change the age or ethnicity. It must be the same human being.\n` +
        `  · Facial hair — unless the requested style IS a beard change, leave any beard, ` +
        `moustache or stubble exactly as it is.\n` +
        `  · The neck, shoulders, body, clothing and any jewellery.\n` +
        `  · The background, in full.\n` +
        `  · The photograph itself: same camera angle, framing, crop, lighting direction, ` +
        `colour grade, grain and focus.\n\n` +
        `THE NEW HAIR must be photorealistic: correct hairline for this person's forehead, ` +
        `natural scalp attachment, individual strands, and shadows falling the same way as ` +
        `the light already in the photo. Match their natural hair colour unless the style ` +
        `states otherwise. Hair must sit convincingly on the head — no wig edges, no floating hair.\n\n` +
        `Style requested: ${cutName}.\n` +
        `Output a single photograph, same dimensions as the input. No text, no watermark, no collage.`,
    },
  ];

  const json = await call(MODEL.pro, parts, {
    responseModalities: ["IMAGE"],
    imageConfig: { aspectRatio },
  });

  const cand = json.candidates?.[0];
  const image = cand?.content?.parts?.find((p: Part) => p.inlineData)?.inlineData;
  if (!image) {
    const reason = cand?.finishReason ?? json.promptFeedback?.blockReason ?? "no image";
    throw new Error(`Haircut generation returned no image (${reason})`);
  }
  return { data: image.data, mimeType: image.mimeType ?? "image/png" };
}

/* ──────────────────────── Face-shape recommendation ────────────────────── */

export interface FaceAnalysis {
  shape: string;
  reason: string;
}

/**
 * Reads the face shape so we can recommend cuts that actually suit it.
 *
 * Uses the cheap text model, not the image model — this is a classification, and
 * paying image rates to answer a one-word question would be silly. Returns JSON
 * so we never have to parse prose.
 */
export async function analyseFace(person: ImageRef): Promise<FaceAnalysis> {
  const json = await call(
    "gemini-2.5-flash",
    [
      { inlineData: { mimeType: person.mimeType, data: person.data } },
      {
        text:
          "Look at this person's face and classify its shape. " +
          "Answer with exactly one of: oval, round, square, heart, long, diamond. " +
          "Also give one short sentence (max 20 words) explaining what you observed " +
          "about their jaw, forehead and face length. " +
          'Respond ONLY as JSON: {"shape":"<one of the six>","reason":"<sentence>"}',
      },
    ],
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          shape: {
            type: "STRING",
            enum: ["oval", "round", "square", "heart", "long", "diamond"],
          },
          reason: { type: "STRING" },
        },
        required: ["shape", "reason"],
      },
    },
  );

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Face analysis returned nothing");

  const parsed = JSON.parse(text) as FaceAnalysis;
  return parsed;
}
