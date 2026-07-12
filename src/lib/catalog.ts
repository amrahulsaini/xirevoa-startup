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
  /** Local path, filled from the slug. */
  image: string;
}

/**
 * The Xirevoa collection is COMPOSED, not hand-listed.
 *
 * Each category defines a set of base styles and a set of colourways; the two
 * are crossed to produce ~40 distinct pieces per category. This keeps hundreds
 * of items maintainable — tweak one colourway and every item using it updates —
 * and guarantees the generation prompts stay consistent.
 *
 * No prices at this stage: these exist so a shopper can see themselves in them.
 * Store inventory replaces them later.
 */

interface Style {
  key: string;
  name: string;
  fit?: string;
  /** Describes the cut/silhouette for the prompt. */
  desc: string;
}
interface Colour {
  key: string;
  name: string;
  /** Describes the colour/material for the prompt. */
  desc: string;
}
interface CategorySpec {
  category: Category;
  /** How the item is staged for its flat-lay shot. */
  noun: string;
  styles: Style[];
  colours: Colour[];
  taglines: string[];
}

const SPECS: CategorySpec[] = [
  {
    category: "jeans",
    noun: "pair of jeans",
    styles: [
      { key: "baggy", name: "Baggy", fit: "Baggy", desc: "baggy wide-leg jeans with a relaxed high waist and deep front pockets" },
      { key: "straight", name: "Straight", fit: "Straight", desc: "straight-fit jeans with a classic five-pocket layout and copper rivets" },
      { key: "bootcut", name: "Bootcut", fit: "Bootcut", desc: "bootcut jeans fitted through the thigh and flaring gently below the knee" },
      { key: "slim", name: "Slim", fit: "Slim", desc: "slim-fit jeans tapered to a narrow ankle" },
      { key: "wideleg", name: "Wide-Leg", fit: "Wide-Leg", desc: "high-rise wide-leg jeans with a long fluid drape to the floor" },
      { key: "cargo", name: "Cargo", fit: "Cargo", desc: "relaxed cargo jeans with utility flap pockets down each leg" },
      { key: "mom", name: "Mom", fit: "Mom", desc: "high-waisted mom jeans with a tapered ankle and slightly slouchy seat" },
      { key: "skinny", name: "Skinny", fit: "Skinny", desc: "skinny jeans with a close body-hugging cut all the way down" },
    ],
    colours: [
      { key: "indigo", name: "Indigo", desc: "deep raw indigo denim, clean and unfaded" },
      { key: "midblue", name: "Mid-Blue", desc: "mid-blue washed denim with subtle fading at the thighs" },
      { key: "stone", name: "Stonewash", desc: "light stonewashed blue denim with visible whiskering" },
      { key: "black", name: "Jet Black", desc: "solid jet black denim with black hardware" },
      { key: "ecru", name: "Ecru", desc: "off-white ecru denim, un-dyed and natural" },
    ],
    taglines: ["Room to move", "The honest cut", "Ages better than you", "Built for every day", "Sharp all the way down", "Weekend staple"],
  },
  {
    category: "tshirt",
    noun: "t-shirt",
    styles: [
      { key: "oversized", name: "Oversized", fit: "Oversized", desc: "an oversized drop-shoulder t-shirt with a boxy body" },
      { key: "boxy", name: "Boxy", fit: "Boxy", desc: "a heavyweight boxy t-shirt with structured shoulders and a cropped hem" },
      { key: "regular", name: "Regular", fit: "Regular", desc: "a regular-fit crew-neck t-shirt" },
      { key: "ringer", name: "Ringer", fit: "Ringer", desc: "a ringer t-shirt with contrast ribbed collar and sleeve cuffs" },
      { key: "vneck", name: "V-Neck", fit: "V-Neck", desc: "a slim v-neck t-shirt" },
      { key: "longline", name: "Longline", fit: "Longline", desc: "a longline t-shirt with a curved elongated hem" },
      { key: "pocket", name: "Pocket", fit: "Pocket", desc: "a regular t-shirt with a single chest patch pocket" },
      { key: "acidwash", name: "Acid Wash", fit: "Washed", desc: "a regular t-shirt with an all-over acid-wash mottled bleach effect" },
    ],
    colours: [
      { key: "bone", name: "Bone", desc: "warm off-white bone cotton, plain with no print" },
      { key: "black", name: "Black", desc: "deep washed black cotton, plain with no print" },
      { key: "mustard", name: "Mustard", desc: "warm mustard yellow cotton, plain" },
      { key: "olive", name: "Olive", desc: "muted olive green cotton, plain" },
      { key: "crimson", name: "Crimson", desc: "deep crimson red cotton, plain" },
    ],
    taglines: ["The one you'll live in", "Loud on purpose", "Washed, never faded", "Everyday armour", "Quiet confidence", "Layer or don't"],
  },
  {
    category: "shirt",
    noun: "shirt",
    styles: [
      { key: "camp", name: "Camp Collar", fit: "Relaxed", desc: "a relaxed short-sleeve camp-collar shirt" },
      { key: "oxford", name: "Oxford", fit: "Regular", desc: "a button-down oxford shirt with a structured collar" },
      { key: "overshirt", name: "Overshirt", fit: "Boxy", desc: "a boxy overshirt worn as a light jacket, with two chest pockets" },
      { key: "grandad", name: "Grandad", fit: "Slim", desc: "a slim grandad-collar shirt with a concealed placket" },
      { key: "flannel", name: "Flannel", fit: "Regular", desc: "a brushed flannel shirt with a soft collar" },
    ],
    colours: [
      { key: "sand", name: "Sand Linen", desc: "natural sand-beige linen with a visible slubby weave" },
      { key: "white", name: "White", desc: "crisp white cotton poplin" },
      { key: "noir", name: "Noir Silk", desc: "black silk with a subtle liquid sheen" },
      { key: "sky", name: "Sky Blue", desc: "soft sky-blue cotton" },
      { key: "check", name: "Check", desc: "a tonal grey and black windowpane check" },
      { key: "olive", name: "Olive", desc: "muted olive cotton twill" },
    ],
    taglines: ["Built for 40°C", "After dark", "Smart, not stiff", "Throw it over anything", "Sunday best", "Desk to dinner"],
  },
  {
    category: "jacket",
    noun: "jacket",
    styles: [
      { key: "trucker", name: "Trucker", fit: "Classic", desc: "a classic trucker denim jacket with two chest flap pockets" },
      { key: "bomber", name: "Bomber", fit: "Regular", desc: "a bomber jacket with ribbed collar, cuffs and hem" },
      { key: "biker", name: "Biker", fit: "Slim", desc: "a slim biker jacket with an asymmetric zip" },
      { key: "coach", name: "Coach", fit: "Relaxed", desc: "a relaxed coach jacket with a snap front" },
      { key: "puffer", name: "Puffer", fit: "Oversized", desc: "an oversized quilted puffer jacket" },
    ],
    colours: [
      { key: "denim", name: "Washed Denim", desc: "mid-blue washed denim with contrast orange stitching" },
      { key: "black", name: "Black", desc: "matte black" },
      { key: "tan", name: "Tan Leather", desc: "warm tan leather with a soft grain" },
      { key: "olive", name: "Olive", desc: "military olive green" },
      { key: "cream", name: "Cream", desc: "off-white cream" },
    ],
    taglines: ["Ages better than you", "Zip up, head out", "A little danger", "Rain or shine", "Cold-snap ready", "Throw-on-and-go"],
  },
  {
    category: "glasses",
    noun: "pair of glasses",
    styles: [
      { key: "aviator", name: "Aviator", desc: "aviator sunglasses with a thin metal frame and a double brow bar" },
      { key: "wayfarer", name: "Wayfarer", desc: "wayfarer sunglasses with a bold angular acetate frame" },
      { key: "round", name: "Round", desc: "round wire-frame glasses with slim temples" },
      { key: "square", name: "Square", desc: "square glasses with a thick acetate frame and clear lenses" },
      { key: "cateye", name: "Cat-Eye", desc: "cat-eye sunglasses with an upswept frame" },
      { key: "clubmaster", name: "Browline", desc: "browline glasses with a bold top rim and thin metal lower rim" },
    ],
    colours: [
      { key: "gold", name: "Gold / Green", desc: "polished gold metal with gradient dark green lenses" },
      { key: "tortoise", name: "Tortoiseshell", desc: "mottled amber-and-brown tortoiseshell acetate with clear lenses" },
      { key: "black", name: "Matte Black", desc: "matte black frame with smoke grey lenses" },
      { key: "crystal", name: "Crystal", desc: "transparent crystal acetate with clear lenses" },
      { key: "silver", name: "Silver / Blue", desc: "silver metal with pale blue-mirror lenses" },
    ],
    taglines: ["Nothing to prove", "Smart, not studious", "Made for the sun", "Reading in style", "A little drama", "Day to dusk"],
  },
  {
    category: "jewellery",
    noun: "piece of jewellery",
    styles: [
      { key: "cuban", name: "Cuban Chain", desc: "a chunky Cuban link chain necklace with thick interlocking flat links" },
      { key: "rope", name: "Rope Chain", desc: "a twisted rope chain necklace" },
      { key: "jhumka", name: "Jhumka", desc: "a pair of traditional Indian jhumka earrings with an engraved bell and a fringe of tiny dangling beads" },
      { key: "hoops", name: "Hoops", desc: "a pair of medium hoop earrings" },
      { key: "studs", name: "Studs", desc: "a pair of small round stud earrings" },
      { key: "bangle", name: "Bangle", desc: "a slim engraved bangle bracelet" },
      { key: "kada", name: "Kada", desc: "a broad traditional Indian kada cuff with etched detailing" },
      { key: "pendant", name: "Pendant", desc: "a fine chain necklace with a small geometric pendant" },
    ],
    colours: [
      { key: "gold", name: "Yellow Gold", desc: "polished yellow gold" },
      { key: "silver", name: "Oxidised Silver", desc: "oxidised antique silver" },
      { key: "rose", name: "Rose Gold", desc: "warm rose gold" },
      { key: "white", name: "White Gold", desc: "bright white gold" },
      { key: "kundan", name: "Kundan", desc: "yellow gold set with uncut kundan stones" },
    ],
    taglines: ["Weight you can feel", "Heritage, worn now", "Everyday shine", "A quiet flex", "Stack them up", "Passed down, worn forward"],
  },
  {
    category: "shoes",
    noun: "pair of shoes",
    styles: [
      { key: "sneaker", name: "Low Sneaker", fit: "Sneaker", desc: "a low-top leather sneaker with a cupsole" },
      { key: "hightop", name: "High-Top", fit: "Sneaker", desc: "a high-top canvas sneaker" },
      { key: "runner", name: "Runner", fit: "Sport", desc: "a chunky running trainer with a knit upper and thick sole" },
      { key: "chelsea", name: "Chelsea Boot", fit: "Boot", desc: "a Chelsea boot with elastic side panels" },
      { key: "chukka", name: "Chukka", fit: "Boot", desc: "a suede chukka boot with two eyelets" },
      { key: "loafer", name: "Loafer", fit: "Formal", desc: "a leather penny loafer" },
      { key: "derby", name: "Derby", fit: "Formal", desc: "a polished leather derby shoe" },
      { key: "sandal", name: "Sandal", fit: "Sandal", desc: "a pair of leather strap sandals" },
    ],
    colours: [
      { key: "white", name: "White", desc: "clean white with a white sole" },
      { key: "black", name: "Black", desc: "all black" },
      { key: "tan", name: "Tan", desc: "warm tan leather" },
      { key: "brown", name: "Brown Suede", desc: "chocolate brown suede" },
      { key: "grey", name: "Grey", desc: "cool grey with a gum sole" },
    ],
    taglines: ["Go anywhere", "Broken in on day one", "Miles to give", "Dress it up", "Weekend pair", "Warm-weather ready"],
  },
];

