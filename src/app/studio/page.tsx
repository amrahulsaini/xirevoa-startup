import type { Metadata } from "next";
import { Studio } from "@/components/studio";
import { gateUsername } from "@/lib/session";

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
  const { add } = await searchParams;
  // Usable signed out, but a signed-in user without a username picks one first.
  await gateUsername(`/studio${add ? `?add=${add}` : ""}`);
  // Deep link from a collection card: /studio?add=tiger-tee pre-selects the piece.
  return <Studio initialSlug={add} />;
}
