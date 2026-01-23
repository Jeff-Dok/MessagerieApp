@echo off
echo ============================================
echo   REINITIALISATION MOT DE PASSE POSTGRESQL
echo ============================================
echo.
echo Ce script va changer le mot de passe PostgreSQL pour: 1066703
echo.
echo IMPORTANT: Vous devez connaitre votre mot de passe actuel
echo            OU avoir configure trust dans pg_hba.conf
echo.
pause
echo.

REM Exécuter le script SQL
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres -f reset-postgres-password.sql

echo.
echo ============================================
echo.
echo Si vous avez vu "Mot de passe change avec succes",
echo vous pouvez maintenant demarrer le serveur.
echo.
pause
