"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Check } from "lucide-react";
import {
  clearNotes,
  getNotes,
  markAllRead,
  subscribe,
  type Note,
} from "@/lib/notifications";
import { cn } from "@/lib/cn";

/** localStorage is the store; useSyncExternalStore keeps the bell honest. */
const emptySnapshot: Note[] = [];
let cache: Note[] = emptySnapshot;
let cacheRaw = "";

function getSnapshot(): Note[] {
  // Return a stable reference unless the contents actually changed, or
  // useSyncExternalStore will loop forever re-rendering.
  const raw = localStorage.getItem("xirevoa-notifications") ?? "[]";
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = getNotes();
  }
  return cache;
}
const getServerSnapshot = (): Note[] => emptySnapshot;

export function NotificationBell() {
  const notes = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notes.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = useCallback(() => {
    setOpen((v) => {
      if (!v && unread) markAllRead();
      return !v;
    });
  }, [unread]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={unread ? `${unread} new notifications` : "Notifications"}
        className="relative grid size-10 place-items-center rounded-full text-bone-300 transition-colors hover:bg-bone-100/8 hover:text-bone-50"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-flare-rose px-1 text-[10px] font-semibold text-bone-50"
          >
            {unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong hairline absolute right-0 mt-3 w-[19rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border shadow-2xl shadow-black/40"
          >
            <div className="hairline flex items-center justify-between border-b px-4 py-3">
              <span className="text-xs tracking-[0.18em] text-bone-400 uppercase">
                Notifications
              </span>
              {notes.length > 0 && (
                <button
                  onClick={clearNotes}
                  className="text-xs text-bone-400 transition-colors hover:text-bone-100"
                >
                  Clear
                </button>
              )}
            </div>

            {notes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-bone-500">
                Nothing yet. We&apos;ll tell you when a look is ready.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {notes.map((n) => (
                  <li key={n.id} className="hairline border-b last:border-0">
                    <Item note={n} onNavigate={() => setOpen(false)} />
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Item({ note, onNavigate }: { note: Note; onNavigate: () => void }) {
  const body = (
    <div className={cn("px-4 py-3", !note.read && "bg-bone-100/[0.04]")}>
      <div className="flex items-start gap-2.5">
        <Check className="mt-0.5 size-4 shrink-0 text-flare-rose" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-bone-50">{note.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-bone-400">{note.body}</p>
          <p className="mt-1 text-[11px] text-bone-500">{ago(note.at)}</p>
        </div>
      </div>
    </div>
  );

  return note.href ? (
    <Link href={note.href} onClick={onNavigate} className="block hover:bg-bone-100/[0.06]">
      {body}
    </Link>
  ) : (
    body
  );
}

function ago(at: number) {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
