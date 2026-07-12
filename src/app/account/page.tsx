import type { Metadata } from "next";
import Link from "next/link";
import { AtSign, Calendar, KeyRound, Mail, Shirt } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { signOut } from "@/auth";
import { PasswordCard } from "@/components/account-password";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await requireUser("/account");

  // Everything the profile summarises, in one round trip.
  const [looksCount, accounts, full] = await Promise.all([
    prisma.look.count({ where: { userId: user.id } }),
    prisma.account.findMany({ where: { userId: user.id }, select: { provider: true } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } }),
  ]);

  const methods = [
    ...(full?.passwordHash ? ["Email & password"] : []),
    ...accounts.map((a) => (a.provider === "google" ? "Google" : a.provider)),
  ];

  const joined = user.createdAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-24">
      <header className="flex items-center gap-5">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-800 text-2xl font-medium text-bone-100">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote OAuth avatar
            <img src={user.image} alt="" className="size-full object-cover" />
          ) : (
            (user.username?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl text-bone-50">@{user.username}</h1>
          <p className="mt-1 text-sm text-bone-400">Member since {joined}</p>
        </div>
      </header>

      {/* Details */}
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-bone-100/10 sm:grid-cols-2">
        <Row icon={<AtSign className="size-4" />} label="Username" value={`@${user.username}`} />
        <Row icon={<Mail className="size-4" />} label="Email" value={user.email} />
        <Row icon={<Calendar className="size-4" />} label="Joined" value={joined} />
        <Row
          icon={<KeyRound className="size-4" />}
          label="Sign-in methods"
          value={methods.join(" · ") || "—"}
        />
      </div>

      {/* Saved looks shortcut */}
      <Link
        href="/looks"
        className="group mt-6 flex items-center justify-between rounded-2xl bg-ink-900 p-6 transition-colors hover:bg-ink-800"
      >
        <div className="flex items-center gap-4">
          <Shirt className="size-5 text-flare-rose" />
          <div>
            <p className="font-medium text-bone-50">Your looks</p>
            <p className="text-sm text-bone-400">
              {looksCount === 0
                ? "Nothing fitted yet"
                : `${looksCount} saved ${looksCount === 1 ? "look" : "looks"}`}
            </p>
          </div>
        </div>
        <span className="text-sm text-bone-300 transition-colors group-hover:text-bone-50">
          View →
        </span>
      </Link>

      {/* Password change — only for email/password accounts. Google accounts stay
          Google-only (one method per email), so no "add password" here. */}
      {full?.passwordHash && <PasswordCard />}

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="mt-10"
      >
        <button
          type="submit"
          className="hairline rounded-full border px-6 py-3 text-sm text-bone-200 transition-colors hover:border-flare-rose/50 hover:text-bone-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-ink-950 p-6">
      <div className="flex items-center gap-2 text-xs tracking-wide text-bone-400 uppercase">
        {icon}
        {label}
      </div>
      <p className="mt-2 truncate text-bone-100">{value}</p>
    </div>
  );
}
