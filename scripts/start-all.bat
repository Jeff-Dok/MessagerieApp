@echo off
echo ============================================
echo   DEMARRAGE SERVEUR + ADMINER
echo ============================================
echo.

REM Se positionner dans le dossier racine du projet
cd /d "%~dp0.."

echo [1/2] Demarrage du serveur backend...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo [2/2] Demarrage d'Adminer (PHP)...
start "Adminer" cmd /k "php -S localhost:8080"

echo.
echo ============================================
echo   SERVICES DEMARRES
echo ============================================
echo.
echo Backend:  http://localhost:3000
echo Adminer:  http://localhost:8080/tools/adminer/adminer-login.php
echo.
echo Les serveurs tournent dans des fenetres separees.
echo Fermez ces fenetres pour arreter les services.
echo ============================================

REM Attendre 3 secondes puis ouvrir les URLs dans le navigateur
timeout /t 3 /nobreak >nul
start "" "http://localhost:8080/tools/adminer/adminer-login.php"

pause
