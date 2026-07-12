"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Lock } from "lucide-react";
import { setAccountPassword, type PasswordState } from "@/app/account/actions";

/**
 * Lets a signed-in user set or change their password. For a Google-first
 * account, this is what enables email + password sign-in on the same account —
 * so both methods land on one identity.
 */
export function PasswordCard() {
  const [state, formAction] = useActionState<PasswordState, FormData>(
    setAccountPassword,
    null,
  );

  return (
    <div className="mt-6 rounded-2xl bg-ink-900 p-6">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-flare-rose" />
        <h2 className="font-medium text-bone-50">Change your password</h2>
      </div>
      <p className="mt-1 text-sm text-bone-400">
        Set a new password for signing in with your email.
      </p>

      {state?.ok ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-bone-100">
          <Check className="size-4 text-flare-rose" />
          Password saved.
        </p>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="new password"
            className="hairline flex-1 rounded-full border bg-ink-950 px-4 py-3 text-sm text-bone-100 placeholder:text-bone-500"
          />
          <Submit />
        </form>
      )}
      {state?.error && <p className="mt-2 text-sm text-flare-rose">{state.error}</p>}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-bone-100 px-6 py-3 text-sm font-medium text-ink-950 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
