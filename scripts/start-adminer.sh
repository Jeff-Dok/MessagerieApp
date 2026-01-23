#!/bin/bash

echo "============================================"
echo "   ADMINER - Interface de gestion BDD"
echo "============================================"
echo ""
echo "Démarrage du serveur PHP pour Adminer..."
echo ""
echo "URL: http://localhost:8080/adminer.php"
echo ""
echo "Configuration PostgreSQL:"
echo "- Serveur: localhost:5432"
echo "- Base de données: messagerie_db"
echo "- Utilisateur: postgres"
echo "- Mot de passe: (voir fichier .env)"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo "============================================"
echo ""

php -S localhost:8080
