import type { Category } from "./gemini";

export interface CatalogItem {
  slug: string;
  name: string;
  category: Category;
  /** Merchandising line shown in the UI. */
  tagline: string;
  /** Fit/variant chip — the thing shoppers actually filter on. */
  fit?: string;
  /** Who the piece is cut for. The stylist filters on this. */
  gender: Gender;
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

/**
 * Who a piece is cut for.
 *
 * Needed because the stylist reads a photo and picks from the whole catalog —
 * without this it happily put a women's kurti on a man. Most pieces genuinely
 * are unisex; only mark `men`/`women` where the cut actually is.
 */
export type Gender = "men" | "women" | "unisex";

interface Style {
  key: string;
  name: string;
  fit?: string;
  /** Describes the cut/silhouette for the prompt. */
  desc: string;
  /** Overrides the category's gender for this one style. */
  gender?: Gender;
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
  /** Who this category is cut for. Individual styles can override. */
  gender: Gender;
  styles: Style[];
  colours: Colour[];
  taglines: string[];
}

const SPECS: CategorySpec[] = [
  {
    category: "jeans",
    noun: "pair of jeans",
    gender: "unisex",
    styles: [
      { key: "baggy", name: "Baggy", fit: "Baggy", desc: "baggy wide-leg jeans with a relaxed high waist and deep front pockets" },
      { key: "straight", name: "Straight", fit: "Straight", desc: "straight-fit jeans with a classic five-pocket layout and copper rivets" },
      { key: "bootcut", name: "Bootcut", fit: "Bootcut", desc: "bootcut jeans fitted through the thigh and flaring gently below the knee" },
      { key: "slim", name: "Slim", fit: "Slim", desc: "slim-fit jeans tapered to a narrow ankle" },
      { key: "wideleg", name: "Wide-Leg", fit: "Wide-Leg", desc: "high-rise wide-leg jeans with a long fluid drape to the floor" },
      { key: "cargo", name: "Cargo", fit: "Cargo", desc: "relaxed cargo jeans with utility flap pockets down each leg" },
      { key: "mom", name: "Mom", fit: "Mom", desc: "high-waisted mom jeans with a tapered ankle and slightly slouchy seat" , gender: "women" },
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
    gender: "unisex",
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
    gender: "unisex",
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
    gender: "unisex",
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
    gender: "unisex",
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
    gender: "unisex",
    styles: [
      { key: "cuban", name: "Cuban Chain", desc: "a chunky Cuban link chain necklace with thick interlocking flat links" },
      { key: "rope", name: "Rope Chain", desc: "a twisted rope chain necklace" },
      { key: "jhumka", name: "Jhumka", desc: "a pair of traditional Indian jhumka earrings with an engraved bell and a fringe of tiny dangling beads" , gender: "women" },
      { key: "hoops", name: "Hoops", desc: "a pair of medium hoop earrings" , gender: "women" },
      { key: "studs", name: "Studs", desc: "a pair of small round stud earrings" },
      { key: "bangle", name: "Bangle", desc: "a slim engraved bangle bracelet" , gender: "women" },
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
  /* ── Women's ── */
  {
    category: "tops",
    noun: "top",
    gender: "women",
    styles: [
      { key: "crop", name: "Crop Top", fit: "Cropped", desc: "a fitted crop top with short sleeves and a straight cropped hem" },
      { key: "peplum", name: "Peplum Top", fit: "Fitted", desc: "a peplum top, fitted through the bodice with a flared ruffle at the waist" },
      { key: "wrap", name: "Wrap Top", fit: "Relaxed", desc: "a wrap top with a v-neckline and a tie at the waist" },
      { key: "puffsleeve", name: "Puff Sleeve", fit: "Regular", desc: "a blouse with voluminous puff sleeves and a round neckline" },
      { key: "cami", name: "Camisole", fit: "Slim", desc: "a slim camisole top with thin spaghetti straps and a straight neckline" },
      { key: "tunic", name: "Tunic", fit: "Relaxed", desc: "a relaxed longline tunic top with three-quarter sleeves" },
    ],
    colours: [
      { key: "white", name: "White", desc: "crisp white cotton" },
      { key: "black", name: "Black", desc: "solid black" },
      { key: "blush", name: "Blush", desc: "soft blush pink" },
      { key: "emerald", name: "Emerald", desc: "deep emerald green" },
      { key: "floral", name: "Floral", desc: "an all-over small floral print on an ivory ground" },
    ],
    taglines: ["Day to night", "Effortless", "Made to move", "The one you reach for", "Quietly striking", "Layer or don't"],
  },
  {
    category: "kurti",
    noun: "kurti",
    gender: "women",
    styles: [
      { key: "straight", name: "Straight Kurti", fit: "Straight", desc: "a straight-cut knee-length kurti with side slits and a mandarin collar" },
      { key: "anarkali", name: "Anarkali", fit: "Flared", desc: "an Anarkali kurti, fitted at the bodice and flaring into a full floor-length skirt" },
      { key: "a-line", name: "A-Line Kurti", fit: "A-Line", desc: "an A-line kurti flaring gently from the shoulders to a mid-calf hem" },
      { key: "angrakha", name: "Angrakha", fit: "Wrap", desc: "an Angrakha-style kurti with an overlapping wrap front tied at the side" },
      { key: "short", name: "Short Kurti", fit: "Short", desc: "a short hip-length kurti with three-quarter sleeves" },
      { key: "jacket", name: "Jacket Kurti", fit: "Layered", desc: "a layered kurti with an attached long open jacket over a straight inner kurta" },
    ],
    colours: [
      { key: "indigo-block", name: "Indigo Block Print", desc: "indigo blue cotton with a traditional hand-block print" },
      { key: "mustard", name: "Mustard", desc: "warm mustard yellow with fine gold thread embroidery at the neckline" },
      { key: "ivory-chikan", name: "Ivory Chikankari", desc: "ivory cotton with delicate white Chikankari embroidery" },
      { key: "maroon", name: "Maroon", desc: "deep maroon with subtle zari border detailing" },
      { key: "teal-bandhani", name: "Teal Bandhani", desc: "teal with an all-over Bandhani tie-dye pattern" },
    ],
    taglines: ["Festival-ready", "Heritage, worn now", "Cool in the heat", "Grace, effortlessly", "Made for the occasion", "Everyday elegance"],
  },
  {
    category: "formal",
    noun: "formal outfit",
    gender: "unisex",
    styles: [
      { key: "blazer", name: "Blazer", fit: "Tailored", desc: "a single-breasted tailored blazer with notch lapels" },
      { key: "pantsuit", name: "Pantsuit", fit: "Tailored", desc: "a matching two-piece trouser suit with a tailored jacket and straight-leg trousers" },
      { key: "sheath", name: "Sheath Dress", fit: "Fitted", desc: "a knee-length fitted sheath dress with a boat neckline and short sleeves" , gender: "women" },
      { key: "pencil-skirt", name: "Pencil Skirt", fit: "Fitted", desc: "a high-waisted knee-length pencil skirt with a back vent" , gender: "women" },
      { key: "shirt-dress", name: "Shirt Dress", fit: "Relaxed", desc: "a belted midi shirt dress with a collar and button-through front" , gender: "women" },
      { key: "wide-trouser", name: "Wide Trousers", fit: "Wide-Leg", desc: "high-waisted wide-leg formal trousers with a sharp front crease" },
    ],
    colours: [
      { key: "charcoal", name: "Charcoal", desc: "charcoal grey wool" },
      { key: "navy", name: "Navy", desc: "deep navy blue" },
      { key: "black", name: "Black", desc: "sharp solid black" },
      { key: "beige", name: "Beige", desc: "warm beige" },
      { key: "pinstripe", name: "Pinstripe", desc: "dark grey with fine white pinstripes" },
    ],
    taglines: ["Boardroom-ready", "Quiet authority", "Sharp, not stiff", "Desk to dinner", "The power piece", "Tailored to win"],
  },
  {
    category: "shoes",
    noun: "pair of shoes",
    gender: "unisex",
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
  tops: "laid flat on a pure white seamless surface, front view, neckline and sleeves visible",
  kurti: "laid flat on a pure white seamless surface, front view, full length, any print or embroidery clearly visible",
  formal: "laid flat on a pure white seamless surface, front view, tailoring clearly visible",
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
          // A style can override its category — mom jeans and jhumkas are
          // women's even though denim and jewellery are otherwise unisex.
          gender: style.gender ?? spec.gender,
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
  { id: "tops", label: "Tops" },
  { id: "kurti", label: "Kurtis" },
  { id: "formal", label: "Formals" },
  { id: "jeans", label: "Denim" },
  { id: "tshirt", label: "Tees" },
  { id: "shirt", label: "Shirts" },
  { id: "jacket", label: "Outerwear" },
  { id: "shoes", label: "Shoes" },
  { id: "glasses", label: "Eyewear" },
  { id: "jewellery", label: "Jewellery" },
];

export const bySlug = (slug: string) => CATALOG.find((c) => c.slug === slug);
