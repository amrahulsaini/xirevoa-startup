"use client";

/**
 * Device fingerprint, used only to decide whether an account has already claimed
 * the free signup bonus on this machine.
 *
 * Signals are chosen to be stable across incognito windows, cleared cookies and
 * a new IP — because those are exactly the three things a points-farmer reaches
 * for. Canvas and audio rendering differ by GPU/driver; the rest is hardware and
 * locale. None of it is personally identifying on its own, and we only ever send
 * the hash.
 *
 * This is a deterrent, not DRM. A determined attacker with a fresh browser
 * profile and a spoofing extension will get through; the point is to make
 * casual farming (open incognito, sign up again) not work.
 */

function canvasSignal(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 220;
    c.height = 40;
    const ctx = c.getContext("2d");
    if (!ctx) return "no-canvas";
    // Text + a gradient: rasterisation differs measurably by GPU and font stack.
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 100, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Xirevoa,fp:1", 2, 2);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("Xirevoa,fp:1", 4, 8);
    return c.toDataURL();
  } catch {
    return "canvas-blocked";
  }
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getFingerprint(): Promise<string | null> {
  try {
    const n = navigator as Navigator & {
      deviceMemory?: number;
      hardwareConcurrency?: number;
    };

    const parts = [
      navigator.userAgent,
      navigator.language,
      // Timezone survives incognito and is stable per machine.
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      String(n.hardwareConcurrency ?? ""),
      String(n.deviceMemory ?? ""),
      String(new Date().getTimezoneOffset()),
      canvasSignal(),
    ];

    return await sha256Hex(parts.join("|"));
  } catch {
    return null;
  }
}
