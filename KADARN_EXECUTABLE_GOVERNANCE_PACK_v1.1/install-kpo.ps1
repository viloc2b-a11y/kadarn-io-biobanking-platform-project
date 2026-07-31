[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RepositoryRoot,
    [switch]$Apply
)

$ErrorActionPreference = "Stop"
$packageRoot = $PSScriptRoot
$repository = (Resolve-Path $RepositoryRoot).Path

if (-not (Test-Path (Join-Path $repository ".git"))) {
    throw "RepositoryRoot is not a Git checkout: $repository"
}

$head = git -C $repository rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[0-9a-f]{40}$') {
    throw "Unable to verify the repository HEAD."
}

$branch = git -C $repository branch --show-current
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($branch)) {
    throw "Unable to verify the current Git branch."
}

$targets = @(
    "scripts/kpo_validate.py",
    "docs/governance/KPO_PRACTICAL_EXECUTION_POLICY.md",
    "governance/kpo/KPO_GOVERNANCE_PROFILE.yml",
    "governance/work-orders/_template/work-order.yml",
    "governance/work-orders/_template/state.yml",
    "governance/work-orders/_template/EVIDENCE_INDEX.md",
    ".github/workflows/kpo-governance.yml",
    "tests/kpo/test_kpo_validate.py"
)

$conflicts = @()
$changes = @()
foreach ($relative in $targets) {
    $source = Join-Path $packageRoot $relative
    $destination = Join-Path $repository $relative
    if (-not (Test-Path $source)) {
        throw "Package file missing: $relative"
    }
    if (Test-Path $destination) {
        $sourceHash = (Get-FileHash $source -Algorithm SHA256).Hash
        $destinationHash = (Get-FileHash $destination -Algorithm SHA256).Hash
        if ($sourceHash -ne $destinationHash) {
            $conflicts += $relative
        }
    } else {
        $changes += $relative
    }
}

Write-Host "KADARN KPO installation preflight"
Write-Host "Repository: $repository"
Write-Host "Branch:     $branch"
Write-Host "HEAD:       $head"
Write-Host "New files:  $($changes.Count)"
Write-Host "Conflicts:  $($conflicts.Count)"

if ($conflicts.Count -gt 0) {
    $conflicts | ForEach-Object { Write-Host "CONFLICT $_" }
    throw "Installation stopped. Existing non-identical files require manual reconciliation."
}

if (-not $Apply) {
    Write-Host "DRY RUN PASS. Re-run with -Apply to copy the files."
    exit 0
}

foreach ($relative in $targets) {
    $source = Join-Path $packageRoot $relative
    $destination = Join-Path $repository $relative
    $parent = Split-Path $destination -Parent
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination
}

python (Join-Path $repository "scripts/kpo_validate.py") --root $repository --mode advisory
if ($LASTEXITCODE -ne 0) {
    throw "Files were copied, but advisory validation failed. Review the reported findings."
}

python -m unittest discover -s (Join-Path $repository "tests/kpo") -p "test_*.py"
if ($LASTEXITCODE -ne 0) {
    throw "Files were copied, but validator tests failed."
}

Write-Host "INSTALLATION PASS"
Write-Host "No files were staged, committed, pushed, or merged."
