#!/usr/bin/env bash
# Stands up pgweb (a web UI for Postgres) at db.xirevoa.com, behind HTTPS and
# HTTP basic auth. Idempotent.
#
#   bash setup-dbui.sh '<basic-auth-plaintext-password>'
set -euo pipefail

PLAIN="${1:?usage: setup-dbui.sh <password>}"
PGWEB_VERSION="v0.16.2"

# ── pgweb binary ──
if [ ! -x /usr/local/bin/pgweb ]; then
  cd /tmp
  curl -fsSL -o pgweb.zip \
    "https://github.com/sosedoff/pgweb/releases/download/${PGWEB_VERSION}/pgweb_linux_amd64.zip"
  sudo apt-get install -y unzip >/dev/null 2>&1 || true
  unzip -o pgweb.zip >/dev/null
  sudo mv pgweb_linux_amd64 /usr/local/bin/pgweb
  sudo chmod +x /usr/local/bin/pgweb
  rm -f pgweb.zip
fi

# ── connection string, from the app's own .env (strip the ?schema= Prisma param) ──
DB_URL=$(sudo -u xirevoa bash -c 'set -a; . /srv/xirevoa/.env; set +a; echo "${DATABASE_URL%%\?*}"')

# ── systemd service: pgweb bound to localhost only; Caddy is the public door ──
sudo tee /etc/systemd/system/pgweb.service >/dev/null <<UNIT
[Unit]
Description=pgweb (Xirevoa DB UI)
After=network.target postgresql.service

[Service]
Type=simple
User=xirevoa
Environment=DATABASE_URL=${DB_URL}
ExecStart=/usr/local/bin/pgweb --bind=127.0.0.1 --listen=8081 --url=${DB_URL} --sessions
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now pgweb
sudo systemctl restart pgweb

# ── Caddy site with basic auth ──
HASH=$(caddy hash-password --plaintext "$PLAIN")

# Append the db block only once.
if ! sudo grep -q "db.xirevoa.com" /etc/caddy/Caddyfile; then
  sudo tee -a /etc/caddy/Caddyfile >/dev/null <<CADDY

db.xirevoa.com {
	encode zstd gzip
	basic_auth {
		admin ${HASH}
	}
	reverse_proxy localhost:8081
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Frame-Options "SAMEORIGIN"
	}
}
CADDY
else
  # Update the existing hash in place.
  sudo sed -i "/db.xirevoa.com/,/^}/ s|admin .*|admin ${HASH}|" /etc/caddy/Caddyfile
fi

sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

sleep 3
echo "--- pgweb ---"; sudo systemctl is-active pgweb
curl -sf -o /dev/null -w 'pgweb local: HTTP %{http_code}\n' http://127.0.0.1:8081 || true
echo DBUI_DONE
