import type { Category } from "./gemini";

export interface CatalogItem {
  slug: string;
  name: string;
  category: Category;
  /** Merchandising line shown in the UI. */
  tagline: string;
  /** Fit/variant chip — the thing shoppers actually filter on. */
  fit?: string;
  /** The generation prompt. This IS the product; treat edits as design changes. */
  prompt: string;
  /** Local path, filled once generated. */
  image: string;
}

/**
 * The founding Xirevoa collection.
 *
 * No prices — at this stage these exist purely so a shopper can see themselves
 * in them. Store-supplied inventory replaces these later.
 */
export const CATALOG: CatalogItem[] = [
  // ── Denim: the fit varieties are the whole pitch ──
  {
    slug: "baggy-blue",
    name: "Baggy Wide-Leg",
    category: "jeans",
    fit: "Baggy",
    tagline: "Room to move",
    prompt:
      "a pair of baggy wide-leg jeans in mid-blue washed denim, with a relaxed high waist, " +
      "deep front pockets, subtle fading at the thighs and a raw unfinished hem",
    image: "/catalog/baggy-blue.png",
  },
  {
    slug: "straight-indigo",
    name: "Straight Indigo",
    category: "jeans",
    fit: "Straight",
    tagline: "The honest cut",
    prompt:
      "a pair of straight-fit jeans in deep raw indigo denim, clean and unfaded, " +
      "with copper rivets, a classic five-pocket layout and a clean stitched hem",
    image: "/catalog/straight-indigo.png",
  },
  {
    slug: "bootcut-stone",
    name: "Bootcut Stonewash",
    category: "jeans",
    fit: "Bootcut",
    tagline: "Flares, quietly",
    prompt:
      "a pair of bootcut jeans in light stonewashed blue denim, fitted through the thigh " +
      "and flaring gently below the knee, with visible whiskering at the hips",
    image: "/catalog/bootcut-stone.png",
  },
  {
    slug: "slim-black",
    name: "Slim Jet",
    category: "jeans",
    fit: "Slim",
    tagline: "Sharp all the way down",
    prompt:
      "a pair of slim-fit jeans in solid jet black denim, no fading, tapered to a narrow ankle, " +
      "with black stitching and matte black hardware",
    image: "/catalog/slim-black.png",
  },

  // ── Tees ──
  {
    slug: "tiger-tee",
    name: "Tiger Oversized",
    category: "tshirt",
    fit: "Oversized",
    tagline: "Loud on purpose",
    prompt:
      "an oversized t-shirt in mustard yellow, with a large black screen-printed roaring tiger " +
      "head graphic across the chest and bold black block letters reading 'XIREVOA' beneath it, " +
      "with contrasting dark navy blue collar ribbing and sleeve cuffs",
    image: "/catalog/tiger-tee.png",
  },
  {
    slug: "bone-heavy",
    name: "Heavyweight Bone",
    category: "tshirt",
    fit: "Boxy",
    tagline: "The one you'll live in",
    prompt:
      "a heavyweight boxy t-shirt in warm off-white bone cotton, completely plain with no print, " +
      "thick ribbed collar, structured boxy shoulders and a slightly cropped straight hem",
    image: "/catalog/bone-heavy.png",
  },
  {
    slug: "acid-crimson",
    name: "Acid Crimson",
    category: "tshirt",
    fit: "Regular",
    tagline: "Washed, never faded",
    prompt:
      "a regular-fit t-shirt in deep crimson red with an all-over acid-wash mottled bleach effect, " +
      "plain with no graphic, standard collar and short sleeves",
    image: "/catalog/acid-crimson.png",
  },

  // ── Shirts ──
  {
    slug: "linen-sand",
    name: "Sand Linen",
    category: "shirt",
    fit: "Relaxed",
    tagline: "Built for 40°C",
    prompt:
      "a relaxed-fit long-sleeve shirt in natural sand-beige linen with a visible slubby weave, " +
      "a soft camp collar, a single chest patch pocket and tonal buttons",
    image: "/catalog/linen-sand.png",
  },
  {
    slug: "noir-silk",
    name: "Noir Silk",
    category: "shirt",
    fit: "Slim",
    tagline: "After dark",
    prompt:
      "a slim-fit long-sleeve shirt in black silk with a subtle liquid sheen, " +
      "a sharp pointed collar, concealed placket and no pockets",
    image: "/catalog/noir-silk.png",
  },

  // ── Jacket ──
  {
    slug: "trucker-denim",
    name: "Trucker Denim",
    category: "jacket",
    fit: "Classic",
    tagline: "Ages better than you",
    prompt:
      "a classic trucker denim jacket in mid-blue washed denim, open at the front, " +
      "with two chest flap pockets, copper buttons and contrast orange stitching",
    image: "/catalog/trucker-denim.png",
  },

  // ── Eyewear ──
  {
    slug: "aviator-gold",
    name: "Gold Aviator",
    category: "glasses",
    tagline: "Nothing to prove",
    prompt:
      "a pair of aviator sunglasses with a thin polished gold metal frame, " +
      "a double brow bar and gradient dark green teardrop lenses",
    image: "/catalog/aviator-gold.png",
  },
  {
    slug: "tortoise-square",
    name: "Tortoise Square",
    category: "glasses",
    tagline: "Smart, not studious",
    prompt:
      "a pair of square eyeglasses with a thick tortoiseshell acetate frame in mottled " +
      "amber and brown, with clear non-tinted lenses",
    image: "/catalog/tortoise-square.png",
  },

  // ── Jewellery ──
  {
    slug: "cuban-chain",
    name: "Cuban Link Chain",
    category: "jewellery",
    tagline: "Weight you can feel",
    prompt:
      "a chunky Cuban link chain necklace in polished yellow gold, thick interlocking flat links, " +
      "arranged in a loose curve",
    image: "/catalog/cuban-chain.png",
  },
  {
    slug: "jhumka-silver",
    name: "Silver Jhumka",
    category: "jewellery",
    tagline: "Heritage, worn now",
    prompt:
      "a pair of traditional Indian jhumka earrings in oxidised silver, with an intricately " +
      "engraved dome-shaped bell and a fringe of tiny dangling silver beads",
    image: "/catalog/jhumka-silver.png",
  },
];

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "jeans", label: "Denim" },
  { id: "tshirt", label: "Tees" },
  { id: "shirt", label: "Shirts" },
  { id: "jacket", label: "Outerwear" },
  { id: "glasses", label: "Eyewear" },
  { id: "jewellery", label: "Jewellery" },
];

export const bySlug = (slug: string) => CATALOG.find((c) => c.slug === slug);
