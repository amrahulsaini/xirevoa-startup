# Deploying Xirevoa

Single box: `xirevoa-web` (e2-small, `asia-south1-c` / Mumbai), static IP **34.93.64.168**.
Node + Postgres + Caddy all run on it. Storage is local disk.

## Deploy

```powershell
powershell -File deploy/fast.ps1
```

PowerShell, not bash: gcloud's `plink` transport fails under Git Bash's pseudo-TTY
on this machine.

### Why it's fast

Deploys used to take ~4 minutes because every one re-did everything from zero.
This one only redoes what actually changed:

| Thing | When it runs |
| --- | --- |
| Upload `public/` (~130MB of catalog art) | Only when the image set changes (hashed, hash stored on the box) |
| `npm ci` | Only when `package-lock.json` changes |
| `next build` | Every time, but **in place** — `.next/cache` survives, so it's incremental |
| Restart | Only after a **successful** build, so a broken build can't take the site down |

## Things that will bite you

- **Build ON the box, never locally.** Turbopack bakes content-hashed external
  module ids tied to the `node_modules` tree it built against. Build here, `npm ci`
  there, and nothing resolves: the app boots and 500s on every request.
- **PowerShell reports `NativeCommandError` just because the build writes to
  stderr.** It is *not* a failure. Read the actual output before believing it.
- **`.env` on the box must end with a newline** before you append to it, or the
  first appended line gets glued onto the last existing one.
- Storage lives at `/srv/xirevoa-storage`, deliberately **outside** the app dir —
  a deploy replaces `/srv/xirevoa` and would otherwise delete every saved look.
- The `vk` instance in the same project is unrelated to Xirevoa. Don't touch it.

## Layout on the box

| Path | What |
| --- | --- |
| `/srv/xirevoa` | The app |
| `/srv/xirevoa/.env` | Production secrets, `chmod 600`, owned by `xirevoa` |
| `/srv/xirevoa-storage` | Generated images (photos of real people — never in `public/`) |
| `/etc/caddy/Caddyfile` | TLS + reverse proxy |

## DB admin UI

**https://db.xirevoa.com** — pgweb behind HTTPS + basic auth. Set up by
`deploy/setup-dbui.sh <password>`.
