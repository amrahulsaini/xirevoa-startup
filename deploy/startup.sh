#!/usr/bin/env bash
# GCE startup script. Runs once, as root, on first boot.
# Installs the runtime; the app itself is deployed separately by deploy/push.sh.
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl ca-certificates gnupg git debian-keyring debian-archive-keyring apt-transport-https

# ── Node 24 ──
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# ── Postgres ──
apt-get install -y postgresql postgresql-contrib
systemctl enable --now postgresql

# Idempotent: the startup script can re-run on image rebuilds.
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='xirevoa'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE xirevoa LOGIN PASSWORD 'REPLACE_DB_PASSWORD';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='xirevoa'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE xirevoa OWNER xirevoa;"

# ── Caddy: reverse proxy + automatic Let's Encrypt TLS ──
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# ── App user + directories ──
id -u xirevoa &>/dev/null || useradd --system --create-home --shell /bin/bash xirevoa
mkdir -p /srv/xirevoa /srv/xirevoa-storage
chown -R xirevoa:xirevoa /srv/xirevoa /srv/xirevoa-storage

# ── systemd unit ──
cat >/etc/systemd/system/xirevoa.service <<'UNIT'
[Unit]
Description=Xirevoa
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=xirevoa
WorkingDirectory=/srv/xirevoa
EnvironmentFile=/srv/xirevoa/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
# Try-ons hold a request open for ~30s; don't let systemd think that's a hang.
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload

# ── Caddy site ──
cat >/etc/caddy/Caddyfile <<'CADDY'
xirevoa.com, www.xirevoa.com {
	encode zstd gzip

	# A layered try-on can take 60s+. Caddy's default upstream timeouts would
	# cut the shopper off mid-generation.
	reverse_proxy localhost:3000 {
		transport http {
			read_timeout 180s
			write_timeout 180s
		}
	}

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
	}
}
CADDY

systemctl enable caddy
echo "startup complete" > /var/log/xirevoa-startup-done
