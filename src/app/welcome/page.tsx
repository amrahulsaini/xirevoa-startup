import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { AuthShell } from "@/components/auth-shell";
import { UsernameForm } from "@/components/username-form";

export const metadata: Metadata = { title: "Choose a username" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await currentUser();
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/studio";

  // Signed out → sign in. Already has a username → nothing to do here.
  if (!user) redirect(`/signin?next=${encodeURIComponent(safeNext)}`);
  if (user.username) redirect(safeNext);

  return (
    <AuthShell
      title="One last"
      emphasis="thing"
      subtitle={`You're signed in as ${user.email}. Pick a username — it's how you'll show up on Xirevoa.`}
    >
      <UsernameForm next={safeNext} submitLabel="Continue" />
    </AuthShell>
  );
}
