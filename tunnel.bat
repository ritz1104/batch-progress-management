@echo off
echo ========================================================
echo   Exposing BatchProgress to the Internet (Public URL)
echo ========================================================
echo.
echo Please ensure your application is running (start.bat).
echo Generating secure public HTTPS link for port 5000...
echo.
npx localtunnel --port 5000
pause