/** How each category's flat-lay should be staged. */
const STAGING: Record<Category, string> = {
  tshirt: "laid flat on a pure white seamless surface, front view",
  shirt: "laid flat on a pure white seamless surface, front view, collar visible",
  jeans: "laid flat on a pure white seamless surface, front view, full length",
  jacket: "laid flat on a pure white seamless surface, front view",
  dress: "laid flat on a pure white seamless surface, front view, full length",
  glasses: "floating centred on a pure white background, three-quarter front view",
  jewellery: "arranged centred on a pure white background, softly lit",
  shoes: "a matching pair arranged side by side on a pure white background, three-quarter side view",
};

function build(): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const spec of SPECS) {
    let n = 0;
    for (const style of spec.styles) {
      for (const colour of spec.colours) {
        const slug = `${spec.category}-${style.key}-${colour.key}`;
        items.push({
          slug,
          name: `${colour.name} ${style.name}`,
          category: spec.category,
          fit: style.fit,
          tagline: spec.taglines[n % spec.taglines.length],
          image: `/catalog/${slug}.png`,
          prompt:
            `Professional e-commerce catalog product photograph of ${style.desc} in ${colour.desc}. ` +
            `The item is ${STAGING[spec.category]}. Soft even studio lighting, sharp focus, ` +
            `high detail material texture, true-to-life colour, clean margins. ` +
            `ABSOLUTELY NO person, NO model, NO mannequin, NO body parts — the ${spec.noun} alone.`,
        });
        n++;
      }
    }
  }
  return items;
}

export const CATALOG: CatalogItem[] = build();

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "jeans", label: "Denim" },
  { id: "tshirt", label: "Tees" },
  { id: "shirt", label: "Shirts" },
  { id: "jacket", label: "Outerwear" },
  { id: "shoes", label: "Shoes" },
  { id: "glasses", label: "Eyewear" },
  { id: "jewellery", label: "Jewellery" },
];

export const bySlug = (slug: string) => CATALOG.find((c) => c.slug === slug);
