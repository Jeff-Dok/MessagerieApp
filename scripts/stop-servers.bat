@echo off
echo Arret des serveurs...

REM Arreter Node.js sur le port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Arret du serveur Node.js (PID %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Arreter PHP sur le port 8080
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo Arret du serveur PHP (PID %%a)
    taskkill /PID %%a /F >nul 2>&1
)

echo Serveurs arretes.
timeout /t 2 /nobreak >nul
