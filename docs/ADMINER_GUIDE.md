# Guide d'utilisation d'Adminer

## Description

Adminer est un outil de gestion de base de données leger et puissant ecrit en PHP. Il permet de gerer facilement votre base de donnees PostgreSQL via une interface web.

## Demarrage rapide

### Option 1: Automatique avec le backend (recommande)

Adminer demarre automatiquement avec le serveur backend:

```bash
npm run dev
```

Le serveur PHP est lance sur le port 8080.

### Option 2: Via npm (standalone)

```bash
npm run adminer
```

ou

```bash
npm run db:admin
```

### Option 3: Commande manuelle

```bash
php -S localhost:8080
```

## Acces a l'interface

Une fois le serveur demarre, ouvrez votre navigateur et accedez a:

- **Page de connexion simplifiee**: http://localhost:8080/tools/adminer/adminer-login.php
- **Adminer direct**: http://localhost:8080/tools/adminer/adminer.php

## Informations de connexion

Les informations de connexion sont automatiquement chargees depuis votre fichier `backend/.env`:

- **Systeme**: PostgreSQL
- **Serveur**: localhost:5432
- **Base de donnees**: messagerie_db
- **Utilisateur**: postgres

## Fonctionnalites principales

- **Parcourir les tables**: Visualisez vos tables et leurs donnees
- **Executer des requetes SQL**: Ecrire et executer des requetes personnalisees
- **Importer/Exporter**: Importer des donnees SQL ou exporter votre base
- **Modifier les donnees**: Editer directement les enregistrements
- **Gerer la structure**: Creer/modifier des tables et colonnes
- **Visualiser les relations**: Voir les cles etrangeres et relations

## Configuration avancee

### Changer le port d'ecoute

Si le port 8080 est deja utilise, vous pouvez modifier la variable `PHP_PORT` dans votre fichier `.env`:

```env
PHP_PORT=8888
```

## Securite

**IMPORTANT**: Adminer donne un acces complet a votre base de donnees.

### Recommandations de securite:

1. Utilisez Adminer **uniquement en developpement local**
2. **Ne jamais** deployer Adminer en production
3. **Ne jamais** exposer Adminer sur Internet
4. Supprimez le dossier `tools/adminer/` avant le deploiement en production

## Depannage

### Le serveur ne demarre pas

**Probleme**: PHP n'est pas installe ou non accessible

**Solution**:
```bash
# Verifier que PHP est installe
php --version

# Si PHP n'est pas trouve, installez-le:
# Windows: Telechargez depuis https://windows.php.net/download/
# Mac: brew install php
# Linux: sudo apt install php-cli php-pgsql
```

### Impossible de se connecter a PostgreSQL

**Probleme**: PostgreSQL n'est pas demarre

**Solution**:
```bash
# Windows
net start postgresql-x64-14

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

**Probleme**: Extension pgsql manquante

**Solution**: Assurez-vous que l'extension PostgreSQL pour PHP est installee et activee dans `php.ini`:
```ini
extension=pdo_pgsql
extension=pgsql
```

### Port 8080 deja utilise

**Solution**: Modifiez `PHP_PORT` dans votre fichier `.env` ou utilisez un autre port manuellement:
```bash
php -S localhost:8888
```

## Ressources

- [Documentation officielle Adminer](https://www.adminer.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Adminer sur GitHub](https://github.com/vrana/adminer)

---

**Version**: 1.1.0
**Derniere mise a jour**: 2026-01-22
