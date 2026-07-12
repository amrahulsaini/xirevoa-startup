/**
 * The Salon.
 *
 * Same engine as the garment try-on, different prompt discipline: a haircut is
 * an edit of the head only, so the instruction has to be far more aggressive
 * about leaving the face, the jaw and the background alone. Change the hair,
 * nothing else.
 */

export type FaceShape = "oval" | "round" | "square" | "heart" | "long" | "diamond";

export interface Haircut {
  slug: string;
  name: string;
  /** Merchandising line. */
  tagline: string;
  /** Length family, used as the filter chip. */
  length: "Short" | "Medium" | "Long" | "Beard";
  /** The exact cut, written for the image model. */
  prompt: string;
  /** Face shapes this cut genuinely flatters — drives the AI recommendation. */
  suits: FaceShape[];
  image: string;
}

const H = (
  slug: string,
  name: string,
  tagline: string,
  length: Haircut["length"],
  prompt: string,
  suits: FaceShape[],
): Haircut => ({
  slug,
  name,
  tagline,
  length,
  prompt,
  suits,
  image: `/haircuts/${slug}.png`,
});

export const HAIRCUTS: Haircut[] = [
  // ── Short ──
  H("buzz", "Buzz Cut", "Nothing to hide behind", "Short",
    "a very short uniform buzz cut, clipper grade 1 all over, no fade",
    ["oval", "square", "diamond"]),
  H("crew", "Crew Cut", "The safe bet", "Short",
    "a classic crew cut, short on the back and sides, slightly longer on top, neatly tapered",
    ["oval", "square", "round", "heart"]),
  H("high-fade-crop", "High Fade Crop", "Sharp and modern", "Short",
    "a high skin fade on the back and sides with a short textured French crop on top and a blunt fringe",
    ["oval", "round", "long"]),
  H("caesar", "Caesar", "Short, blunt fringe", "Short",
    "a Caesar cut, short all over with a short blunt horizontal fringe across the forehead",
    ["oval", "long", "diamond"]),
  H("burst-fade", "Burst Fade", "Curved and clean", "Short",
    "a burst fade around the ears curving into the neckline, with short textured hair on top",
    ["round", "square", "oval"]),
  H("ivy", "Ivy League", "Grown-up crew cut", "Short",
    "an Ivy League cut, a longer crew cut with enough length on top to be side-parted, tapered sides",
    ["oval", "square", "heart"]),

  // ── Medium ──
  H("mid-fade-pomp", "Pompadour", "Volume up front", "Medium",
    "a pompadour, a mid fade on the sides with long hair on top swept up and back into high volume at the front",
    ["oval", "round", "square"]),
  H("quiff", "Textured Quiff", "Effortless height", "Medium",
    "a textured quiff, tapered sides with medium-length hair on top styled upward and forward, messy and matte",
    ["oval", "square", "long"]),
  H("side-part", "Side Part", "Old money", "Medium",
    "a classic side part, medium length on top combed neatly to one side with a defined hard part, tapered sides",
    ["oval", "round", "diamond"]),
  H("slick-back", "Slick Back", "All business", "Medium",
    "a slick back, medium-length hair combed straight back from the forehead with a glossy finish, tapered sides",
    ["oval", "heart", "diamond"]),
  H("curtains", "Curtains", "Nineties, revived", "Medium",
    "a curtains hairstyle, medium-length hair with a centre parting falling in two curtains framing the forehead",
    ["square", "diamond", "oval"]),
  H("messy-fringe", "Messy Fringe", "Just rolled out", "Medium",
    "a messy fringe, medium-length tousled hair falling forward across the forehead, soft and un-styled",
    ["long", "square", "oval"]),

  // ── Long ──
  H("man-bun", "Man Bun", "Tied back", "Long",
    "long hair pulled back and tied into a neat bun at the back of the head, with the sides swept back",
    ["oval", "square", "heart"]),
  H("shoulder", "Shoulder Length", "Let it grow", "Long",
    "shoulder-length straight hair, parted in the middle, falling loose around the head",
    ["oval", "square", "diamond"]),
  H("curly-long", "Long Curls", "Big and loose", "Long",
    "long loose curly hair with defined volume, reaching the shoulders",
    ["oval", "long", "square"]),
  H("wolf-cut", "Wolf Cut", "Shaggy layers", "Long",
    "a wolf cut, shaggy heavily-layered medium-long hair with wispy face-framing pieces and lots of texture",
    ["round", "oval", "heart"]),

  // ── Beards (paired with any cut) ──
  H("stubble", "Light Stubble", "Two days in", "Beard",
    "short light stubble across the jaw and chin, evenly trimmed, no moustache emphasis",
    ["round", "heart", "oval"]),
  H("full-beard", "Full Beard", "Committed", "Beard",
    "a full thick beard, neatly shaped along the jawline with a connected moustache",
    ["oval", "long", "heart", "diamond"]),
  H("goatee", "Goatee", "Just the chin", "Beard",
    "a goatee: hair on the chin and a moustache, cheeks clean-shaven",
    ["round", "square", "oval"]),
  H("clean-shave", "Clean Shave", "Back to zero", "Beard",
    "a completely clean-shaven face with no beard, moustache or stubble at all",
    ["square", "diamond", "oval"]),
];

export const HAIRCUT_LENGTHS = ["All", "Short", "Medium", "Long", "Beard"] as const;

export const haircutBySlug = (slug: string) =>
  HAIRCUTS.find((h) => h.slug === slug);

/** Human-facing description of each face shape, for the recommendation card. */
export const FACE_SHAPES: Record<FaceShape, string> = {
  oval: "Balanced proportions — almost every cut works on you.",
  round: "Soft, equal width and length. Height on top lengthens the face.",
  square: "Strong jaw and broad forehead. Texture softens the angles.",
  heart: "Wider forehead, narrower chin. Fuller sides restore balance.",
  long: "Longer than it is wide. Fringes and width shorten the face.",
  diamond: "Prominent cheekbones. Fringes and fuller sides suit you.",
};
