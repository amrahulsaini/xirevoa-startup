"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, User } from "lucide-react";
import { setUsername, type UsernameState } from "@/app/welcome/actions";

export function UsernameForm({
  next,
  defaultValue,
  submitLabel = "Save",
}: {
  next: string;
  defaultValue?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<UsernameState, FormData>(setUsername, null);

  useEffect(() => {
    if (state?.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);

  return (
    <form action={formAction} className="mt-8 space-y-3">
      <input type="hidden" name="next" value={next} />
      <div className="relative">
        <User className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-bone-500" />
        <input
          name="username"
          required
          autoFocus
          defaultValue={defaultValue}
          autoComplete="username"
          placeholder="username"
          className={`hairline w-full rounded-full border bg-ink-900 py-3.5 pr-4 pl-11 text-sm text-bone-100 placeholder:text-bone-500 ${
            state?.error ? "border-flare-rose" : ""
          }`}
        />
      </div>
      {state?.error ? (
        <p className="px-4 text-xs text-flare-rose">{state.error}</p>
      ) : (
        <p className="px-4 text-xs text-bone-500">
          3–20 characters — letters, numbers, underscores
        </p>
      )}
      <Submit label={submitLabel} />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-bone-100 px-6 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : <>{label}<ArrowRight className="size-4" /></>}
    </button>
  );
}
