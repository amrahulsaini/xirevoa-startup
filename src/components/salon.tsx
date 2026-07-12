"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, Download, RotateCcw, Upload, Wand2, X } from "lucide-react";
import { Spinner } from "./spinner";
import { HAIRCUTS, HAIRCUT_LENGTHS, FACE_SHAPES, type FaceShape } from "@/lib/haircuts";
import { downscaleToDataUrl } from "@/lib/downscale";
import { ensurePermission, pushNote } from "@/lib/notifications";
import {
  addRecent,
  makeThumb,
  recentServerSnapshot,
  recentSnapshot,
  removeRecent,
  subscribeRecent,
} from "@/lib/recent-photos";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

type Stage = "idle" | "cutting" | "done" | "error";

const CUTTING_COPY = [
  "Reading your face…",
  "Finding the hairline…",
  "Making the cut…",
  "Styling…",
  "Almost there…",
];

/**
 * The Salon.
 *
 * Same shape as the Studio, but a haircut is a head edit, so the photo we want
 * is a face shot rather than a full body — and the headline feature is "let the
 * AI pick", which reads the face shape and recommends a cut that suits it.
 */
export function Salon() {
  const router = useRouter();
  const [person, setPerson] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [length, setLength] = useState<string>("All");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [painted, setPainted] = useState(false);
  const [analysis, setAnalysis] = useState<{ shape: string; reason: string } | null>(
    null,
  );
  const [resultName, setResultName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fixLink, setFixLink] = useState<{ href: string; label: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const recent = useSyncExternalStore(
    subscribeRecent,
    recentSnapshot,
    recentServerSnapshot,
  );

  const visible =
    length === "All" ? HAIRCUTS : HAIRCUTS.filter((h) => h.length === length);
  const shown = visible.slice(0, limit);

  const pickPhoto = useCallback(async (file: File) => {
    setError(null);
    try {
      const full = await downscaleToDataUrl(file);
      setPerson(full);
      setResult(null);
      setPainted(false);
      setAnalysis(null);
      setStage("idle");
      addRecent(full, await makeThumb(full));
    } catch {
      setError("We couldn't read that image. Try a JPEG or PNG.");
    }
  }, []);

  const cut = async (slug: string) => {
    if (!person) return;
    setStage("cutting");
    setError(null);
    setFixLink(null);
    setPainted(false);
    void ensurePermission();

    try {
      const res = await fetch("/api/salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, slug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setFixLink(
          data.signin
            ? { href: "/signin?next=/salon", label: "Sign in" }
            : data.insufficient
              ? { href: "/pricing", label: "Get XPoints" }
              : null,
        );
        setStage("error");
        return;
      }

      setResult(data.url);
      setResultName(data.cut?.name ?? null);
      if (data.analysis) setAnalysis(data.analysis);
      if (data.cut?.slug) setSelected(data.cut.slug);
      setStage("done");
      router.refresh();

      // /looks, not /salon — the haircut is saved there, and this page's state is
      // long gone by the time they click through from another tab.
      pushNote({
        title: "Your new look is ready",
        body: data.cut?.name
          ? `${data.cut.name} — see how it suits you.`
          : "Your haircut is ready.",
        href: "/looks",
      });
    } catch {
      setError("Couldn't reach the salon. Check your connection.");
      setStage("error");
    }
  };

  const busy = stage === "cutting";

  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
      <header className="mb-10">
        <h1 className="font-display text-5xl text-bone-50 sm:text-6xl">
          The <span className="text-flare italic">Salon</span>
        </h1>
        <p className="mt-4 max-w-lg text-bone-400">
          Upload a photo of your face and see yourself in a new cut — or let us
          read your face shape and pick one that suits you.
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[440px_1fr]">
        {/* ── Left: you ── */}
        <div className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          {!person ? (
            <button
              onClick={() => fileInput.current?.click()}
              className="hairline flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-ink-900 transition-colors hover:bg-ink-800"
            >
              <div className="grid size-14 place-items-center rounded-full bg-ink-800">
                <Upload className="size-5 text-bone-300" />
              </div>
              <div className="px-8 text-center">
                <p className="font-medium text-bone-100">Add a photo of your face</p>
                <p className="mt-1.5 text-sm leading-relaxed text-bone-400">
                  Front-facing, good light, hair visible. A plain background works best.
                </p>
              </div>
            </button>
          ) : (
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-ink-900">
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL */}
              <img
                src={person}
                alt="Your photo"
                className={cn(
                  "absolute inset-0 size-full object-cover transition-opacity duration-700",
                  painted ? "opacity-0" : "opacity-100",
                )}
              />
              {result && (
                <motion.div
                  initial={false}
                  animate={painted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <ResultImg src={result} onPainted={() => setPainted(true)} />
                </motion.div>
              )}

              <AnimatePresence>{busy && <CuttingOverlay />}</AnimatePresence>

              <button
                onClick={() => {
                  setPerson(null);
                  setResult(null);
                  setPainted(false);
                  setAnalysis(null);
                  setStage("idle");
                }}
                aria-label="Remove photo"
                className="glass absolute top-3 right-3 grid size-9 place-items-center rounded-full text-bone-100 hover:scale-110"
              >
                {result ? <RotateCcw className="size-4" /> : <X className="size-4" />}
              </button>

              {resultName && stage === "done" && (
                <span className="glass absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-xs text-bone-100">
                  {resultName}
                </span>
              )}
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickPhoto(f);
              e.target.value = "";
            }}
          />

          {/* Recent photos */}
          {recent.length > 0 && (
            <div className="mt-5">
              <p className="text-xs tracking-[0.2em] text-bone-400 uppercase">
                Your photos
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {recent.map((p) => (
                  <div key={p.id} className="group relative">
                    <button
                      onClick={() => {
                        setPerson(p.full);
                        setResult(null);
                        setPainted(false);
                        setAnalysis(null);
                        setStage("idle");
                      }}
                      aria-label="Use this photo"
                      className={cn(
                        "size-16 overflow-hidden rounded-xl ring-2 transition-all",
                        person === p.full ? "ring-flare-rose" : "ring-transparent hover:ring-bone-100/25",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- data: URL */}
                      <img src={p.thumb} alt="" className="size-full object-cover" />
                    </button>
                    <button
                      onClick={() => removeRecent(p.id)}
                      aria-label="Forget this photo"
                      className="glass absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full text-bone-200 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInput.current?.click()}
                  aria-label="Upload a new photo"
                  className="hairline grid size-16 place-items-center rounded-xl border border-dashed text-bone-400 hover:bg-bone-100/5 hover:text-bone-100"
                >
                  <Upload className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* The headline feature */}
          <button
            onClick={() => cut("recommend")}
            disabled={!person || busy}
            className={cn(
              "mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-medium transition-all duration-300",
              person && !busy
                ? "bg-bone-100 text-ink-950 hover:scale-[1.02] active:scale-95"
                : "cursor-not-allowed bg-ink-800 text-bone-400",
            )}
          >
            {busy ? (
              <>
                <Spinner className="text-lg" />
                Cutting…
              </>
            ) : (
              <>
                <Wand2 className="size-4" />
                Pick the cut that suits me
              </>
            )}
          </button>
          {!person && (
            <p className="mt-3 text-center text-sm text-bone-400">
              Add a photo to begin
            </p>
          )}

          {/* Face-shape reading */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="hairline mt-5 rounded-2xl border bg-ink-900 p-5"
              >
                <p className="text-xs tracking-[0.18em] text-bone-400 uppercase">
                  Your face shape
                </p>
                <p className="mt-2 font-display text-2xl text-bone-50 capitalize">
                  {analysis.shape}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-bone-400">
                  {analysis.reason}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-bone-300">
                  {FACE_SHAPES[analysis.shape as FaceShape]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

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
                    className="mt-3 inline-flex rounded-full bg-bone-100 px-5 py-2.5 text-sm font-medium text-ink-950 hover:scale-[1.03]"
                  >
                    {fixLink.label}
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {result && (
            <a
              href={result}
              download="xirevoa-haircut.png"
              className="hairline mt-4 flex items-center justify-center gap-2 rounded-full border py-3 text-sm text-bone-200 hover:bg-bone-100/6 hover:text-bone-50"
            >
              <Download className="size-4" />
              Download
            </a>
          )}
        </div>

        {/* ── Right: the styles ── */}
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            {HAIRCUT_LENGTHS.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLength(l);
                  setLimit(PAGE_SIZE);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors duration-300",
                  length === l
                    ? "bg-bone-100 text-ink-950"
                    : "hairline border text-bone-300 hover:bg-bone-100/6 hover:text-bone-50",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {shown.map((h) => (
                <motion.button
                  key={h.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => {
                    setSelected(h.slug);
                    cut(h.slug);
                  }}
                  disabled={!person || busy}
                  className="group text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl bg-product ring-2 transition-all duration-300",
                      selected === h.slug
                        ? "ring-flare-rose"
                        : "ring-transparent group-hover:ring-bone-100/20",
                    )}
                  >
                    <Image
                      src={h.image}
                      alt={h.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {selected === h.slug && (
                      <span className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full bg-flare-rose text-bone-50 shadow-lg">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-2 pt-3">
                    <h3 className="text-sm font-medium text-bone-50">{h.name}</h3>
                    <span className="shrink-0 text-[10px] tracking-wide text-bone-400 uppercase">
                      {h.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-bone-400">{h.tagline}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>

          {shown.length < visible.length && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
                className="hairline rounded-full border px-7 py-3 text-sm font-medium text-bone-200 hover:bg-bone-100/6 hover:text-bone-50"
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

/* ── pieces ── */

function ResultImg({ src, onPainted }: { src: string; onPainted: () => void }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    // Cached images finish loading before React attaches onLoad — check directly,
    // or the result stays invisible forever.
    if (img?.complete && img.naturalWidth > 0) {
      onPainted();
      return;
    }
    const t = setTimeout(onPainted, 8000);
    return () => clearTimeout(t);
  }, [src, onPainted]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- served from /api/media
    <img
      ref={ref}
      src={src}
      alt="You, with the new cut"
      onLoad={onPainted}
      onError={onPainted}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

function CuttingOverlay() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((v) => Math.min(v + 1, CUTTING_COPY.length - 1)),
      6000,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-ink-950/70 backdrop-blur-[3px]"
    >
      <motion.div
        className="absolute inset-x-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-flare-rose) 28%, transparent), transparent)",
        }}
        animate={{ y: ["-10%", "420%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass hairline relative z-10 mx-6 rounded-2xl border px-8 py-7 text-center shadow-2xl shadow-black/40"
      >
        <Spinner className="text-2xl" />
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 text-sm font-medium text-bone-100"
          >
            {CUTTING_COPY[i]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-2 text-xs leading-relaxed text-bone-400">
          Keep browsing — we&apos;ll notify you.
        </p>
      </motion.div>
    </motion.div>
  );
}
