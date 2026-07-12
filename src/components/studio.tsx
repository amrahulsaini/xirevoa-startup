"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Check,
  Download,
  Layers,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { CATALOG, CATEGORIES, bySlug, type CatalogItem } from "@/lib/catalog";
import { downscaleToDataUrl } from "@/lib/downscale";
import { cn } from "@/lib/cn";

const MAX_LAYERS = 4;

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
  const fileInput = useRef<HTMLInputElement>(null);

  const visible =
    category === "all"
      ? CATALOG
      : CATALOG.filter((item) => item.category === category);

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
      setPerson(await downscaleToDataUrl(file));
      setResult(null);
      setStage("idle");
    } catch {
      setError("We couldn't read that image. Try a JPEG or PNG.");
    }
  }, []);

  const fit = async () => {
    if (!person || look.length === 0) return;
    setStage("fitting");
    setError(null);
    setResultPainted(false);

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, slugs: look }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStage("error");
        return;
      }
      setResult(data.url);
      setStage("done");
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

      <div className="grid gap-10 lg:grid-cols-[440px_1fr]">
        {/* ───────────── Left: you ───────────── */}
        <div className="lg:sticky lg:top-28 lg:self-start">
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

          <LookStack look={look} onRemove={(slug) => setLook((l) => l.filter((s) => s !== slug))} />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-start gap-2 text-sm text-flare-rose"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </motion.p>
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
                  <Sparkles className="size-4 animate-pulse" />
                  Fitting…
                </>
              ) : (
                <>
                  <Sparkles className="size-4 transition-transform duration-500 group-hover:rotate-90" />
                  {result ? "Fit again" : "Fit the look"}
                </>
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
          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
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

          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((item) => (
                <GarmentCard
                  key={item.slug}
                  item={item}
                  selected={look.includes(item.slug)}
                  onToggle={() => toggle(item)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
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
          <Image
            src={result}
            alt="You, wearing the look"
            fill
            unoptimized
            sizes="440px"
            priority
            onLoad={onPainted}
            className="object-cover"
          />
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
      className="absolute inset-0 flex items-end justify-center overflow-hidden bg-ink-950/60 backdrop-blur-[2px]"
    >
      {/* Scanning sweep */}
      <motion.div
        className="absolute inset-x-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-flare-rose) 28%, transparent), transparent)",
        }}
        animate={{ y: ["-10%", "420%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 pb-10 text-center">
        <Sparkles className="mx-auto size-6 animate-pulse text-flare-amber" />
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="mt-4 text-sm text-bone-200"
          >
            {FITTING_COPY[i]}
          </motion.p>
        </AnimatePresence>
      </div>
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
