@echo off
echo ============================================
echo   ADMINER - Interface de gestion BDD
echo ============================================
echo.
echo Demarrage du serveur PHP pour Adminer...
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
