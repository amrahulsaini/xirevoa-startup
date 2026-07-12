# Fast deploy. Run from the repo root:  pwsh -File deploy/fast.ps1
#
# Splits the payload in two:
#   code.tgz    — a couple of MB, sent every time
#   public.tgz  — ~130MB of catalog images, sent ONLY when they changed
#
# The image hash is stored on the box, so a normal code change never re-uploads
# them. That, plus keeping node_modules and .next/cache warm on the server, takes
# a deploy from ~4 minutes down to well under one.
#
# PowerShell rather than bash because gcloud's plink transport fails under Git
# Bash's pseudo-TTY on this machine.

$ErrorActionPreference = 'Stop'
$env:PATH += ";$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin"

$ZONE = 'asia-south1-c'
$PROJECT = 'xirevoa'
$VM = 'xirevoa-web'
$root = Split-Path $PSScriptRoot -Parent

$sw = [Diagnostics.Stopwatch]::StartNew()
Push-Location $root

# ── 1. Has public/ changed? Hash the file list + sizes; cheap and good enough. ──
$manifest = Get-ChildItem -Path 'public' -Recurse -File |
  Sort-Object FullName |
  ForEach-Object { "$($_.FullName.Substring($root.Length)):$($_.Length)" } |
  Out-String
$md5 = [System.Security.Cryptography.MD5]::Create()
$localHash = [BitConverter]::ToString(
  $md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($manifest))
).Replace('-', '').ToLower()

$remoteHash = (gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT --quiet `
  --command="cat /srv/xirevoa/.deploy-public-hash 2>/dev/null || echo none" 2>$null).Trim()

$assetsChanged = ($localHash -ne $remoteHash)
Write-Host "assets: $(if ($assetsChanged) { 'CHANGED — will upload' } else { 'unchanged — skipping upload' })"

# ── 2. Pack ──
Write-Host '==> packing'
$code = Join-Path $env:TEMP 'code.tgz'
tar -czf $code --exclude='./node_modules' --exclude='./.git' --exclude='.next' `
  --exclude='./storage' --exclude='./src/generated' `
  prisma src scripts package.json package-lock.json next.config.ts tsconfig.json `
  postcss.config.mjs prisma.config.ts eslint.config.mjs

gcloud compute scp $code "${VM}:/tmp/code.tgz" --zone=$ZONE --project=$PROJECT --quiet | Out-Null
Remove-Item $code -Force

if ($assetsChanged) {
  $pub = Join-Path $env:TEMP 'public.tgz'
  tar -czf $pub public
  Write-Host '==> uploading assets (this is the slow part, and only happens when images change)'
  gcloud compute scp $pub "${VM}:/tmp/public.tgz" --zone=$ZONE --project=$PROJECT --quiet | Out-Null
  Remove-Item $pub -Force
}

# ── 3. Remote build ──
$rb = Get-Content (Join-Path $PSScriptRoot 'remote-fast.sh') -Raw
$lf = Join-Path $env:TEMP 'remote-fast.sh'
[IO.File]::WriteAllText($lf, ($rb -replace "`r`n", "`n"))
gcloud compute scp $lf "${VM}:/tmp/remote-fast.sh" --zone=$ZONE --project=$PROJECT --quiet | Out-Null
Remove-Item $lf -Force

gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT --quiet --command='bash /tmp/remote-fast.sh' 2>&1 |
  Select-String 'Compiled|Failed|error|active|inactive|local health|DEPLOY_DONE|assets|lockfile|dependencies|garments'

# Record the asset hash only after a successful deploy.
if ($assetsChanged) {
  gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT --quiet `
    --command="echo $localHash | sudo -u xirevoa tee /srv/xirevoa/.deploy-public-hash >/dev/null" 2>$null | Out-Null
}

$sw.Stop()
Write-Host ("==> done in {0:N0}s" -f $sw.Elapsed.TotalSeconds)
Pop-Location
