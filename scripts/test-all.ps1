$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"
$backendPython = Join-Path $backendPath ".venv\Scripts\python.exe"

if (-not (Test-Path $backendPython)) {
    Write-Host "Backend virtual environment not found." -ForegroundColor Red
    Write-Host "Expected: $backendPython"
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  FRONTEND TESTS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Push-Location $frontendPath
try {
    & npm test
    $frontendExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($frontendExitCode -ne 0) {
    Write-Host "Frontend tests failed." -ForegroundColor Red
    exit $frontendExitCode
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  BACKEND TESTS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Push-Location $backendPath
try {
    & $backendPython -m pytest -v
    $backendExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($backendExitCode -ne 0) {
    Write-Host "Backend tests failed." -ForegroundColor Red
    exit $backendExitCode
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green