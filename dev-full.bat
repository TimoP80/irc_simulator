@echo off
echo Starting Station V - Virtual IRC Simulator
echo.
echo Starting WebSocket server on port 8080...
start "Station V Server" cmd /k "npm run server"
timeout /t 2 /nobreak >nul
echo.
echo Starting Vite development server...
start "Station V Client" cmd /k "npm run dev"
echo.
echo Both servers are starting in separate windows.
echo WebSocket server: http://localhost:8080
echo Web client: http://localhost:5173
echo.
echo Press any key to exit this launcher...
pause
