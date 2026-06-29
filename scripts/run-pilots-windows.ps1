# Sprint 13 — Operational pilot execution (Windows + WSL)
$ErrorActionPreference = "Continue"
$hostIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -match 'vEthernet|WSL|Ethernet' -and $_.IPAddress -notmatch '^127\.' } |
    Select-Object -First 1).IPAddress
if (-not $hostIp) { $hostIp = "host.docker.internal" }

$apiUrl = "http://${hostIp}:3001"
$authUrl = "http://127.0.0.1:54321/auth/v1"
$projectRoot = "/mnt/c/Users/jmend/Documents/ANTIGRAVITY FOLDER/kadarn-platform"
$reportDir = Join-Path $env:TEMP "kadarn-execution-gate"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

Write-Host "API URL for WSL: $apiUrl"
Write-Host "Report dir: $reportDir"

# Preflight from Windows
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 10
    Write-Host "API health: $($health.status) ($($health.version))"
} catch {
    Write-Host "FAIL: API not reachable on localhost:3001"
    exit 1
}

$scripts = @(
    @{ Num = 1; Name = "Prospective Biospecimen Collection"; Script = "run-pilot-1.sh" },
    @{ Num = 2; Name = "Retrospective FFPE Request"; Script = "run-pilot-2.sh" },
    @{ Num = 3; Name = "Hospital Onboarding"; Script = "run-pilot-3.sh" },
    @{ Num = 4; Name = "Biobank Onboarding"; Script = "run-pilot-4.sh" },
    @{ Num = 5; Name = "Research Sponsor Program"; Script = "run-pilot-5.sh" }
)

$results = @()
foreach ($p in $scripts) {
    Write-Host ""
    Write-Host "========== Pilot $($p.Num): $($p.Name) =========="
    $outFile = Join-Path $reportDir "pilot$($p.Num)-output.txt"
    $scriptPath = "$projectRoot/scripts/$($p.Script)"
    $wslCmd = "export API='$apiUrl' AUTH='$authUrl'; bash '$scriptPath'"
    wsl bash -lc $wslCmd 2>&1 | Tee-Object -FilePath $outFile
    $code = $LASTEXITCODE
    if ($code -eq 0) {
        Write-Host "PASS Pilot $($p.Num)"
        $results += $true
    } else {
        Write-Host "FAIL Pilot $($p.Num) (exit $code)"
        $results += $false
    }
    $tmpReport = "/tmp/pilot$($p.Num)-report.txt"
    wsl bash -lc "test -f '$tmpReport' && cat '$tmpReport'" 2>$null | Out-File (Join-Path $reportDir "pilot$($p.Num)-report.txt") -Encoding utf8
}

Write-Host ""
Write-Host "========== SCORECARD =========="
for ($i = 0; $i -lt $scripts.Count; $i++) {
    $status = if ($results[$i]) { "PASS" } else { "FAIL" }
    Write-Host "$($i + 1). $($scripts[$i].Name): $status"
}
$pass = ($results | Where-Object { $_ }).Count
Write-Host "Total: $pass/5 passed"
Write-Host "Reports: $reportDir"

if ($pass -eq 5) { exit 0 } else { exit 1 }
