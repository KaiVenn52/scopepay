$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$output = Join-Path $projectRoot 'delivery\final-demo-2026-10-24'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$scenes = Get-Content -LiteralPath (Join-Path $projectRoot 'submission\demo-scenes.json') -Raw | ConvertFrom-Json
Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $voice.SelectVoice('Microsoft Zira Desktop')
    $voice.Rate = 1
    $results = @()
    foreach ($scene in $scenes) {
        $target = Join-Path $output ($scene.id + '.wav')
        $voice.SetOutputToWaveFile($target)
        $voice.Speak($scene.voice)
        $voice.SetOutputToNull()
        $duration = & ffprobe.exe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $target
        if ($LASTEXITCODE -ne 0) { throw 'Audio duration validation failed.' }
        $results += [ordered]@{ id = $scene.id; caption = $scene.caption; voice = $scene.voice; seconds = [double]::Parse($duration, [Globalization.CultureInfo]::InvariantCulture) }
    }
    $results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output 'audio-scenes.json') -Encoding utf8
    [ordered]@{ scenes = $results.Count; spokenSeconds = ($results | ForEach-Object { $_.seconds } | Measure-Object -Sum).Sum; voice = 'Microsoft Zira Desktop; synthetic narration'; output = $output } | ConvertTo-Json
} finally { $voice.Dispose() }
