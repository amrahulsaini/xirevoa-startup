import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { Aurora } from "@/components/aurora";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";

/** Only a look the owner has explicitly shared is ever visible here. */
async function getShared(id: string) {
  const look = await prisma.look.findFirst({
    where: { id, shared: true },
    include: {
      garments: { include: { garment: true } },
      user: { select: { username: true } },
    },
  });
  return look;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const look = await getShared(id);
  if (!look) return { title: "Look not found" };

  const title =
    look.kind === "haircut"
      ? `${look.user.username ?? "Someone"} tried the ${look.title ?? "new cut"}`
      : `${look.user.username ?? "Someone"} tried on ${look.garments.map((g) => g.garment.name).join(", ")}`;

  const image = `/api/media/${look.imageKey}`;

  // The OG image is the whole point of sharing — without it a WhatsApp or
  // Instagram link is a grey box nobody taps.
  return {
    title,
    description: "Made with Xirevoa — try it on before you own it.",
    openGraph: {
      title,
      description: "Made with Xirevoa — try it on before you own it.",
      images: [{ url: image, width: 1024, height: 1365 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const look = await getShared(id);
  if (!look) notFound();

  const label =
    look.kind === "haircut"
      ? (look.title ?? "A new cut")
      : look.garments.map((g) => g.garment.name).join(" · ");

  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-32">
      <Aurora />

      <Reveal className="w-full max-w-md text-center">
        <Link href="/" className="inline-block text-base">
          <Logo />
        </Link>

        <div className="mt-8 overflow-hidden rounded-2xl bg-ink-900">
          {/* eslint-disable-next-line @next/next/no-img-element -- /api/media */}
          <img
            src={`/api/media/${look.imageKey}`}
            alt={label}
            className="w-full object-cover"
          />
        </div>

        <p className="mt-6 text-bone-200">
          {look.user.username ? (
            <>
              <span className="font-medium text-bone-50">
                @{look.user.username}
              </span>{" "}
              {look.kind === "haircut" ? "tried" : "tried on"}
            </>
          ) : (
            "Someone tried"
          )}
        </p>
        <p className="mt-1 font-display text-2xl text-bone-50">{label}</p>

        <p className="mt-8 text-sm leading-relaxed text-bone-400">
          This isn&apos;t a model. It&apos;s them — their face, their build, wearing
          it before they own it.
        </p>

        <Link
          href={look.kind === "haircut" ? "/salon" : "/studio"}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-bone-100 px-7 py-4 font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95"
        >
          Try it on yourself
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </section>
  );
}
