@echo off
echo ============================================
echo   TEST DE CONNEXION POSTGRESQL
echo ============================================
echo.
echo Ce script va tester la connexion a PostgreSQL
echo.
echo Mots de passe courants a essayer:
echo - postgres
echo - admin
echo - root
echo - 1066703
echo - (vide - appuyez juste sur Entree)
echo.
echo ============================================
echo.

"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres -c "SELECT 'Connexion reussie!' AS status;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo ✓ CONNEXION REUSSIE!
    echo ============================================
    echo.
    echo Voulez-vous changer le mot de passe pour 1066703? (O/N)
    set /p confirm=

    if /i "%confirm%"=="O" (
        echo.
        echo Changement du mot de passe...
        "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres -f reset-postgres-password.sql
        echo.
        echo Mot de passe change!
    )
) else (
    echo.
    echo ============================================
    echo ✗ ECHEC DE CONNEXION
    echo ============================================
    echo.
    echo Le mot de passe saisi est incorrect.
    echo.
    echo Solutions:
    echo 1. Essayez a nouveau avec le bon mot de passe
    echo 2. Consultez RESET_PASSWORD_GUIDE.md pour d'autres methodes
    echo 3. Utilisez Adminer pour changer le mot de passe
    echo.
)

pause
