"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { login, register, type AuthState } from "@/app/signin/actions";

/**
 * Sign-in and sign-up as two dedicated forms.
 *
 * Both navigate on the action's returned `redirectTo` rather than a server-side
 * redirect: signIn() in this Auth.js beta sets the session cookie but returns
 * the URL instead of redirecting, and a full-page navigation also forces the
 * server components (navbar) to re-render with the new session.
 */

function useRedirectOnSuccess(state: AuthState) {
  useEffect(() => {
    if (state?.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);
}

export function SignInForm({
  googleAction,
  showGoogle,
  next,
}: {
  googleAction: () => Promise<void>;
  showGoogle: boolean;
  next: string;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(login, null);
  useRedirectOnSuccess(state);

  return (
    <div className="mt-8">
      {showGoogle && (
        <>
          <form action={googleAction}>
            <GoogleButton />
          </form>
          <Divider />
        </>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <Field name="email" type="email" autoComplete="email" placeholder="you@email.com" icon={<Mail className="size-4" />} autoFocus error={state?.field === "email" ? state.error : undefined} />
        <Field name="password" type="password" autoComplete="current-password" placeholder="password" icon={<Lock className="size-4" />} error={state?.field === "password" ? state.error : undefined} />
        {state?.error && !state.field && <ErrorLine>{state.error}</ErrorLine>}
        <Submit>Sign in</Submit>
      </form>

      <p className="mt-6 text-center text-sm text-bone-400">
        New here?{" "}
        <Link href="/signup" className="text-bone-100 underline underline-offset-4 hover:text-flare-rose">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm({
  googleAction,
  showGoogle,
  next,
}: {
  googleAction: () => Promise<void>;
  showGoogle: boolean;
  next: string;
}) {
  const [state, formAction] = useActionState<AuthState, FormData>(register, null);
  useRedirectOnSuccess(state);

  return (
    <div className="mt-8">
      {showGoogle && (
        <>
          <form action={googleAction}>
            <GoogleButton />
          </form>
          <Divider />
        </>
      )}

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <Field name="email" type="email" autoComplete="email" placeholder="you@email.com" icon={<Mail className="size-4" />} autoFocus error={state?.field === "email" ? state.error : undefined} />
        <Field name="username" autoComplete="username" placeholder="username" icon={<User className="size-4" />} hint="3–20 characters — letters, numbers, underscores" error={state?.field === "username" ? state.error : undefined} />
        <Field name="password" type="password" autoComplete="new-password" placeholder="password" icon={<Lock className="size-4" />} hint="At least 8 characters" error={state?.field === "password" ? state.error : undefined} />
        {state?.error && !state.field && <ErrorLine>{state.error}</ErrorLine>}
        <Submit>Create account</Submit>
      </form>

      <p className="mt-6 text-center text-sm text-bone-400">
        Already have an account?{" "}
        <Link href="/signin" className="text-bone-100 underline underline-offset-4 hover:text-flare-rose">
          Sign in
        </Link>
      </p>
    </div>
  );
}

/* ── pieces ──────────────────────────────────────────────────────────── */

function Field({
  name,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  hint,
  error,
  autoFocus,
}: {
  name: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  icon?: React.ReactNode;
  hint?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-bone-500">
            {icon}
          </span>
        )}
        <input
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`hairline w-full rounded-full border bg-ink-900 py-3.5 pr-4 pl-11 text-sm text-bone-100 placeholder:text-bone-500 ${
            error ? "border-flare-rose" : ""
          }`}
        />
      </div>
      {error ? (
        <p className="mt-1.5 px-4 text-xs text-flare-rose">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 px-4 text-xs text-bone-500">{hint}</p>
      ) : null}
    </div>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-bone-100 px-6 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "One moment…" : <>{children}<ArrowRight className="size-4" /></>}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="hairline flex w-full items-center justify-center gap-3 rounded-full border px-6 py-3.5 text-sm font-medium text-bone-100 transition-colors hover:bg-bone-100/6 disabled:opacity-60"
    >
      <GoogleGlyph />
      Continue with Google
    </button>
  );
}

function Divider() {
  return (
    <div className="my-7 flex items-center gap-4">
      <span className="hairline h-px flex-1 border-t" />
      <span className="text-xs tracking-widest text-bone-500 uppercase">or</span>
      <span className="hairline h-px flex-1 border-t" />
    </div>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return <p className="px-4 text-sm text-flare-rose">{children}</p>;
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
