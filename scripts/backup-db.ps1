$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDirectory = Join-Path $projectRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "professional-system-$timestamp.dump"
$containerBackupPath = "/tmp/$backupName"
$localBackupPath = Join-Path $backupDirectory $backupName

Push-Location $projectRoot

try {
    # Ensure the backup directory exists.
    New-Item `
        -ItemType Directory `
        -Path $backupDirectory `
        -Force | Out-Null

    # Find the running PostgreSQL container.
    $containerId = docker compose ps -q db

    if ($LASTEXITCODE -ne 0 -or -not $containerId) {
        throw "PostgreSQL container is not running. Start it with 'docker compose up -d db'."
    }

    $containerId = $containerId.Trim()

    Write-Host "Creating PostgreSQL backup..." -ForegroundColor Cyan

    # Create a custom-format dump inside the database container.
    docker compose exec -T db sh -c `
        'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "$1"' `
        sh $containerBackupPath

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed. No backup was copied to the local backup directory."
    }

    # Validate the dump before copying it.
    docker compose exec -T db pg_restore --list $containerBackupPath |
        Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Backup validation failed. Do not rely on this backup."
    }

    # Copy the validated dump out of the container.
    docker cp "${containerId}:$containerBackupPath" $localBackupPath

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy the backup to the local computer."
    }

    # Remove the temporary dump from the database container.
    docker compose exec -T db rm -f $containerBackupPath

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "The local backup succeeded, but temporary-file cleanup failed."
    }

    $backupFile = Get-Item $localBackupPath

    if ($backupFile.Length -le 0) {
        throw "The resulting backup file is empty."
    }

    Write-Host ""
    Write-Host "Backup created and validated successfully." -ForegroundColor Green
    Write-Host "Location: $($backupFile.FullName)"
    Write-Host "Size: $([math]::Round($backupFile.Length / 1MB, 2)) MB"
}
finally {
    Pop-Location
}