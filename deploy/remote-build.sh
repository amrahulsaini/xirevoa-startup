#!/usr/bin/env bash
# Runs ON the box: unpack /tmp/xirevoa.tgz, build, swap in, restart.
# Uploaded and executed by the deploy step. Building here (not locally) is
# required — see deploy/push.sh for why.
set -euo pipefail

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

# Swap in only after a successful build, so a broken build can't take the site down.
sudo systemctl stop xirevoa
sudo rm -rf /srv/xirevoa-prev
sudo mv /srv/xirevoa /srv/xirevoa-prev
sudo mv /srv/xirevoa-next /srv/xirevoa

cd /srv/xirevoa
sudo -u xirevoa npx prisma db push --accept-data-loss
sudo -u xirevoa npx tsx --env-file=.env scripts/seed-db.ts

sudo systemctl start xirevoa
sleep 6
sudo systemctl is-active xirevoa
curl -sf -o /dev/null -w 'local health: HTTP %{http_code}\n' http://localhost:3000
echo DEPLOY_DONE
