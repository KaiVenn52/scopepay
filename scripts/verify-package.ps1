$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$deliveryRoot = Join-Path $projectRoot 'delivery'
$metadata = Get-Content -LiteralPath (Join-Path $deliveryRoot 'latest-package.json') -Raw | ConvertFrom-Json
$archivePath = [IO.Path]::GetFullPath((Join-Path $deliveryRoot $metadata.archive))
if (-not $archivePath.StartsWith($deliveryRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Archive must remain inside this project delivery directory.' }
$hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLower()
if ($hash -ne $metadata.sha256) { throw 'Source archive checksum mismatch.' }
$checkRoot = Join-Path $deliveryRoot ('check-' + [Guid]::NewGuid().ToString('N').Substring(0, 10))
Expand-Archive -LiteralPath $archivePath -DestinationPath $checkRoot
foreach ($required in @('package.json', 'package-lock.json', 'LICENSE', 'README.md', '.env.example', '.github/workflows/verify.yml', 'public/client.html', 'lib/proposals.mjs')) {
    if (-not (Test-Path -LiteralPath (Join-Path $checkRoot $required))) { throw ('Missing packaged source: ' + $required) }
}
foreach ($private in @('.env', '.env.local', 'data', '.model-cache', 'node_modules')) {
    if (Test-Path -LiteralPath (Join-Path $checkRoot $private)) { throw ('Private or generated content was packaged: ' + $private) }
}
$commands = @()
Push-Location $checkRoot
try {
    & npm.cmd ci --ignore-scripts --offline --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'Clean package dependency installation failed.' }
    $commands += 'npm ci --ignore-scripts --offline --no-audit --no-fund'
    if (-not (Test-Path -LiteralPath 'node_modules/@huggingface/transformers/package.json')) { throw 'The clean package lacks its own installed AI dependency.' }
    & npm.cmd run check
    if ($LASTEXITCODE -ne 0) { throw 'Clean package syntax checks failed.' }
    $commands += 'npm run check'
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Clean package tests failed.' }
    $commands += 'npm test'
    & npm.cmd run verify:ai
    if ($LASTEXITCODE -ne 0) { throw 'Clean package actual local model setup/inference failed.' }
    $commands += 'npm run verify:ai (actual model download and CPU inference)'
} finally { Pop-Location }
$summary = [ordered]@{ result = 'PASS'; archive = $metadata.archive; archiveSha256 = $hash; extractedDirectory = (Split-Path -Leaf $checkRoot); commands = $commands; privateFilesExcluded = $true; realPayPalValidated = $false; published = $false }
$summary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $deliveryRoot 'latest-verification.json') -Encoding utf8
$summary | ConvertTo-Json -Depth 4
