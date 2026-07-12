import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { Aurora } from "@/components/aurora";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Check your email",
};

export default function CheckEmailPage() {
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-32">
      <Aurora />
      <Reveal className="w-full max-w-sm text-center">
        <div className="hairline glass rounded-3xl border p-10">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-ink-800">
            <MailCheck className="size-6 text-flare-rose" />
          </div>
          <h1 className="mt-8 font-display text-4xl leading-tight text-bone-50">
            Check your inbox.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bone-400">
            We&apos;ve sent you a sign-in link. It works once and expires in 24
            hours.
          </p>
          <p className="mt-6 text-xs text-bone-500">
            Nothing there? Check spam — and make sure you typed the address
            correctly.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
