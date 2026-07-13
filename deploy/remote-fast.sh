#!/usr/bin/env bash
# Fast in-place deploy. Runs ON the box.
#
# Generated images (catalog + haircuts) are NEVER shipped from the dev machine.
# They already live in public/catalog and public/haircuts ON THE BOX, and they
# survive a deploy for a simple reason: `tar -x` only overwrites what's IN the
# archive — it never deletes files that aren't. The deploy tarball simply omits
# those two directories, so they're left alone.
#
# (Symlinking them out of the app dir was tried and doesn't work: Turbopack
# traces public/ as a dependency of the try-on route and refuses a symlink that
# points outside the project root.)
#
# Missing images are generated HERE by the seed scripts, which are idempotent —
# so adding catalog pieces costs nothing at deploy time, the server just makes
# them.
#
# What else we keep rather than redo:
#   · node_modules  — reinstalled only when package-lock.json changes
#   · .next/cache   — kept, so Next rebuilds incrementally
#
# A failed build leaves the running service untouched (we only restart on
# success), so the site never goes down behind a broken build.
set -euo pipefail

APP=/srv/xirevoa
cd "$APP"

# ── code + small public files (the image dirs aren't in the archive) ──
sudo tar -xzf /tmp/code.tgz -C "$APP"
rm -f /tmp/code.tgz

sudo chown -R xirevoa:xirevoa "$APP"

# ── dependencies (only when the lockfile moved) ──
LOCK_NOW=$(sha256sum package-lock.json | cut -d' ' -f1)
LOCK_WAS=$(cat .deploy-lock-hash 2>/dev/null || echo none)

if [ "$LOCK_NOW" != "$LOCK_WAS" ] || [ ! -d node_modules ]; then
  echo "==> lockfile changed — npm ci"
  sudo -u xirevoa npm ci
  echo "$LOCK_NOW" | sudo -u xirevoa tee .deploy-lock-hash >/dev/null
else
  echo "==> dependencies unchanged, skipping npm ci"
fi

# ── generate any missing images, right here ──
# Idempotent: only makes what doesn't exist, so a normal deploy is a no-op and
# adding catalog items just works without a 130MB upload.
echo "==> catalog: $(ls "$APP/public/catalog" 2>/dev/null | wc -l) images present"
sudo -u xirevoa npx tsx --env-file=.env scripts/seed-catalog.ts
sudo -u xirevoa npx tsx --env-file=.env scripts/seed-haircuts.ts
sudo -u xirevoa npx tsx --env-file=.env scripts/seed-poses.ts

# ── build (incremental: .next/cache survives) ──
echo "==> building"
sudo -u xirevoa npm run build

sudo -u xirevoa npx prisma db push --accept-data-loss
sudo -u xirevoa npx tsx --env-file=.env scripts/seed-db.ts

sudo systemctl restart xirevoa
sleep 4
sudo systemctl is-active xirevoa
curl -sf -o /dev/null -w 'local health: HTTP %{http_code}\n' http://localhost:3000
echo DEPLOY_DONE
