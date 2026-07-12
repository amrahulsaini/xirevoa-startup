# Xirevoa

**Try it on. Before you own it.**

A virtual fitting room. Upload one photo and see *yourself* — your face, your build,
your skin tone — wearing denim, tees, shirts, outerwear, eyewear and jewellery.

Today the catalog is AI-generated and shown without prices. The plan is to replace it
with real inventory from local stores across India, so a shopper anywhere can see
themselves in a garment before they walk into the shop.

---

## How the try-on works

Everything runs through **`gemini-3-pro-image`**.

A try-on is a single call: the shopper's photo, plus one or more garment images, plus a
prompt that pins down identity, garment fidelity and realism. The model returns the same
person wearing those exact garments.

**Layered in one pass, deliberately.** Applying garments one at a time compounds identity
drift — each pass re-renders the face from the previous (already imperfect) output. Sending
all garments together keeps the face intact. See `tryOn()` in [`src/lib/gemini.ts`](src/lib/gemini.ts).

**Imagen-4 is not used.** It was evaluated for catalog flat-lays and ignores "no person, no
model" instructions, returning human portraits instead. Don't reach for it.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC) + React 19 |
| Language | TypeScript |
| Styling | Tailwind 4 (`@theme` tokens in `globals.css`) |
| Motion | Motion (Framer) |
| Images | `gemini-3-pro-image` (try-on + catalog) |
| Storage | Local disk → Google Cloud Storage (`STORAGE_DRIVER`) |
| Hosting | GCE (`mystartups`), Cloudflare DNS |

## Design system

Near-black warm canvas, warm-ivory type, and one signature iridescent accent — **Flare**
(amber → rose → violet), used sparingly. Editorial serif (Instrument Serif) for display,
Inter for UI. Tokens live in [`src/app/globals.css`](src/app/globals.css); use those, don't
hardcode hex values.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in GEMINI_API_KEY
npm run seed:catalog         # generates the 14-piece catalog into public/catalog
npm run dev
```

`seed:catalog` is idempotent — it only generates what's missing. Pass `--force` to rebuild
everything.

## Cost & safety

Every try-on is a **paid** image call, so the API route is defensive:

- **Cached** by content hash of (photo + garments) — the same request never bills twice.
- **Rate limited** per IP (12/hour). In-memory today; move to Redis before running more
  than one instance, or the counters stop meaning anything behind a load balancer.
- **Downscaled** client-side to 1280px before upload.

Try-on results are photographs of real people. They are stored **outside** `public/` and
served only via `/api/media/<hash>`, so they can't be enumerated.

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run seed:catalog` | Generate catalog garments |
| `npm run seed:showcase` | Generate the landing-page before/after |
