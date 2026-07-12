import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isGoogleConfigured, signIn } from "@/auth";
import { Aurora } from "@/components/aurora";
import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { GoogleButton, MagicLinkForm } from "@/components/signin-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to save your looks on Xirevoa.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  const { next } = await searchParams;

  // Only ever redirect to a path on our own origin. Taking `next` straight from
  // the query and handing it to a redirect is an open-redirect: an attacker
  // mails out /signin?next=https://evil.example and we bounce the user there
  // wearing a fresh session.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/studio";

  if (session?.user) redirect(safeNext);

  async function withGoogle() {
    "use server";
    await signIn("google", { redirectTo: safeNext });
  }

  async function withEmail(formData: FormData) {
    "use server";
    await signIn("nodemailer", {
      email: String(formData.get("email") ?? ""),
      redirectTo: safeNext,
    });
  }

  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-32">
      <Aurora />

      <Reveal className="w-full max-w-sm">
        <div className="hairline glass rounded-3xl border p-8 sm:p-10">
          <LogoMark className="size-9" gradientId="flare-signin" />

          <h1 className="mt-8 font-display text-4xl leading-tight text-bone-50">
            Save your <span className="text-flare italic">looks</span>.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bone-400">
            Sign in so your photo and your fitted looks are waiting for you next
            time. No passwords.
          </p>

          {isGoogleConfigured && (
            <>
              <div className="mt-8">
                <GoogleButton action={withGoogle} />
              </div>

              <div className="my-7 flex items-center gap-4">
                <span className="hairline h-px flex-1 border-t" />
                <span className="text-xs tracking-widest text-bone-500 uppercase">
                  or
                </span>
                <span className="hairline h-px flex-1 border-t" />
              </div>
            </>
          )}

          <div className={isGoogleConfigured ? "" : "mt-8"}>
            <MagicLinkForm action={withEmail} />
          </div>

          <p className="mt-8 text-xs leading-relaxed text-bone-500">
            Your photo is private. It&apos;s used to generate your try-ons and is
            never shown to other shoppers or to stores.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
