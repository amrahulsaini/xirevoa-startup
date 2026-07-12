import type { Metadata } from "next";
import { Studio } from "@/components/studio";

export const metadata: Metadata = {
  title: "Try-On Studio",
  description:
    "Upload a photo, stack a look, and see yourself wearing it. Xirevoa's virtual fitting room.",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  // Deep link from a collection card: /studio?add=tiger-tee pre-selects the piece.
  const { add } = await searchParams;
  return <Studio initialSlug={add} />;
}
