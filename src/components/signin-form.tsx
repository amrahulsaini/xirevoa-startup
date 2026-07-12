"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, Mail } from "lucide-react";

/**
 * Sign-in buttons.
 *
 * Client components purely so `useFormStatus` can disable them while the server
 * action is in flight — double-submitting a magic link sends the shopper two
 * emails and invalidates the first one, which looks broken.
 */

function Pending({ idle, busy }: { idle: React.ReactNode; busy: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? busy : idle}</>;
}

export function GoogleButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <SubmitButton className="w-full bg-bone-100 text-ink-950 hover:scale-[1.02]">
        <Pending
          busy="Redirecting…"
          idle={
            <span className="flex items-center justify-center gap-3">
              <GoogleGlyph />
              Continue with Google
            </span>
          }
        />
      </SubmitButton>
    </form>
  );
}

export function MagicLinkForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="space-y-3">
      <div className="relative">
        <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-bone-500" />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          className="hairline w-full rounded-full border bg-ink-900 py-3.5 pr-4 pl-11 text-sm text-bone-100 placeholder:text-bone-500"
        />
      </div>

      <SubmitButton className="hairline w-full border text-bone-100 hover:bg-bone-100/6">
        <Pending
          busy="Sending your link…"
          idle={
            <span className="flex items-center justify-center gap-2">
              Email me a sign-in link
              <ArrowRight className="size-4" />
            </span>
          }
        />
      </SubmitButton>
    </form>
  );
}

function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
    </svg>
  );
}
