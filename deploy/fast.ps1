# Fast deploy. Run from the repo root:  powershell -File deploy/fast.ps1
#
# Ships CODE ONLY — a couple of MB.
#
# Generated images (catalog + haircuts) are never sent from here. They live on the
# box and survive a deploy because `tar -x` never deletes files that aren't in the
# archive — and this archive simply omits those two directories. Any MISSING image
# is generated ON the server by the seed scripts (which are idempotent), so adding
# 90 new catalog pieces costs nothing at deploy time: the server just makes them.
#
# PowerShell rather than bash because gcloud's plink transport fails under Git
# Bash's pseudo-TTY on this machine.
#
# NOT $ErrorActionPreference='Stop': gcloud and npm write progress to stderr, and
# PowerShell turns any stderr from a native command into a terminating
# NativeCommandError — with 'Stop' this script "fails" on every successful
# deploy. Success is decided by the DEPLOY_DONE marker the remote script prints,
# which is the only honest signal.
$ErrorActionPreference = 'Continue'
$env:PATH += ";$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin"

$ZONE = 'asia-south1-c'
$PROJECT = 'xirevoa'
$VM = 'xirevoa-web'
$root = Split-Path $PSScriptRoot -Parent

$sw = [Diagnostics.Stopwatch]::StartNew()
Push-Location $root

Write-Host '==> packing code (generated images stay on the server)'
$code = Join-Path $env:TEMP 'code.tgz'
tar -czf $code `
  --exclude='./node_modules' --exclude='./.git' --exclude='.next' `
  --exclude='./storage' --exclude='./src/generated' `
  --exclude='./public/catalog' --exclude='./public/haircuts' --exclude='./public/poses' `
  prisma src scripts public package.json package-lock.json next.config.ts `
  tsconfig.json postcss.config.mjs prisma.config.ts eslint.config.mjs

$mb = [math]::Round((Get-Item $code).Length / 1MB, 1)
Write-Host "==> payload: ${mb}MB"

gcloud compute scp $code "${VM}:/tmp/code.tgz" --zone=$ZONE --project=$PROJECT --quiet | Out-Null
Remove-Item $code -Force

$rb = Get-Content (Join-Path $PSScriptRoot 'remote-fast.sh') -Raw
$lf = Join-Path $env:TEMP 'remote-fast.sh'
[IO.File]::WriteAllText($lf, ($rb -replace "`r`n", "`n"))
gcloud compute scp $lf "${VM}:/tmp/remote-fast.sh" --zone=$ZONE --project=$PROJECT --quiet | Out-Null
Remove-Item $lf -Force

$log = gcloud compute ssh $VM --zone=$ZONE --project=$PROJECT --quiet `
  --command='bash /tmp/remote-fast.sh' 2>&1 | Out-String

$log -split "`n" |
  Select-String 'Compiled|Failed|Error:|error TS|active|inactive|local health|DEPLOY_DONE|lockfile|dependencies|catalog:|garments|✓ |✗ ' |
  ForEach-Object { Write-Host "   $_" }

# The remote script prints DEPLOY_DONE only after the build succeeded, the schema
# pushed and the service came back healthy. That — not PowerShell's exit code —
# is what tells us this worked.
$ok = $log -match 'DEPLOY_DONE'

$sw.Stop()
Pop-Location

if ($ok) {
  Write-Host ("==> DEPLOYED in {0:N0}s" -f $sw.Elapsed.TotalSeconds) -ForegroundColor Green
  exit 0
}

Write-Host '==> DEPLOY FAILED — the service was left running on the previous build.' -ForegroundColor Red
Write-Host $log
exit 1
