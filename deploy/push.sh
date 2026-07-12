#!/usr/bin/env bash
# Ship source to the box, build there, restart.
#
# The build runs ON the VM, not locally. Two reasons, both learned the hard way:
#
#  1. Turbopack bakes content-hashed external module ids (e.g. `pg-587764f78a…`)
#     into the build output, derived from the exact node_modules tree it built
#     against. Build here, `npm ci` there, and none of those ids resolve —
#     the app boots and 500s on every request.
#  2. Shipping our own node_modules instead would carry Windows-native binaries
#     (sharp, esbuild) onto a Linux box.
#
# Building where it runs sidesteps both. The VM has 4GB of swap so an e2-small
# can finish a Next build without OOMing.
set -euo pipefail

ZONE=asia-south1-c
PROJECT=xirevoa
VM=xirevoa-web

# gcloud shells out to Python. From Git Bash on Windows it won't find one and
# hits the Microsoft Store stub, so point it at the interpreter the SDK ships with.
SDK="${LOCALAPPDATA:-}/Google/Cloud SDK/google-cloud-sdk"
if [ -x "$SDK/platform/bundledpython/python.exe" ]; then
  export CLOUDSDK_PYTHON="$SDK/platform/bundledpython/python.exe"
fi

SSH="gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT --quiet"

echo "==> Packing source"
TAR=$(mktemp -t xirevoa-XXXX.tgz)
tar -czf "$TAR" \
  --exclude='./node_modules' \
  --exclude='./.git' \
  --exclude='./storage' \
  --exclude='./src/generated' \
  --exclude='./deploy/.dbpass' \
  --exclude='./deploy/.env.production' \
  --exclude='./deploy/.startup.generated.sh' \
  public prisma src scripts package.json package-lock.json \
  next.config.ts tsconfig.json postcss.config.mjs prisma.config.ts eslint.config.mjs

echo "==> Uploading"
gcloud compute scp "$TAR" "$VM:/tmp/xirevoa.tgz" --zone=$ZONE --project=$PROJECT --quiet
rm -f "$TAR"

echo "==> Building and restarting on the box (this takes a few minutes)"
$SSH --command='
set -euo pipefail

# Unpack into a staging dir, so a failed build never takes down the running site.
sudo rm -rf /srv/xirevoa-next
sudo mkdir -p /srv/xirevoa-next
sudo tar -xzf /tmp/xirevoa.tgz -C /srv/xirevoa-next
rm -f /tmp/xirevoa.tgz

# Carry over the secrets — .env is never in the tarball.
sudo cp /srv/xirevoa/.env /srv/xirevoa-next/.env
sudo chown -R xirevoa:xirevoa /srv/xirevoa-next

cd /srv/xirevoa-next
sudo -u xirevoa npm ci
sudo -u xirevoa npm run build

# Only now that the build succeeded, swap it in.
sudo systemctl stop xirevoa
sudo rm -rf /srv/xirevoa-prev
sudo mv /srv/xirevoa /srv/xirevoa-prev
sudo mv /srv/xirevoa-next /srv/xirevoa

cd /srv/xirevoa
# db push, not migrate deploy: local dev runs on PGlite, which cannot create the
# shadow database `prisma migrate` needs, so there is no migration history to replay.
sudo -u xirevoa npx prisma db push
sudo -u xirevoa npx tsx --env-file=.env scripts/seed-db.ts

sudo systemctl start xirevoa
sleep 6
sudo systemctl is-active xirevoa
curl -sf -o /dev/null -w "local health: HTTP %{http_code}\n" http://localhost:3000
'

echo "==> Deployed."
