# Guide d'utilisation d'Adminer

## 📖 Description

Adminer est un outil de gestion de base de données léger et puissant écrit en PHP. Il permet de gérer facilement votre base de données PostgreSQL via une interface web.

## 🚀 Démarrage rapide

### Option 1: Via npm (recommandé)

```bash
npm run adminer
```

ou

```bash
npm run db:admin
```

### Option 2: Via script batch (Windows)

Double-cliquez sur le fichier `start-adminer.bat` à la racine du projet.

### Option 3: Via script shell (Linux/Mac)

```bash
chmod +x start-adminer.sh
./start-adminer.sh
```

### Option 4: Commande manuelle

```bash
php -S localhost:8080
```

## 🌐 Accès à l'interface

Une fois le serveur démarré, ouvrez votre navigateur et accédez à:

- **Page de connexion simplifiée**: http://localhost:8080/adminer-login.php
- **Adminer direct**: http://localhost:8080/adminer.php

## 🔐 Informations de connexion

Les informations de connexion sont automatiquement chargées depuis votre fichier `.env`:

- **Système**: PostgreSQL
- **Serveur**: localhost:5432
- **Base de données**: messagerie_db
- **Utilisateur**: postgres
- **Mot de passe**: (celui défini dans `.env`)

## 🎨 Thème sombre

Le fichier `adminer-dark.css` est automatiquement appliqué à Adminer pour un thème sombre.

### Comment ça fonctionne

Adminer charge automatiquement le fichier CSS du même nom que le fichier PHP mais avec l'extension `.css`. Donc:
- `adminer.php` → `adminer.css` (chargé automatiquement)

Le fichier `adminer-dark.css` a été renommé en `adminer.css` pour être appliqué automatiquement.

Si vous voulez personnaliser davantage le thème:

1. Éditez le fichier `adminer-dark.css`
2. Assurez-vous qu'il soit nommé `adminer.css` ou créez un lien symbolique
3. Rechargez la page Adminer

## 📋 Fonctionnalités principales

- **Parcourir les tables**: Visualisez vos tables et leurs données
- **Exécuter des requêtes SQL**: Écrire et exécuter des requêtes personnalisées
- **Importer/Exporter**: Importer des données SQL ou exporter votre base
- **Modifier les données**: Éditer directement les enregistrements
- **Gérer la structure**: Créer/modifier des tables et colonnes
- **Visualiser les relations**: Voir les clés étrangères et relations

## ⚙️ Configuration avancée

### Changer le port d'écoute

Si le port 8080 est déjà utilisé, vous pouvez changer le port:

```bash
php -S localhost:8888
```

Puis accédez à: http://localhost:8888/adminer.php

### Utiliser avec Docker (alternative)

Si vous préférez utiliser Docker:

```bash
docker run -p 8080:8080 --network host adminer
```

## 🔒 Sécurité

⚠️ **IMPORTANT**: Adminer donne un accès complet à votre base de données.

### Recommandations de sécurité:

1. ✅ Utilisez Adminer **uniquement en développement local**
2. ❌ **Ne jamais** déployer Adminer en production
3. ❌ **Ne jamais** exposer Adminer sur Internet
4. ✅ Supprimez `adminer.php` avant le déploiement en production
5. ✅ Ajoutez `adminer.php` au `.gitignore` si nécessaire

## 🐛 Dépannage

### Le serveur ne démarre pas

**Problème**: PHP n'est pas installé ou non accessible

**Solution**:
```bash
# Vérifier que PHP est installé
php --version

# Si PHP n'est pas trouvé, installez-le:
# Windows: Téléchargez depuis https://windows.php.net/download/
# Mac: brew install php
# Linux: sudo apt install php-cli php-pgsql
```

### Impossible de se connecter à PostgreSQL

**Problème**: PostgreSQL n'est pas démarré

**Solution**:
```bash
# Windows
net start postgresql-x64-14

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

**Problème**: Extension pgsql manquante

**Solution**: Assurez-vous que l'extension PostgreSQL pour PHP est installée et activée dans `php.ini`:
```ini
extension=pdo_pgsql
extension=pgsql
```

### Le thème sombre ne s'applique pas

**Solution**:
1. Vérifiez que le fichier est nommé exactement `adminer.css` (pas `adminer-dark.css`)
2. Videz le cache de votre navigateur (Ctrl+F5)
3. Vérifiez que le fichier CSS est dans le même dossier que `adminer.php`

### Port 8080 déjà utilisé

**Solution**: Utilisez un autre port:
```bash
php -S localhost:8888
```

## 📚 Ressources

- [Documentation officielle Adminer](https://www.adminer.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Adminer sur GitHub](https://github.com/vrana/adminer)

## 🆘 Support

Pour toute question ou problème, consultez:
1. Ce guide
2. Les logs de votre serveur PostgreSQL
3. Les logs du serveur PHP (affichés dans le terminal)
4. La documentation de votre projet

---

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-22
