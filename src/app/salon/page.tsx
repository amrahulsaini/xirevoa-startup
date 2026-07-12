import type { Metadata } from "next";
import { Salon } from "@/components/salon";
import { gateUsername } from "@/lib/session";

export const metadata: Metadata = {
  title: "The Salon",
  description:
    "See yourself in a new haircut before you sit in the chair — or let Xirevoa read your face shape and pick one that suits you.",
};

export default async function SalonPage() {
  await gateUsername("/salon");
  return <Salon />;
}
