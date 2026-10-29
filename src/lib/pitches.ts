export interface Pitch {
  slug: string;
  brand: string;
  product: string;
  productUrl: string;
}

export const PITCHES: Pitch[] = [
  { slug: "aspiga", brand: "Aspiga", product: "Stretch Corduroy Zip Front Short Dress", productUrl: "https://aspiga.com/products/dina-stretch-corduroy-short-dress-chocolate" },
  { slug: "edge-of-ember", brand: "Edge of Ember", product: "Trinity Blue Gemstone Necklace", productUrl: "https://edgeofember.com/products/trinity-blue-gemstone-necklace" },
  { slug: "otiumberg", brand: "Otiumberg", product: "Tiny Gold Disc pendant", productUrl: "https://otiumberg.com/products/tiny-gold-disc" },
  { slug: "girlfriend-collective", brand: "Girlfriend Collective", product: "Lucia Sleeveless Mini Dress", productUrl: "https://girlfriend.com/products/marble-lucia-sleeveless-mini-dress" },
  { slug: "hill-house-home", brand: "Hill House Home", product: "Kit Coat in Tea Green", productUrl: "https://hillhousehome.com/products/the-kit-coat-green" },
  { slug: "outdoor-voices", brand: "Outdoor Voices", product: "CloudKnit Cami", productUrl: "https://outdoorvoices.com/products/w-cloudknit-cami-charcoal" },
  { slug: "peepers", brand: "Peepers", product: "Rookie frames", productUrl: "https://peepers.com/products/rookie" },
  { slug: "kinn-studio", brand: "Kinn Studio", product: "Esme Diamond Tennis Necklace", productUrl: "https://kinnstudio.com/products/14k-white-gold-esme-fancy-shape-diamond-tennis-necklace" },
  { slug: "au-rate", brand: "AU-RATE", product: "Vintage Engraved Heart Locket", productUrl: "https://auratenewyork.com/products/vintage-engraved-heart-locket-pendant" },
  { slug: "undrgoods", brand: "Undrgoods", product: "Lounge Set T-shirt", productUrl: "https://undrgoods.com/products/lounge-set-t-shirt-and-shorts-black" },
  { slug: "nishida-shaheen", brand: "Nishida Shaheen", product: "Azina", productUrl: "https://nishidashaheen.com/products/azina" },
  { slug: "active-truth", brand: "Active Truth", product: "Bamboo Long Sleeve in Cobalt Blue", productUrl: "https://activetruth.com.au/products/classic-bamboo-long-sleeve-with-back-tie-cobalt-blue" },
  { slug: "damson-madder", brand: "Damson Madder", product: "Athena Jacket", productUrl: "https://damsonmadder.com/products/athena-raincoat-navy-sage-mix" },
  { slug: "cuts-clothing", brand: "Cuts Clothing", product: "AO Forever Tee", productUrl: "https://cutsclothing.com/products/ao-forever-tee-charcoal" },
  { slug: "paloma-wool", brand: "Paloma Wool", product: "No. 3070 knit", productUrl: "https://palomawool.com/products/siracha-verde-fitted-elbow-lenght-sleeve-knitted-sweater-v-neckline-khaki" },
  { slug: "venroy", brand: "Venroy", product: "Oversized T-Shirt in Travel Stickers", productUrl: "https://venroy.com.au/products/oversized-t-shirt-white-travel-stickers" },
];

export const pitchBySlug = (slug: string) => PITCHES.find((p) => p.slug === slug);
