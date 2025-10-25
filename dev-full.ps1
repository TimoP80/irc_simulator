# Station V - Virtual IRC Simulator Development Launcher
# PowerShell version

Write-Host "Starting Station V - Virtual IRC Simulator" -ForegroundColor Green
Write-Host ""

Write-Host "Starting WebSocket server on port 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server" -WindowStyle Normal

Write-Host "Waiting 2 seconds for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Starting Vite development server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting in separate windows." -ForegroundColor Green
Write-Host "WebSocket server: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Web client: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
