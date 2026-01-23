#!/bin/bash

echo "=== Diagnostic npm installation ==="
echo ""

echo "1. Version Node.js:"
node --version

echo ""
echo "2. Version npm:"
npm --version

echo ""
echo "3. Répertoire actuel:"
pwd

echo ""
echo "4. Fichiers présents:"
ls -la package.json backend/package.json 2>/dev/null || echo "Fichiers manquants!"

echo ""
echo "5. Cache npm:"
npm cache verify

echo ""
echo "6. Python disponible?"
python --version 2>/dev/null || python3 --version 2>/dev/null || echo "Python non trouvé"

echo ""
echo "=== Fin du diagnostic ==="