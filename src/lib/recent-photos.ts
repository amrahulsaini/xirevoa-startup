"use client";

/**
 * Recently used photos, so a shopper doesn't re-upload the same shot every visit.
 *
 * Kept on the device (localStorage), not the server: these are photographs of
 * the user's body, and there's no reason to hold copies of them server-side just
 * to save a file-picker click.
 *
 * A full 1280px JPEG data URL is ~400KB and localStorage caps around 5MB, so we
 * store a small thumbnail for the picker AND the full data URL for the try-on,
 * capped at a handful of entries.
 */

export interface RecentPhoto {
  id: string;
  /** Full-size data URL — what actually gets sent to the try-on. */
  full: string;
  /** Small data URL for the picker strip. */
  thumb: string;
  at: number;
}

const KEY = "xirevoa-recent-photos";
const MAX = 4;

/* localStorage is the store; the Studio reads it via useSyncExternalStore, so
   there's no setState-in-effect and no hydration mismatch. */
const listeners = new Set<() => void>();
const EMPTY: RecentPhoto[] = [];
let cache: RecentPhoto[] = EMPTY;
let cacheRaw = "";

export function subscribeRecent(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const notify = () => listeners.forEach((l) => l());

/** Stable reference unless the contents changed, or React re-renders forever. */
export function recentSnapshot(): RecentPhoto[] {
  const raw = localStorage.getItem(KEY) ?? "[]";
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cache = JSON.parse(raw) as RecentPhoto[];
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

/** The server has no localStorage — render the strip as empty until hydrated. */
export const recentServerSnapshot = (): RecentPhoto[] => EMPTY;

export function getRecent(): RecentPhoto[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentPhoto[];
  } catch {
    return [];
  }
}

export function addRecent(full: string, thumb: string) {
  // Same image re-added shouldn't pile up duplicates.
  const existing = getRecent().filter((p) => p.full !== full);
  const next: RecentPhoto[] = [
    { id: crypto.randomUUID(), full, thumb, at: Date.now() },
    ...existing,
  ].slice(0, MAX);

  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    notify();
  } catch {
    // Quota exceeded — drop the oldest and try once more, then give up quietly.
    try {
      localStorage.setItem(KEY, JSON.stringify(next.slice(0, 2)));
      notify();
    } catch {
      /* the picker just won't remember this one */
    }
  }
}

export function removeRecent(id: string) {
  const next = getRecent().filter((p) => p.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    notify();
  } catch {
    /* ignore */
  }
}

/** Small square thumbnail for the picker strip. */
export async function makeThumb(dataUrl: string, size = 160): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  // Cover-crop to a square so the strip stays tidy.
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  return canvas.toDataURL("image/jpeg", 0.7);
}
