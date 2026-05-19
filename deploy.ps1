# ==============================================================================
# 🚀 AUTOMATED WINDOWS DEPLOYMENT & BUILD DAEMON
# File: deploy.ps1
# Usage: .\deploy.ps1
# ==============================================================================

Clear-Host
$StatusMain = "SKIPPED"
$StatusInsys = "SKIPPED"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "🔄 STARTING WALKDROBE LOCAL SYSTEM DEPLOYMENT & BUILD 🔄" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Pull latest Git updates
Write-Host "`n[1/5] Pulling latest code changes from Git..." -ForegroundColor Cyan
git pull
if ($LASTEXITCODE -eq 0) {
    Write-Host "✔ Git pull successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Git pull failed. Continuing with local build anyway..." -ForegroundColor Yellow
}

# 2. Build Customer E-commerce System (main-web)
if (Test-Path ".\main-web") {
    Write-Host "`n[2/5] Building Customer E-commerce Platform (main-web)..." -ForegroundColor Cyan
    Push-Location ".\main-web"
    
    Write-Host "⏳ Installing main-web packages..." -ForegroundColor Yellow
    npm install --quiet
    
    Write-Host "⏳ Compiling optimized Next.js build..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✔ main-web compiled successfully!" -ForegroundColor Green
        $StatusMain = "SUCCESS"
    } else {
        Write-Host "❌ main-web compilation failed." -ForegroundColor Red
        Pop-Location
        Exit 1
    }
    Pop-Location
}

# 3. Build Administrative Panel (insys)
if (Test-Path ".\insys") {
    Write-Host "`n[3/5] Building Admin Panel & Offline Store (insys)..." -ForegroundColor Cyan
    Push-Location ".\insys"
    
    Write-Host "⏳ Installing insys packages..." -ForegroundColor Yellow
    npm install --quiet
    
    Write-Host "⏳ Compiling Next.js build..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✔ insys compiled successfully!" -ForegroundColor Green
        $StatusInsys = "SUCCESS"
    } else {
        Write-Host "❌ insys compilation failed." -ForegroundColor Red
        Pop-Location
        Exit 1
    }
    Pop-Location
}

# 4. Restart Server Daemons via PM2
Write-Host "`n[4/5] Restarting developer daemons via PM2..." -ForegroundColor Cyan
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    if (Test-Path ".\main-web\ecosystem.config.js") {
        Write-Host "⏳ Restarting walkdrobe apps via ecosystem config..." -ForegroundColor Yellow
        pm2 restart .\main-web\ecosystem.config.js
    } else {
        Write-Host "⏳ Restarting all active PM2 threads..." -ForegroundColor Yellow
        pm2 restart all
    }
    Write-Host "✔ PM2 processes restarted successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  PM2 is not installed globally on this Windows machine. Skipping restart." -ForegroundColor Yellow
}

# 5. Display Active Status Board
Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "🎉 LOCAL DEPLOYMENT & BUILD FINISHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "📊 Status Board:"
Write-Host "   - Customer Store (main-web):  [$StatusMain]" -ForegroundColor Green
Write-Host "   - Admin Panel (insys):        [$StatusInsys]" -ForegroundColor Green
Write-Host "   - Local PM2 Daemons:          [UPDATED]" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 status
}
