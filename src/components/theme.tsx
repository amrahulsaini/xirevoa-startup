"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export type Theme = "light" | "dark";
const STORAGE_KEY = "xirevoa-theme";

/**
 * Runs before first paint, inlined into <head>.
 *
 * Resolves "system" here rather than in CSS, so the stylesheet only needs a
 * single [data-theme="light"] block instead of duplicating every token under a
 * prefers-color-scheme fallback. Without this, a light-mode user gets a
 * full-screen dark flash on every navigation.
 */
export const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

/**
 * The theme's source of truth is `data-theme` on <html>, written by the inline
 * script above before React ever runs. That makes the DOM an external store, so
 * it's read with useSyncExternalStore rather than mirrored into React state.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

const getSnapshot = (): Theme =>
  (document.documentElement.dataset.theme as Theme) ?? "dark";

// The server can't know what the inline script picked. Returning null keeps the
// button empty during SSR instead of rendering an icon that flips on hydration.
const getServerSnapshot = (): Theme | null => null;

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode — the toggle still works for this session.
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isLight = theme === "light";
  const flip = () => applyTheme(isLight ? "dark" : "light");

  return (
    <button
      onClick={flip}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className={cn(
        "grid size-10 place-items-center rounded-full text-bone-300 transition-colors hover:bg-bone-100/8 hover:text-bone-50",
        className,
      )}
    >
      {/* Nothing until the client knows the theme — an icon that flips on
          hydration is worse than an icon that arrives a frame late. */}
      {theme && (
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="grid place-items-center"
        >
          {isLight ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </motion.span>
      )}
    </button>
  );
}
