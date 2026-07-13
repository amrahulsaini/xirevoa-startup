"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Check,
  Download,
  Layers,
  RotateCcw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { Spinner } from "./spinner";
import { ensurePermission, pushNote } from "@/lib/notifications";
import {
  addRecent,
  makeThumb,
  recentServerSnapshot,
  recentSnapshot,
  removeRecent,
  subscribeRecent,
  type RecentPhoto,
} from "@/lib/recent-photos";
import { CATALOG, CATEGORIES, bySlug, type CatalogItem } from "@/lib/catalog";
import { downscaleToDataUrl } from "@/lib/downscale";
import { cn } from "@/lib/cn";

const MAX_LAYERS = 4;

/** How many garments the rail shows before "Show more". */
const PAGE_SIZE = 12;

/** Stages the user actually perceives. Drives both the UI and the copy. */
type Stage = "idle" | "fitting" | "done" | "error";

/**
 * The Try-On Studio.
 *
 * One rule shapes this whole component: a try-on is a slow, paid API call.
 * So the UI must (a) never let the user fire one accidentally, (b) make the
 * 30s wait feel deliberate rather than broken, and (c) never lose their photo.
 */
export function Studio({ initialSlug }: { initialSlug?: string }) {
  const [person, setPerson] = useState<string | null>(null);
  const [look, setLook] = useState<string[]>(
    initialSlug && bySlug(initialSlug) ? [initialSlug] : [],
  );
  const [category, setCategory] = useState<string>("all");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<string | null>(null);
  // The API returns a URL, but the browser still has to fetch the image behind
  // it. Cross-fading on `result` alone would leave the pane empty for the length
  // of that download, so we hold the user's photo until the result has painted.
  const [resultPainted, setResultPainted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** When an error is fixable (sign in / top up), point straight at the fix. */
  const [fixLink, setFixLink] = useState<{ href: string; label: string } | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [limit, setLimit] = useState(PAGE_SIZE);

  // Recent uploads live in localStorage — an external store, so it's read with
  // useSyncExternalStore rather than mirrored into state via an effect.
  const recent = useSyncExternalStore(
    subscribeRecent,
    recentSnapshot,
    recentServerSnapshot,
  );

  const [query, setQuery] = useState("");

  // 335 pieces behind a category chip and a 12-item page is not browsable.
  // Search across name, fit, tagline and category so "baggy", "kurti", "olive"
  // and "chelsea" all land.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.fit?.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.category.includes(q)
      );
    });
  }, [category, query]);

  const shown = visible.slice(0, limit);

  // Switching category should start the new section from the top, not carry over
  // however far the previous one had been paged.
  const pickCategory = (id: string) => {
    setCategory(id);
    setLimit(PAGE_SIZE);
  };

  const toggle = (item: CatalogItem) => {
    setLook((prev) => {
      if (prev.includes(item.slug)) return prev.filter((s) => s !== item.slug);

      // One garment per body zone — you can't wear two pairs of jeans. Adding a
      // second item of a category replaces the first, which is what people mean.
      const withoutSameCategory = prev.filter(
        (s) => bySlug(s)?.category !== item.category,
      );
      if (withoutSameCategory.length >= MAX_LAYERS) return prev;
      return [...withoutSameCategory, item.slug];
    });
  };

  const pickPhoto = useCallback(async (file: File) => {
    setError(null);
    try {
      const full = await downscaleToDataUrl(file);
      setPerson(full);
      setResult(null);
      setStage("idle");
      // Remember it so they don't have to re-upload next time.
      addRecent(full, await makeThumb(full));
    } catch {
      setError("We couldn't read that image. Try a JPEG or PNG.");
    }
  }, []);

  /** Re-use a previously uploaded photo. */
  const usePhoto = useCallback((full: string) => {
    setPerson(full);
    setResult(null);
    setResultPainted(false);
    setStage("idle");
    setError(null);
  }, []);

  const fit = async () => {
    if (!person || look.length === 0) return;
    setStage("fitting");
    setError(null);
    setResultPainted(false);

    // Ask on the click — browsers only grant permission from a user gesture, and
    // this is the moment it's obviously relevant.
    void ensurePermission();

    const names = look.map((s) => bySlug(s)?.name).filter(Boolean).join(", ");

    try {
      // This request keeps running while the tab is in the background, which is
      // why a notification on completion is worth anything.
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, slugs: look }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        // 401 = signed out, 402 = out of XPoints. Both are fixable, so offer the
        // fix rather than just an error message.
        setFixLink(
          data.signin
            ? { href: "/signin?next=/studio", label: "Sign in" }
            : data.insufficient
              ? { href: "/pricing", label: "Get XPoints" }
              : null,
        );
        setStage("error");
        return;
      }
      setResult(data.url);
      setStage("done");
      if (typeof data.xpoints === "number") router.refresh();
      // Point at where the image is SAVED, not back at the generator — the
      // Studio's in-memory state is gone by the time they click a notification
      // from another tab, so sending them here showed them nothing.
      pushNote({
        title: "Your look is ready",
        body: names ? `You're wearing ${names}.` : "Your try-on is ready to view.",
        href: "/looks",
      });
    } catch {
      setError("Couldn't reach the fitting room. Check your connection.");
      setStage("error");
    }
  };

  const ready = person !== null && look.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
      <header className="mb-12">
        <h1 className="font-display text-5xl text-bone-50 sm:text-6xl">
          The <span className="text-flare italic">Studio</span>
        </h1>
        <p className="mt-4 max-w-lg text-bone-400">
          Add your photo, stack up to {MAX_LAYERS} pieces, and see the whole look
          at once.
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[440px_1fr]">
        {/* Left column: only stick when it actually fits the viewport. Pinning a
            column taller than the screen strands its lower half (the Fit button)
            off-screen and unreachable — which is what "can't scroll the left
            side while it generates" was. `max-h` + overflow lets it scroll on
            its own when tall. */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
          <PhotoPane
            person={person}
            result={result}
            stage={stage}
            resultPainted={resultPainted}
            onPainted={() => setResultPainted(true)}
            onPick={() => fileInput.current?.click()}
            onClear={() => {
              setPerson(null);
              setResult(null);
              setResultPainted(false);
              setStage("idle");
            }}
          />

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) pickPhoto(file);
              e.target.value = ""; // let the same file be re-picked
            }}
          />

          <RecentStrip
            recent={recent}
            current={person}
            onUse={usePhoto}
            onUpload={() => fileInput.current?.click()}
            onRemove={removeRecent}
          />

          <LookStack look={look} onRemove={(slug) => setLook((l) => l.filter((s) => s !== slug))} />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <p className="flex items-start gap-2 text-sm text-flare-rose">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </p>
                {fixLink && (
                  <Link
                    href={fixLink.href}
                    className="mt-3 inline-flex rounded-full bg-bone-100 px-5 py-2.5 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    {fixLink.label}
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex gap-3">
            <button
              onClick={fit}
              disabled={!ready || stage === "fitting"}
              className={cn(
                "group flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 font-medium transition-all duration-300",
                ready && stage !== "fitting"
                  ? "bg-bone-100 text-ink-950 hover:scale-[1.02] active:scale-95"
                  : "cursor-not-allowed bg-ink-800 text-bone-400",
              )}
            >
              {stage === "fitting" ? (
                <>
                  <Spinner className="text-lg" />
                  Fitting…
                </>
              ) : (
                <>{result ? "Fit again" : "Fit the look"}</>
              )}
            </button>

            {result && (
              <a
                href={result}
                download="xirevoa-look.png"
                className="hairline grid size-14 shrink-0 place-items-center rounded-full border text-bone-200 transition-colors hover:bg-bone-100/6 hover:text-bone-50"
                aria-label="Download your look"
              >
                <Download className="size-5" />
              </a>
            )}
          </div>

          {/* Tell them what's blocking the button rather than leaving it dead */}
          {!ready && (
            <p className="mt-3 text-center text-sm text-bone-400">
              {!person
                ? "Add a photo to begin"
                : "Pick at least one piece below"}
            </p>
          )}
        </div>

        {/* ───────────── Right: the rail ───────────── */}
        <div>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-bone-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder="Search 335 pieces — baggy, kurti, olive, chelsea…"
              className="hairline w-full rounded-full border bg-ink-900 py-3 pr-10 pl-11 text-sm text-bone-100 placeholder:text-bone-500"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 grid size-6 -translate-y-1/2 place-items-center rounded-full text-bone-400 hover:text-bone-100"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => pickCategory(c.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors duration-300",
                  category === c.id
                    ? "bg-bone-100 text-ink-950"
                    : "hairline border text-bone-300 hover:bg-bone-100/6 hover:text-bone-50",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <div className="hairline rounded-2xl border border-dashed py-20 text-center">
              <p className="font-medium text-bone-100">Nothing matches “{query}”.</p>
              <p className="mt-2 text-sm text-bone-400">
                Try a fit, colour or style — “bootcut”, “anarkali”, “loafer”.
              </p>
            </div>
          )}

          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {shown.map((item) => (
                <GarmentCard
                  key={item.slug}
                  item={item}
                  selected={look.includes(item.slug)}
                  onToggle={() => toggle(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* 245 pieces is far too many to dump at once — page them in. */}
          {shown.length < visible.length && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
                className="hairline rounded-full border px-7 py-3 text-sm font-medium text-bone-200 transition-colors duration-300 hover:bg-bone-100/6 hover:text-bone-50"
              >
                Show more
              </button>
              <p className="text-xs text-bone-500">
                Showing {shown.length} of {visible.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Photo / result pane ────────────────────────── */

function PhotoPane({
  person,
  result,
  stage,
  resultPainted,
  onPainted,
  onPick,
  onClear,
}: {
  person: string | null;
  result: string | null;
  stage: Stage;
  resultPainted: boolean;
  onPainted: () => void;
  onPick: () => void;
  onClear: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  if (!person) {
    return (
      <button
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          // Handled by the parent's input in the common case; drop is a bonus path.
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            const input = document.querySelector<HTMLInputElement>(
              'input[type="file"]',
            );
            if (input) {
              input.files = dt.files;
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }}
        className={cn(
          "flex aspect-3/4 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed transition-colors duration-300",
          dragOver
            ? "border-flare-rose bg-flare-rose/5"
            : "hairline border bg-ink-900 hover:bg-ink-800",
        )}
      >
        <div className="grid size-14 place-items-center rounded-full bg-ink-800">
          <Upload className="size-5 text-bone-300" />
        </div>
        <div className="px-8 text-center">
          <p className="font-medium text-bone-100">Add your photo</p>
          <p className="mt-1.5 text-sm leading-relaxed text-bone-400">
            A full-body shot against a plain wall works best. Face the camera,
            arms relaxed.
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="relative aspect-3/4 w-full overflow-hidden rounded-2xl bg-ink-900">
      {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, not optimizable */}
      <img
        src={person}
        alt="Your uploaded photo"
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-700",
          resultPainted ? "opacity-0" : "opacity-100",
        )}
      />

      {result && (
        <motion.div
          initial={false}
          animate={
            resultPainted
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 1.04 }
          }
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <ResultImage src={result} onPainted={onPainted} />
        </motion.div>
      )}

      <AnimatePresence>{stage === "fitting" && <FittingOverlay />}</AnimatePresence>

      <button
        onClick={onClear}
        aria-label="Remove photo"
        className="glass absolute top-3 right-3 grid size-9 place-items-center rounded-full text-bone-100 transition-transform hover:scale-110"
      >
        {result ? <RotateCcw className="size-4" /> : <X className="size-4" />}
      </button>
    </div>
  );
}

/* ─────────────────────── Recently used photos ──────────────────────── */

/**
 * Strip of previously uploaded photos, so a returning shopper can re-use a shot
 * in one tap instead of digging through their camera roll again. Always offers
 * "Upload new" alongside.
 */
function RecentStrip({
  recent,
  current,
  onUse,
  onUpload,
  onRemove,
}: {
  recent: RecentPhoto[];
  current: string | null;
  onUse: (full: string) => void;
  onUpload: () => void;
  onRemove: (id: string) => void;
}) {
  if (recent.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="text-xs tracking-[0.2em] text-bone-400 uppercase">
        Your photos
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {recent.map((p) => {
          const active = current === p.full;
          return (
            <div key={p.id} className="group relative">
              <button
                onClick={() => onUse(p.full)}
                aria-label="Use this photo"
                aria-pressed={active}
                className={cn(
                  "size-16 overflow-hidden rounded-xl ring-2 transition-all duration-300",
                  active
                    ? "ring-flare-rose"
                    : "ring-transparent hover:ring-bone-100/25",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL */}
                <img src={p.thumb} alt="" className="size-full object-cover" />
              </button>
              <button
                onClick={() => onRemove(p.id)}
                aria-label="Forget this photo"
                className="glass absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full text-bone-200 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}

        <button
          onClick={onUpload}
          className="hairline grid size-16 place-items-center rounded-xl border border-dashed text-bone-400 transition-colors hover:bg-bone-100/5 hover:text-bone-100"
          aria-label="Upload a new photo"
        >
          <Upload className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * The generated result.
 *
 * Deliberately NOT reliant on React's onLoad alone. If the image is already in
 * the browser cache — which is exactly what happens on a cached try-on — the
 * load completes before React attaches the handler, onLoad never fires, and the
 * result stays at opacity 0 forever while the user sits looking at their own
 * uploaded photo. That was the "sometimes the generated image doesn't show" bug.
 *
 * So we ALSO check `complete` on mount, and keep a timeout as a last resort:
 * showing a possibly-half-painted image beats showing nothing.
 */
function ResultImage({
  src,
  onPainted,
}: {
  src: string;
  onPainted: () => void;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    // Already decoded from cache before React got here.
    if (img?.complete && img.naturalWidth > 0) {
      onPainted();
      return;
    }
    // Belt and braces: never leave the user staring at their own photo.
    const t = setTimeout(onPainted, 8000);
    return () => clearTimeout(t);
  }, [src, onPainted]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- served from /api/media, already optimised
    <img
      ref={ref}
      src={src}
      alt="You, wearing the look"
      onLoad={onPainted}
      // A broken image must still reveal, or the pane is stuck forever.
      onError={onPainted}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

/**
 * The wait is 20-40 seconds. A spinner for that long reads as "hung".
 * A scanning sweep plus rotating status copy reads as "working".
 */
const FITTING_COPY = [
  "Reading your build…",
  "Cutting the pattern…",
  "Matching the drape…",
  "Setting the light…",
  "Almost there…",
];

function FittingOverlay() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setI((v) => Math.min(v + 1, FITTING_COPY.length - 1)),
      6000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Centred, not bottom-aligned — the status is the whole point while
      // waiting, so it belongs in the middle of the frame.
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-ink-950/70 backdrop-blur-[3px]"
    >
      {/* Scanning sweep down the body */}
      <motion.div
        className="absolute inset-x-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-flare-rose) 28%, transparent), transparent)",
        }}
        animate={{ y: ["-10%", "420%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Status card */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass hairline relative z-10 mx-6 overflow-hidden rounded-2xl border px-8 py-7 text-center shadow-2xl shadow-black/40"
      >
        {/* A light sheen travelling across the card */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/2"
          style={{
            background:
              "linear-gradient(100deg, transparent, color-mix(in oklab, var(--color-bone-100) 10%, transparent), transparent)",
            animation: "sheen 2.6s ease-in-out infinite",
          }}
        />

        <Spinner className="text-2xl" />

        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-4 text-sm font-medium text-bone-100"
          >
            {FITTING_COPY[i]}
          </motion.p>
        </AnimatePresence>

        <p className="mt-2 text-xs leading-relaxed text-bone-400">
          This takes 20–40 seconds.
          <br />
          Keep browsing — we&apos;ll notify you.
        </p>

        {/* Progress ticks */}
        <div className="mt-5 flex justify-center gap-1.5">
          {FITTING_COPY.map((_, n) => (
            <span
              key={n}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                n <= i ? "w-6 bg-flare-rose" : "w-1.5 bg-bone-100/20",
              )}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────── Look stack ───────────────────────────── */

function LookStack({
  look,
  onRemove,
}: {
  look: string[];
  onRemove: (slug: string) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 text-xs tracking-[0.2em] text-bone-400 uppercase">
        <Layers className="size-3.5" />
        Your look
        <span className="text-bone-500">
          {look.length}/{MAX_LAYERS}
        </span>
      </div>

      <div className="mt-3 flex min-h-11 flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {look.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-bone-500"
            >
              Nothing picked yet.
            </motion.p>
          )}

          {look.map((slug) => {
            const item = bySlug(slug);
            if (!item) return null;
            return (
              <motion.button
                key={slug}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => onRemove(slug)}
                className="hairline group flex items-center gap-2 rounded-full border bg-ink-900 py-1.5 pr-3 pl-1.5 text-sm text-bone-200 transition-colors hover:border-flare-rose/50"
              >
                <span className="relative size-7 overflow-hidden rounded-full bg-product">
                  <Image src={item.image} alt="" fill sizes="28px" className="object-cover" />
                </span>
                {item.name}
                <X className="size-3.5 text-bone-500 transition-colors group-hover:text-flare-rose" />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Garment card ──────────────────────────── */

function GarmentCard({
  item,
  selected,
  onToggle,
}: {
  item: CatalogItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onToggle}
      aria-pressed={selected}
      className="group text-left"
    >
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-xl bg-product ring-2 transition-all duration-300",
          selected ? "ring-flare-rose" : "ring-transparent hover:ring-bone-100/20",
        )}
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, 240px"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-flare-rose text-bone-50 shadow-lg"
            >
              <Check className="size-4" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-baseline justify-between gap-2 pt-3">
        <h3 className="text-sm font-medium text-bone-50">{item.name}</h3>
        {item.fit && (
          <span className="shrink-0 text-[10px] tracking-wide text-bone-400 uppercase">
            {item.fit}
          </span>
        )}
      </div>
    </motion.button>
  );
}
