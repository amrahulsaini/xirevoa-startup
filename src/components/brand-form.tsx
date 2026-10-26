"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight } from "lucide-react";

type State = { error?: string } | null;

export function BrandForm({
  action,
}: {
  action: (prev: unknown, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="mt-8 space-y-3">
      <Field name="name" label="Brand name" placeholder="Urban Thread" />
      <Field name="website" label="Store website" placeholder="urbanthread.in" inputMode="url" />

      {state?.error && (
        <p className="flex items-start gap-2 pt-1 text-sm text-flare-rose">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  inputMode,
}: {
  name: string;
  label: string;
  placeholder: string;
  inputMode?: "url" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs tracking-wide text-bone-400 uppercase">
        {label}
      </span>
      <input
        name={name}
        type="text"
        inputMode={inputMode}
        required
        placeholder={placeholder}
        className="hairline w-full rounded-xl border bg-ink-900 px-4 py-3 text-sm text-bone-100 placeholder:text-bone-500"
      />
    </label>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-bone-100 px-6 py-3.5 text-sm font-medium text-ink-950 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        "Setting up…"
      ) : (
        <>
          Get my try-on button
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );
}
