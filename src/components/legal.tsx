export const UPDATED = "30 October 2026";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 pt-32 pb-24">
      <p className="text-xs tracking-[0.2em] text-bone-400 uppercase">Last updated {UPDATED}</p>
      <h1 className="mt-4 font-display text-5xl text-bone-50">{title}</h1>
      <p className="mt-5 leading-relaxed text-bone-300">{intro}</p>
      <div className="mt-12 space-y-12">{children}</div>
    </article>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-3xl text-bone-50">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-bone-300 [&_a]:text-bone-50 [&_a]:underline [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-bone-100 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
