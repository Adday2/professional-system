$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDirectory = Join-Path $projectRoot "backups"

$backupFile = Get-ChildItem `
    -Path $backupDirectory `
    -Filter "*.dump" `
    -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $backupFile) {
    throw "No .dump backup found in the backups directory."
}

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testDatabase = "restore_test_$timestamp"
$containerBackupPath = "/tmp/$($backupFile.Name)"

$databaseCreated = $false
$dumpCopied = $false

Push-Location $projectRoot

try {
    $containerId = docker compose ps -q db

    if ($LASTEXITCODE -ne 0 -or -not $containerId) {
        throw "PostgreSQL container is not running."
    }

    $containerId = $containerId.Trim()

    $postgresUser = (
        docker compose exec -T db printenv POSTGRES_USER |
        Out-String
    ).Trim()

    if ($LASTEXITCODE -ne 0 -or -not $postgresUser) {
        throw "Could not determine the PostgreSQL username."
    }

    Write-Host "Using backup: $($backupFile.Name)" -ForegroundColor Cyan

    docker cp `
        $backupFile.FullName `
        "${containerId}:$containerBackupPath"

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy backup into the database container."
    }

    $dumpCopied = $true

    docker compose exec -T db createdb `
        -U $postgresUser `
        $testDatabase

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create temporary restore-test database."
    }

    $databaseCreated = $true

    Write-Host "Restoring backup into temporary database..." -ForegroundColor Cyan

    docker compose exec -T db pg_restore `
        --exit-on-error `
        --no-owner `
        --no-privileges `
        -U $postgresUser `
        -d $testDatabase `
        $containerBackupPath

    if ($LASTEXITCODE -ne 0) {
        throw "Restore failed."
    }

    Write-Host "Checking restored users table..." -ForegroundColor Cyan

    $userCountText = docker compose exec -T db psql `
        -At `
        -U $postgresUser `
        -d $testDatabase `
        -c "SELECT COUNT(*) FROM users;"

    if ($LASTEXITCODE -ne 0) {
        throw "Could not query the users table in the restored database."
    }

    $userCount = [int](($userCountText | Out-String).Trim())

    Write-Host ""
    Write-Host "Restore test passed." -ForegroundColor Green
    Write-Host "Backup: $($backupFile.Name)"
    Write-Host "Users restored: $userCount"
}
finally {
    if ($databaseCreated) {
        docker compose exec -T db dropdb `
            --if-exists `
            -U $postgresUser `
            $testDatabase

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not remove temporary database $testDatabase. Manual cleanup may be needed."
        }
    }

    if ($dumpCopied) {
        docker compose exec -T db rm -f $containerBackupPath

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not remove the temporary backup copy from the container."
        }
    }

    Pop-Location
}