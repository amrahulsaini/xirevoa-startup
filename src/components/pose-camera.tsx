"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Camera,
  Check,
  RefreshCw,
  SwitchCamera,
  Timer,
  X,
} from "lucide-react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/cn";

interface SceneRead {
  pose: string;
  poseName: string;
  poseCue: string;
  poseImage: string;
  why: string;
  tips: string[];
  ready: boolean;
  problem: string;
}

/**
 * The pose camera.
 *
 * A try-on is only as good as the photo it's given, and people hand us terrible
 * ones. This opens the camera, reads the actual scene (light, background, whether
 * the whole body even fits), draws a silhouette to stand into, and gives physical
 * corrections — "step back two paces", not "improve your framing".
 *
 * The rear camera is the default because it is dramatically better than the
 * selfie camera on every phone, and a full-body shot needs distance anyway. The
 * countdown exists so they can prop the phone up and walk into frame.
 */
export function PoseCamera({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [scene, setScene] = useState<SceneRead | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  /** Grab the current video frame as a JPEG data URL. */
  const grabFrame = useCallback((maxEdge = 1280, quality = 0.9) => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;

    const scale = Math.min(1, maxEdge / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // The selfie preview is mirrored for the user's benefit; un-mirror it before
    // saving, or every photo comes out flipped.
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", quality);
  }, [facing]);

  // ── camera lifecycle ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            // Ask for the best the device will give; it'll downscale if it can't.
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setError(null);
      } catch (err) {
        const e = err as DOMException;
        setError(
          e.name === "NotAllowedError"
            ? "Camera permission was denied. Allow it in your browser settings, then try again."
            : "We couldn't open your camera. You can still upload a photo instead.",
        );
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  // ── read the scene ──
  const read = useCallback(async () => {
    const frame = grabFrame(720, 0.7); // small + cheap; it's only being judged
    if (!frame) return;

    setReading(true);
    try {
      const res = await fetch("/api/pose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame }),
      });
      const data = await res.json();
      if (res.ok) setScene(data);
      else setError(data.error ?? "Couldn't read the scene.");
    } catch {
      setError("Couldn't reach the coach. Check your connection.");
    } finally {
      setReading(false);
    }
  }, [grabFrame]);

  // ── countdown capture ──
  // Driven from the click, not an effect: the shutter firing is a consequence of
  // the user pressing the timer, not of a state value happening to reach zero.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(
    (from: number) => {
      if (timerRef.current) return;
      setCountdown(from);

      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c === null) return null;
          if (c > 1) return c - 1;

          // Zero: fire the shutter and stop.
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          const shot = grabFrame();
          if (shot) onCapture(shot);
          return null;
        });
      }, 1000);
    },
    [grabFrame, onCapture],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
      {/* ── viewfinder ── */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "size-full object-cover",
            // Mirror the selfie preview — an un-mirrored view of yourself is
            // disorienting to pose in.
            facing === "user" && "-scale-x-100",
          )}
        />

        {/* Pose silhouette. The PNG is black-on-white; inverting it and blending
            with `screen` makes the body glow and the background vanish. */}
        {scene && (
          <motion.img
            key={scene.poseImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            src={scene.poseImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-contain mix-blend-screen invert"
          />
        )}

        {/* Countdown */}
        <AnimatePresence>
          {countdown !== null && countdown > 0 && (
            <motion.div
              key={countdown}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <span className="font-display text-[8rem] leading-none text-bone-50 drop-shadow-2xl">
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close camera"
          className="glass absolute top-4 right-4 grid size-10 place-items-center rounded-full text-bone-100"
        >
          <X className="size-5" />
        </button>

        {/* Flip */}
        <button
          onClick={() => {
            setFacing((f) => (f === "user" ? "environment" : "user"));
            setScene(null);
          }}
          aria-label="Switch camera"
          className="glass absolute top-4 left-4 grid size-10 place-items-center rounded-full text-bone-100"
        >
          <SwitchCamera className="size-5" />
        </button>

        {/* Verdict banner */}
        <AnimatePresence>
          {scene && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "glass absolute top-16 right-4 left-4 mx-auto max-w-md rounded-2xl border p-4",
                scene.ready ? "border-bone-100/20" : "border-flare-rose/50",
              )}
            >
              <p className="flex items-start gap-2 text-sm font-medium text-bone-50">
                {scene.ready ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-flare-rose" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-flare-rose" />
                )}
                {scene.ready ? "Good to go" : scene.problem}
              </p>

              {scene.tips.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {scene.tips.map((t, i) => (
                    <li key={i} className="text-xs leading-relaxed text-bone-300">
                      · {t}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-ink-900/90 p-4 text-center text-sm text-bone-200">
            {error}
          </div>
        )}
      </div>

      {/* ── controls ── */}
      <div className="shrink-0 space-y-4 px-6 pt-5 pb-8">
        {scene ? (
          <div className="text-center">
            <p className="text-xs tracking-[0.18em] text-bone-400 uppercase">
              {scene.poseName}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-bone-200">
              {scene.poseCue}
            </p>
            <p className="mt-1 text-xs text-bone-500">{scene.why}</p>
          </div>
        ) : (
          <p className="text-center text-sm text-bone-400">
            {reading
              ? "Reading your scene…"
              : "Let us look at your setup and tell you how to stand."}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={read}
            disabled={reading || !!error}
            className="hairline flex items-center gap-2 rounded-full border px-5 py-3.5 text-sm font-medium text-bone-100 transition-colors hover:bg-bone-100/6 disabled:opacity-50"
          >
            {reading ? (
              <>
                <Spinner className="text-base" />
                Reading…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                {scene ? "Re-check" : "Read my scene"}
              </>
            )}
          </button>

          {/* Shutter */}
          <button
            onClick={() => {
              const shot = grabFrame();
              if (shot) onCapture(shot);
            }}
            disabled={!!error}
            aria-label="Take photo"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-bone-100 text-ink-950 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Camera className="size-6" />
          </button>

          {/* Timer — so they can prop the phone and walk into frame */}
          <button
            onClick={() => startCountdown(5)}
            disabled={!!error || countdown !== null}
            className="hairline flex items-center gap-2 rounded-full border px-5 py-3.5 text-sm font-medium text-bone-100 transition-colors hover:bg-bone-100/6 disabled:opacity-50"
          >
            <Timer className="size-4" />
            5s
          </button>
        </div>
      </div>
    </div>
  );
}
