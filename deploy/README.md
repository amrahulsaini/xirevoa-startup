# Deploying Xirevoa

Single box: `xirevoa-web` (e2-small, `asia-south1-c` / Mumbai), static IP **34.93.64.168**.
Node + Postgres + Caddy all run on it. Storage is local disk.

That's deliberate. A single VM is the right shape until traffic justifies otherwise —
Cloud SQL and GCS both cost more than the whole box and buy nothing at this stage.
The storage driver (`src/lib/storage.ts`) already abstracts the filesystem, so moving
to GCS later is a config change, not a rewrite.

## Layout on the box

| Path | What |
| --- | --- |
| `/srv/xirevoa` | The app (built) |
| `/srv/xirevoa/.env` | Production secrets, `chmod 600`, owned by `xirevoa` |
| `/srv/xirevoa-storage` | Try-on results (photos of real people — never in `public/`) |
| `/etc/caddy/Caddyfile` | TLS + reverse proxy to `localhost:3000` |
| `xirevoa.service` | systemd unit, restarts on failure |

## Deploy a new version

```bash
bash deploy/push.sh
```

Builds locally, ships a tarball, installs, migrates, restarts. The `.next` build
happens on your machine, not the box — an e2-small does not have the RAM to run a
Next.js production build without swapping itself to death.

## First-time notes

- `deploy/startup.sh` runs once on VM creation and installs the runtime. It is
  idempotent, so it's safe if GCE re-runs it.
- Caddy gets its certificate from Let's Encrypt automatically, but **only once
  `xirevoa.com` actually resolves to this IP**. Point DNS first, then check
  `journalctl -u caddy`.
- The `vk` instance in the same project is unrelated to Xirevoa. Don't touch it.
