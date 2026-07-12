import type { Metadata } from "next";
import { CollectionGrid } from "@/components/collection-grid";

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Denim, tees, shirts, outerwear, eyewear and jewellery — every piece is try-on ready.",
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <CollectionGrid initialCategory={c ?? "all"} />;
}
