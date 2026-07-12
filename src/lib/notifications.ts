"use client";

/**
 * Notifications.
 *
 * A try-on takes 20–40s, so shoppers shouldn't have to stare at the tab. The
 * fetch keeps running while the tab is backgrounded, so when it lands we:
 *   1. push an entry into a local feed (the navbar bell), and
 *   2. fire a real browser notification if they granted permission — that's
 *      what reaches them in another tab or another app.
 *
 * The feed lives in localStorage rather than the database: it's per-device
 * ephemera, not account state, and it must render instantly without a round trip.
 */

export interface Note {
  id: string;
  title: string;
  body: string;
  href?: string;
  at: number;
  read: boolean;
}

const KEY = "xirevoa-notifications";
const MAX = 20;

/** Subscribers so the bell re-renders the moment a note is pushed. */
const listeners = new Set<() => void>();

export function subscribe(cb: () => void) {
  listeners.add(cb);
  // Notes pushed in another tab should show up here too.
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function getNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Note[];
  } catch {
    return [];
  }
}

function write(notes: Note[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes.slice(0, MAX)));
  } catch {
    // Private mode / quota — the in-page toast still fired, so don't throw.
  }
  listeners.forEach((l) => l());
}

export function pushNote(note: Omit<Note, "id" | "at" | "read">) {
  write([
    { ...note, id: crypto.randomUUID(), at: Date.now(), read: false },
    ...getNotes(),
  ]);

  // The part that actually reaches someone in another tab.
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      const n = new Notification(note.title, { body: note.body, icon: "/icon.svg" });
      n.onclick = () => {
        window.focus();
        if (note.href) window.location.assign(note.href);
        n.close();
      };
    } catch {
      // Some browsers block constructing Notification outside a SW. The bell
      // still has the entry, so this is a graceful degradation, not a failure.
    }
  }
}

export function markAllRead() {
  write(getNotes().map((n) => ({ ...n, read: true })));
}

export function clearNotes() {
  write([]);
}

/** Ask once, only in response to a user action (browsers require a gesture). */
export async function ensurePermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
