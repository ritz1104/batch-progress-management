@echo off
echo =========================================================
echo    Starting Batch Progress Management Platform
echo =========================================================
echo.
echo Starting Backend API on http://localhost:5000...
start cmd /k "cd /d %~dp0backend && npm start"

timeout /t 2 /nobreak >nul

echo Starting Frontend on http://localhost:5173...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Application launched!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo =========================================================
