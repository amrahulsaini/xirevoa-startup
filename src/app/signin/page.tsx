import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isGoogleConfigured, signIn } from "@/auth";
import { AuthShell } from "@/components/auth-shell";
import { SignInForm } from "@/components/auth-forms";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to save your looks on Xirevoa.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const { next, error } = await searchParams;
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/studio";

  if (session?.user) redirect(safeNext);

  // Set by the auth signIn callback when a Google login is refused because the
  // email owns a password account.
  const notice =
    error === "use-password"
      ? "This email uses email & password. Sign in with your password below."
      : undefined;

  async function withGoogle() {
    "use server";
    await signIn("google", { redirectTo: safeNext });
  }

  return (
    <AuthShell
      title="Welcome"
      emphasis="back"
      subtitle="Sign in to pick up where you left off — your photo and your looks are waiting."
    >
      <SignInForm
        googleAction={withGoogle}
        showGoogle={isGoogleConfigured}
        next={safeNext}
        notice={notice}
      />
    </AuthShell>
  );
}
