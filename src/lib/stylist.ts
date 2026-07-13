import { CATALOG } from "./catalog";
import type { ImageRef } from "./gemini";

const API = "https://generativelanguage.googleapis.com/v1beta/models";

function apiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}

export const OCCASIONS = [
  { id: "everyday", label: "Everyday", hint: "casual, comfortable, daytime" },
  { id: "office", label: "Office", hint: "smart, professional, workwear" },
  { id: "festive", label: "Wedding / Festive", hint: "Indian festive or wedding celebration, traditional or dressy" },
  { id: "night", label: "Night out", hint: "going out in the evening, bars and clubs, bolder" },
  { id: "date", label: "Date", hint: "a date — put-together but relaxed, flattering" },
  { id: "travel", label: "Travel", hint: "airports and long journeys, comfortable and practical" },
] as const;

export type OccasionId = (typeof OCCASIONS)[number]["id"];

export interface StyleAdvice {
  /** Body read — used for sizing and for the styling rationale. */
  build: string;
  skinTone: string;
  /** Estimated sizes. Explicitly an estimate; we say so in the UI. */
  sizeTop: string;
  sizeBottom: string;
  sizeNote: string;
  /** Catalog slugs to put on them. */
  picks: string[];
  /** Why these pieces, in one or two sentences. */
  reason: string;
}

/**
 * Reads the shopper and picks an outfit for the occasion.
 *
 * Runs on gemini-2.5-flash, not the image model — this is a *reading* and a
 * *choice*, not a picture, and paying image rates for it would be silly. That's
 * also why the whole feature is free: it costs us almost nothing, and it exists
 * to funnel people into try-ons, which do cost XPoints.
 *
 * The model is handed a compact catalog index and must return real slugs. We
 * validate every slug against the catalog afterwards — a hallucinated id would
 * otherwise blow up the Studio.
 */
export async function styleMe(
  person: ImageRef,
  occasion: OccasionId,
): Promise<StyleAdvice> {
  const occ = OCCASIONS.find((o) => o.id === occasion) ?? OCCASIONS[0];

  // Gender is in the index because without it the stylist happily put a women's
  // kurti on a man. It's a hint, not a cage — the model is told to respect how
  // the person presents and that unisex pieces suit anyone.
  const index = CATALOG.map(
    (c) => `${c.slug}|${c.category}|${c.gender}|${c.fit ?? "-"}|${c.name}`,
  ).join("\n");

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
              { inlineData: { mimeType: person.mimeType, data: person.data } },
              {
                text:
                  `You are a personal stylist. Look at this person and dress them for: ${occ.label} (${occ.hint}).\n\n` +
                  `First, read them honestly:\n` +
                  `- build: their body type in 2-4 words (e.g. "slim, average height", "broad shoulders, athletic").\n` +
                  `- skinTone: 2-3 words (e.g. "warm medium brown").\n` +
                  `- sizeTop / sizeBottom: estimated clothing size, one of XS, S, M, L, XL, XXL.\n` +
                  `- sizeNote: one short sentence on how confident you are and what could change it.\n\n` +
                  `Then choose an outfit from the catalog below. Rules:\n` +
                  `- Pick 2 to 4 items. They must work together as one outfit.\n` +
                  `- At most ONE item per category. Do not pick two tops or two bottoms.\n` +
                  `- The catalog marks each piece men / women / unisex. Choose pieces cut for ` +
                  `how this person presents; "unisex" suits anyone. Do NOT put a women's-only ` +
                  `piece (e.g. a kurti) on a man, or vice versa.\n` +
                  `- Choose colours that flatter their skin tone, and cuts that flatter their build.\n` +
                  `- Return ONLY slugs that appear in the catalog, exactly as written.\n\n` +
                  `Finally, in "reason", explain in 1-2 sentences why these pieces suit THIS person — ` +
                  `reference their build or colouring specifically. Speak to them directly ("you").\n\n` +
                  `CATALOG (slug|category|gender|fit|name):\n${index}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              build: { type: "STRING" },
              skinTone: { type: "STRING" },
              sizeTop: { type: "STRING", enum: ["XS", "S", "M", "L", "XL", "XXL"] },
              sizeBottom: { type: "STRING", enum: ["XS", "S", "M", "L", "XL", "XXL"] },
              sizeNote: { type: "STRING" },
              picks: { type: "ARRAY", items: { type: "STRING" } },
              reason: { type: "STRING" },
            },
            required: [
              "build",
              "skinTone",
              "sizeTop",
              "sizeBottom",
              "sizeNote",
              "picks",
              "reason",
            ],
          },
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Stylist HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Stylist returned nothing");

  const advice = JSON.parse(text) as StyleAdvice;

  // Never trust the slugs. Drop anything that isn't real, and enforce one item
  // per category so the Studio doesn't get handed two pairs of jeans.
  const seen = new Set<string>();
  advice.picks = advice.picks
    .map((slug) => CATALOG.find((c) => c.slug === slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => {
      if (seen.has(item.category)) return false;
      seen.add(item.category);
      return true;
    })
    .slice(0, 4)
    .map((item) => item.slug);

  return advice;
}
