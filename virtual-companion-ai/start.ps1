# PowerShell script to start all services in separate windows
# NOTE: Use "npm run dev" instead for a single terminal experience!

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Virtual Companion AI - Multi-Window Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will open 3 separate PowerShell windows." -ForegroundColor Yellow
Write-Host "For a single terminal, use: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue or Ctrl+C to cancel..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 1) Redis (Docker) - Optional
Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
try {
  docker compose up -d 2>$null
  Write-Host "Redis started (Docker)" -ForegroundColor Green
} catch {
  Write-Host "Redis skipped (Docker not available - backend will use local threads)" -ForegroundColor Yellow
}
Pop-Location

# 2) Backend (FastAPI) - No install, just run
Write-Host "Starting FastAPI Avatar Service (port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$PSScriptRoot\avatar-service`"; Write-Host 'FastAPI Avatar Service - Port 8000' -ForegroundColor Cyan; python -m uvicorn main:app --reload --port 8000"
)

# 3) Node Backend - No install, just run
Write-Host "Starting Node Backend (port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$PSScriptRoot\backend`"; Write-Host 'Node Backend API - Port 4000' -ForegroundColor Yellow; npm run dev"
)

# 4) Frontend - No install, just run
Write-Host "Starting Frontend (port 3006)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$PSScriptRoot\frontend`"; Write-Host 'React Frontend - Port 3006' -ForegroundColor Magenta; npm run dev"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services starting!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3006" -ForegroundColor White
Write-Host "Backend API: http://localhost:4000" -ForegroundColor White
Write-Host "Avatar Service: http://localhost:8000/api/docs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green


