
@echo off

echo ========================================
echo       VTC MANAGER
echo ========================================
echo.

cd /d "%USERPROFILE%\Desktop\vtcManager\server"

echo Demarrage du serveur Node.js...
start "VTC Manager - Node.js" cmd /k "node server.js"

timeout /t 2 /nobreak > nul

echo.
echo Demarrage de Cloudflare Tunnel...
start "VTC Manager - Cloudflare" cmd /k ""%USERPROFILE%\Desktop\cloudflared.exe" tunnel --url http://127.0.0.1:3000"

echo.
echo ========================================
echo VTC Manager est en cours de demarrage
echo ========================================
echo.

pause

