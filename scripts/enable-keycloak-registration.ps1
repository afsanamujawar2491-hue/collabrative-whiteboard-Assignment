# Run this script to enable user registration in Keycloak
# Use when you see "Registration not allowed" on signup

Write-Host "Enabling registration on Keycloak whiteboard realm..." -ForegroundColor Cyan

$container = "whiteboard-keycloak"
$running = docker ps --filter "name=$container" --filter "status=running" -q

if (-not $running) {
    $container = "keycloak"
    $running = docker ps --filter "name=^/${container}$" --filter "status=running" -q
}

if (-not $running) {
    Write-Host "ERROR: No running Keycloak container found." -ForegroundColor Red
    Write-Host "Start it with: docker compose up -d keycloak" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using container: $container" -ForegroundColor Cyan

Write-Host "Configuring admin credentials..."
docker exec $container /opt/keycloak/bin/kcadm.sh config credentials `
    --server http://localhost:8080 `
    --realm master `
    --user admin `
    --password admin 2>$null

Write-Host "Enabling registration..."
$result = docker exec $container /opt/keycloak/bin/kcadm.sh update realms/whiteboard `
    -s registrationAllowed=true `
    -s loginWithEmailAllowed=true `
    -s resetPasswordAllowed=true `
    -s verifyEmail=false 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to update realm:" -ForegroundColor Red
    Write-Host $result
    exit 1
}

Write-Host ""
Write-Host "Done! Registration is now enabled." -ForegroundColor Green
Write-Host "Try Sign Up again at http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "If it still fails, reset Keycloak with:" -ForegroundColor Yellow
Write-Host "  docker compose down" -ForegroundColor Yellow
Write-Host "  docker volume rm collabrativewhiteboard_keycloak_data" -ForegroundColor Yellow
Write-Host "  docker compose up -d keycloak" -ForegroundColor Yellow
