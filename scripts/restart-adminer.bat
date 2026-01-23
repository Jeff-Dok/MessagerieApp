@echo off
echo ============================================
echo   REDEMARRAGE DU SERVEUR ADMINER
echo ============================================
echo.
echo Arret du serveur PHP en cours...

REM Trouver et tuer le processus PHP sur le port 8080
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo Arret du processus %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Attente de 2 secondes...
timeout /t 2 /nobreak >nul

echo.
echo Demarrage du nouveau serveur PHP...
echo.
echo URL: http://localhost:8080/tools/adminer/adminer-login.php
echo.
echo Configuration PostgreSQL:
echo - Serveur: localhost:5432
echo - Base de donnees: messagerie_db
echo - Utilisateur: postgres
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo ============================================
echo.

php -S localhost:8080

pause
