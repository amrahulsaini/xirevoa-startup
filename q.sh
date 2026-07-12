sudo -u xirevoa bash -c '
cd /srv/xirevoa
set -a; . ./.env; set +a
URL="${DATABASE_URL%%\?*}"
echo "=== USERS ==="
psql "$URL" -c "SELECT substring(id,1,8) AS id, email, username, (\"passwordHash\" IS NOT NULL) AS has_pw FROM \"User\" ORDER BY email;"
echo "=== ACCOUNTS ==="
psql "$URL" -c "SELECT substring(\"userId\",1,8) AS user_id, provider FROM \"Account\";"
'
