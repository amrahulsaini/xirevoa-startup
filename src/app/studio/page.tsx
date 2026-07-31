import type { Metadata } from "next";
import { Studio } from "@/components/studio";
import { gateUsername } from "@/lib/session";
import { getShopProducts } from "@/lib/shop";

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

  // Real, buyable products (affiliate feeds / stores) so they show in the rail
  // and can be tried on and bought right here.
  const products = await getShopProducts();

  // Deep link from a collection card: /studio?add=tiger-tee pre-selects the piece.
  return <Studio initialSlug={add} products={products} />;
}
