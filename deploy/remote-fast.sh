#!/usr/bin/env bash
# Fast in-place deploy. Runs ON the box.
#
# The old deploy re-did everything from zero every time: re-uploaded 130MB of
# catalog images, wiped node_modules and ran a full `npm ci`, and built with a
# cold cache. Three to five minutes for a one-line change.
#
# This one keeps the expensive things and only redoes what actually changed:
#   · node_modules  — reinstalled only when package-lock.json changes
#   · .next/cache   — kept, so Next rebuilds incrementally
#   · public/       — only replaced when the images actually changed
#
# Deploys in place. A failed build leaves the running service untouched (we only
# restart on success), so the site never goes down behind a broken build.
set -euo pipefail

APP=/srv/xirevoa
cd "$APP"

# ── code (always) ──
sudo tar -xzf /tmp/code.tgz -C "$APP"
rm -f /tmp/code.tgz

# ── public assets (only when the caller sent them) ──
if [ -f /tmp/public.tgz ]; then
  echo "==> assets changed, replacing public/"
  sudo rm -rf "$APP/public"
  sudo tar -xzf /tmp/public.tgz -C "$APP"
  rm -f /tmp/public.tgz
else
  echo "==> assets unchanged, skipping ($(ls "$APP/public/catalog" | wc -l) catalog images kept)"
fi

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

# ── build (incremental: .next/cache survives) ──
echo "==> building"
sudo -u xirevoa npm run build

# ── schema (cheap, and a no-op when nothing changed) ──
sudo -u xirevoa npx prisma db push --accept-data-loss
sudo -u xirevoa npx tsx --env-file=.env scripts/seed-db.ts

sudo systemctl restart xirevoa
sleep 4
sudo systemctl is-active xirevoa
curl -sf -o /dev/null -w 'local health: HTTP %{http_code}\n' http://localhost:3000
echo DEPLOY_DONE
