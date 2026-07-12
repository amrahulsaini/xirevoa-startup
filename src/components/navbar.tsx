"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X, Sparkles } from "lucide-react";
import { Wordmark } from "./wordmark";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/collection", label: "Collection" },
  { href: "/studio", label: "Try-On Studio" },
  { href: "/looks", label: "Looks" },
  { href: "/stores", label: "For Stores" },
];

export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);

  // Hovered link index drives the sliding pill. `null` parks it on the active route.
  const [hovered, setHovered] = useState<number | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => setCondensed(y > 24));

  const activeIndex = LINKS.findIndex((l) => pathname.startsWith(l.href));
  const target = hovered ?? (activeIndex === -1 ? null : activeIndex);

  // Measure the target link so the pill can slide to it. Re-measures on resize
  // because the nav is fluid and the offsets shift.
  useEffect(() => {
    const measure = () => {
      const el = target === null ? null : linkRefs.current[target];
      setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [target]);

  // Lock body scroll behind the mobile overlay.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4"
      >
        <nav
          className={cn(
            "flex w-full max-w-6xl items-center justify-between rounded-full border transition-all duration-500",
            condensed
              ? "glass hairline border px-4 py-2.5 shadow-2xl shadow-black/40"
              : "border-transparent px-2 py-3",
          )}
        >
          <Link href="/" className="shrink-0 px-3 text-base" aria-label="Xirevoa home">
            <Wordmark />
          </Link>

          {/* Desktop links + the sliding indicator pill */}
          <div
            className="relative hidden items-center md:flex"
            onMouseLeave={() => setHovered(null)}
          >
            <AnimatePresence>
              {pill && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 -z-10 rounded-full bg-bone-100/8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, left: pill.left, width: pill.width }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </AnimatePresence>

            {LINKS.map((link, i) => {
              const active = i === activeIndex;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={(el) => {
                    linkRefs.current[i] = el;
                  }}
                  onMouseEnter={() => setHovered(i)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition-colors duration-300",
                    active ? "text-bone-50" : "text-bone-300 hover:text-bone-50",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/studio"
              className="group hidden items-center gap-2 rounded-full bg-bone-100 px-5 py-2.5 text-sm font-medium text-ink-950 transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:flex"
            >
              <Sparkles className="size-4 transition-transform duration-500 group-hover:rotate-90" />
              Try it on
            </Link>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="grid size-10 place-items-center rounded-full text-bone-100 transition-colors hover:bg-bone-100/8 md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile overlay — links stagger in, which makes a plain list feel designed */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="glass fixed inset-0 z-30 flex flex-col justify-center px-8 md:hidden"
          >
            {LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="hairline block border-b py-5 font-display text-4xl text-bone-100"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.5 }}
              className="mt-10"
            >
              <Link
                href="/studio"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-bone-100 px-6 py-4 font-medium text-ink-950"
              >
                <Sparkles className="size-4" />
                Try it on
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
