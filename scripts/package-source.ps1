$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$packageStamp = [DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssZ')
$deliveryRoot = Join-Path $projectRoot 'delivery'
$stageRoot = Join-Path $deliveryRoot ('source-' + $packageStamp)
$archivePath = Join-Path $deliveryRoot ('ScopePay-source-' + $packageStamp + '.zip')
$excludedNames = @('node_modules', '.git', 'data', '.model-cache', 'delivery', 'test-results')
& node (Join-Path $PSScriptRoot 'verify-delivery.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Source link and manifest verification failed.' }
New-Item -ItemType Directory -Path $stageRoot -ErrorAction Stop | Out-Null
function Copy-PublicSource([string] $directory) {
    foreach ($entry in Get-ChildItem -LiteralPath $directory -Force) {
        if ($excludedNames -contains $entry.Name -or $entry.Name -eq 'entrant-confirmation.json' -or ($entry.Name -like '.env*' -and $entry.Name -ne '.env.example')) { continue }
        if ($entry.PSIsContainer) { Copy-PublicSource $entry.FullName; continue }
        if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Refusing to package a source symlink.' }
        $relative = $entry.FullName.Substring($projectRoot.Length).TrimStart([char[]]'\/')
        $target = Join-Path $stageRoot $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
        Copy-Item -LiteralPath $entry.FullName -Destination $target
    }
}
Copy-PublicSource $projectRoot
Compress-Archive -Path (Join-Path $stageRoot '*') -DestinationPath $archivePath -CompressionLevel Optimal
$archive = Get-Item -LiteralPath $archivePath
$summary = [ordered]@{ archive = $archive.Name; bytes = $archive.Length; sha256 = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLower(); includes = 'source, license, documentation, synthetic evidence'; excludes = $excludedNames + @('.env'); published = $false }
$summary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $deliveryRoot 'latest-package.json') -Encoding utf8
$summary | ConvertTo-Json -Depth 4
