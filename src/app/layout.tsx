import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Grain } from "@/components/grain";
import { themeScript } from "@/components/theme";
import { auth, signOut } from "@/auth";

const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xirevoa.com"),
  title: {
    default: "Xirevoa — Try it on. Before you own it.",
    template: "%s · Xirevoa",
  },
  description:
    "Upload one photo and see yourself in it. Xirevoa is a virtual fitting room for denim, tees, shirts, eyewear and jewellery — powered by AI, stocked by India's local stores.",
  keywords: [
    "virtual try-on",
    "AI fashion",
    "online fitting room",
    "try clothes online",
    "Xirevoa",
  ],
  openGraph: {
    title: "Xirevoa — Try it on. Before you own it.",
    description:
      "Upload one photo and see yourself in it. A virtual fitting room for denim, tees, shirts, eyewear and jewellery.",
    url: "https://xirevoa.com",
    siteName: "Xirevoa",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xirevoa — Try it on. Before you own it.",
    description: "Upload one photo and see yourself in it.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the session here rather than wrapping the app in a client-side
  // SessionProvider — the navbar is the only thing that needs it, and this
  // keeps the session out of the client bundle entirely.
  const session = await auth();

  return (
    // suppressHydrationWarning: the inline script stamps data-theme on <html>
    // before React hydrates, so this element legitimately differs from the SSR output.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${instrument.variable} ${inter.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-ink-950 text-bone-100 antialiased">
        <Grain />
        <Navbar
          user={
            session?.user
              ? { name: session.user.name, image: session.user.image }
              : null
          }
          signOutAction={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
