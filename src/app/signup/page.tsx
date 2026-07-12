import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isGoogleConfigured, signIn } from "@/auth";
import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a Xirevoa account to save your looks.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  const { next } = await searchParams;
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/studio";

  if (session?.user) redirect(safeNext);

  async function withGoogle() {
    "use server";
    await signIn("google", { redirectTo: safeNext });
  }

  return (
    <AuthShell
      title="Create your"
      emphasis="account"
      subtitle="Pick a username and password. Your saved looks live here."
    >
      <SignUpForm
        googleAction={withGoogle}
        showGoogle={isGoogleConfigured}
        next={safeNext}
      />
    </AuthShell>
  );
}
