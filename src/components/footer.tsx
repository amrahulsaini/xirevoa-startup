import Link from "next/link";
import { Wordmark } from "./wordmark";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/collection", label: "The Collection" },
      { href: "/collection?c=jeans", label: "Denim" },
      { href: "/collection?c=tshirt", label: "Tees" },
      { href: "/collection?c=glasses", label: "Eyewear" },
      { href: "/collection?c=jewellery", label: "Jewellery" },
    ],
  },
  {
    title: "Xirevoa",
    links: [
      { href: "/studio", label: "Try-On Studio" },
      { href: "/looks", label: "Looks" },
      { href: "/stores", label: "For Stores" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy#photos", label: "How we handle your photos" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="hairline relative border-t bg-ink-950 px-6 pt-20 pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="text-lg">
              <Wordmark />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-bone-400">
              A fitting room that fits in your pocket. Built in India, for the
              stores on your street.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs tracking-[0.2em] text-bone-400 uppercase">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-bone-300 transition-colors hover:text-bone-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline mt-16 flex flex-col gap-4 border-t pt-8 text-xs text-bone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Xirevoa. All rights reserved.</p>
          <p>
            Try-on imagery is AI-generated and approximate. Fit and colour may
            differ in person.
          </p>
        </div>
      </div>
    </footer>
  );
}
