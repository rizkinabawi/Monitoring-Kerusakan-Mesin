$ErrorActionPreference = "Continue"

Write-Host "Waiting for Docker to be ready..."
$maxRetries = 30
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker is ready!"
        break
    }
    Write-Host "Docker not ready yet. Waiting 10 seconds..."
    Start-Sleep -Seconds 10
    $retryCount++
}

if ($retryCount -eq $maxRetries) {
    Write-Host "Timed out waiting for Docker."
    exit 1
}

Write-Host "Starting database..."
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start docker compose"
    exit 1
}

Start-Sleep -Seconds 5

$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/monitoring"

Write-Host "Pushing database schema..."
pnpm --filter @workspace/db run push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push schema"
    exit 1
}

Write-Host "Seeding database..."
$env:SEED_ADMIN_PASSWORD="supersecretpassword123"
pnpm --filter @workspace/api-server run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to seed database"
    exit 1
}

Write-Host "Setup completed successfully!"
