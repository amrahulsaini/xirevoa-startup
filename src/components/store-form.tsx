"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

type State = { error?: string; ok?: boolean } | null;

export function StoreForm({
  action,
}: {
  action: (prev: unknown, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useActionState(action, null);

  if (state?.ok) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-8 text-flare-rose" />
        <p className="font-medium text-bone-50">Application received.</p>
        <p className="text-sm leading-relaxed text-bone-400">
          We&apos;ll call you within a couple of days. Once you&apos;re approved,
          you can start listing stock.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-3">
      <Field name="name" label="Store name" placeholder="Sharma Garments" />

      <div className="grid grid-cols-2 gap-3">
        <Field name="city" label="City" placeholder="Jaipur" />
        <Field name="state" label="State" placeholder="Rajasthan" />
      </div>

      <Field
        name="phone"
        label="Mobile number"
        placeholder="98765 43210"
        type="tel"
        inputMode="tel"
      />

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
  type = "text",
  inputMode,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  inputMode?: "tel" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs tracking-wide text-bone-400 uppercase">
        {label}
      </span>
      <input
        name={name}
        type={type}
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
        "Sending…"
      ) : (
        <>
          Apply to list
          <ArrowRight className="size-4" />
        </>
      )}
    </button>
  );
}
