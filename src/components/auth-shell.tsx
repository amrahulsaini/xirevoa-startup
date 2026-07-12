import { Aurora } from "@/components/aurora";
import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";

/** Shared frame for the sign-in and sign-up pages. */
export function AuthShell({
  title,
  emphasis,
  subtitle,
  children,
}: {
  title: string;
  emphasis: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-32">
      <Aurora />
      <Reveal className="w-full max-w-sm">
        <div className="hairline glass rounded-3xl border p-8 sm:p-10">
          <LogoMark className="size-9" />
          <h1 className="mt-8 font-display text-4xl leading-tight text-bone-50">
            {title} <span className="text-flare italic">{emphasis}</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bone-400">{subtitle}</p>
          {children}
          <p className="mt-8 text-xs leading-relaxed text-bone-500">
            Your photo is private. It&apos;s used to generate your try-ons and is
            never shown to other shoppers or to stores.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
