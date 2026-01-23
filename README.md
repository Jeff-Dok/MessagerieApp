# MessagerieApp

> Application de messagerie securisee avec profils enrichis et validation administrative

## Version 3.1.0

## Architecture Globale

```
messagerie-app/
|
|-- README.md                             # Documentation principale
|-- package.json                          # Configuration npm racine
|-- .gitignore                            # Fichiers a ignorer
|-- .prettierrc.json                      # Configuration Prettier
|
|-- scripts/                              # Scripts batch/shell
|   |-- start-adminer.bat                 # Demarrer Adminer (Windows)
|   |-- start-adminer.sh                  # Demarrer Adminer (Unix)
|   |-- restart-adminer.bat               # Redemarrer Adminer
|   |-- stop-servers.bat                  # Arreter les serveurs
|   |-- reset-password.bat                # Reset mot de passe
|   |-- test-postgres-connection.bat      # Tester connexion PostgreSQL
|   |-- diagnose.sh                       # Diagnostic installation
|
|-- tools/                                # Outils de developpement
|   |-- adminer/                          # Interface base de donnees
|       |-- adminer.php                   # Adminer principal
|       |-- adminer.css                   # Theme sombre
|       |-- adminer-login.php             # Page de connexion simplifiee
|       |-- index.php                     # Point d'entree
|
|-- docs/                                 # Documentation supplementaire
|   |-- ADMINER_GUIDE.md                  # Guide Adminer
|   |-- GUIDE_REPARATION_PROFILS.md       # Guide reparation profils
|   |-- RESET_PASSWORD_GUIDE.md           # Guide reset mot de passe
|
|-- backend/                              # Serveur Node.js + Express
|   |-- server.js                         # Point d'entree principal
|   |-- package.json                      # Dependances backend
|   |-- .env.example                      # Exemple de configuration
|   |
|   |-- config/                           # Configuration
|   |   |-- database.js                   # Connexion PostgreSQL
|   |   |-- jwt.js                        # Configuration JWT
|   |   |-- multer.js                     # Upload de fichiers
|   |
|   |-- models/                           # Modeles de donnees
|   |   |-- index.js                      # Export centralise
|   |   |-- User.js                       # Modele Utilisateur
|   |   |-- Message.js                    # Modele Message
|   |
|   |-- controllers/                      # Logique metier
|   |   |-- authController.js             # Authentification
|   |   |-- userController.js             # Gestion utilisateurs
|   |   |-- messageController.js          # Gestion messages
|   |   |-- adminController.js            # Gestion admin
|   |
|   |-- routes/                           # Routes API
|   |   |-- index.js                      # Routes centralisees
|   |   |-- auth.js                       # Routes authentification
|   |   |-- users.js                      # Routes utilisateurs
|   |   |-- messages.js                   # Routes messages
|   |   |-- admin.js                      # Routes administration
|   |
|   |-- middleware/                       # Middleware
|   |   |-- auth.js                       # Authentification JWT
|   |   |-- validation.js                 # Validation donnees
|   |   |-- errorHandler.js               # Gestion erreurs
|   |   |-- rateLimiter.js                # Limitation de requetes
|   |
|   |-- services/                         # Services metier
|   |   |-- imageService.js               # Traitement images messages
|   |   |-- profilePhotoService.js        # Traitement photos profil
|   |   |-- socketService.js              # Gestion Socket.io
|   |   |-- cleanupService.js             # Nettoyage automatique
|   |
|   |-- utils/                            # Utilitaires
|   |   |-- logger.js                     # Systeme de logs
|   |   |-- helpers.js                    # Fonctions utiles
|   |   |-- constants.js                  # Constantes
|   |
|   |-- database/                         # Scripts SQL
|   |   |-- init.sql                      # Initialisation DB
|   |   |-- seed.sql                      # Donnees de test
|   |   |-- migration_profiles.sql        # Migration profils
|   |
|   |-- scripts/                          # Scripts utilitaires backend
|   |   |-- create-test-profile.js        # Creer profil de test
|   |   |-- fix-incomplete-profiles.js    # Reparer profils incomplets
|   |
|   |-- __tests__/                        # Tests unitaires
|
|-- frontend/                             # Application web
    |-- index.html                        # Page d'accueil (redirection)
    |-- login.html                        # Page de connexion
    |-- register.html                     # Page d'inscription
    |-- pending.html                      # Page attente validation
    |-- dashboard.html                    # Interface messagerie
    |-- admin.html                        # Panneau admin
    |-- offline.html                      # Page hors-ligne
    |
    |-- css/                              # Styles
    |   |-- reset.css                     # Reset CSS
    |   |-- variables.css                 # Variables globales
    |   |-- global.css                    # Styles globaux
    |   |-- components.css                # Composants reutilisables
    |   |-- auth.css                      # Pages authentification
    |   |-- dashboard.css                 # Interface messagerie
    |   |-- theme-enhancements.css        # Ameliorations theme
    |   |-- image-modal.css               # Modal images
    |
    |-- js/                               # JavaScript
    |   |-- config.js                     # Configuration (URLs dynamiques)
    |   |-- api.js                        # Client API REST
    |   |-- socket.js                     # Client Socket.io
    |   |-- auth.js                       # Authentification
    |   |-- storage.js                    # Gestion localStorage
    |   |-- app.js                        # Point d'entree app
    |   |
    |   |-- ui/                           # Composants UI
    |   |   |-- messageRenderer.js        # Rendu messages
    |   |   |-- conversationList.js       # Liste conversations
    |   |   |-- notifications.js          # Notifications
    |   |
    |   |-- services/                     # Services frontend
    |   |   |-- imageHandler.js           # Gestion images
    |   |   |-- expirationManager.js      # Gestion expiration
    |   |
    |   |-- utils/                        # Utilitaires
    |       |-- helpers.js                # Fonctions utiles
    |       |-- validation.js             # Validation formulaires
    |
    |-- images/                           # Ressources
    |   |-- logo.svg                      # Logo application
    |   |-- icons/                        # Icones
    |
    |-- docs/                             # Documentation frontend
        |-- API.md                        # Documentation API
        |-- GUIDE.md                      # Guide utilisateur
```

---

## Demarrage Rapide

### Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12
- npm >= 6.0.0

### Installation

```bash
# Cloner le projet
git clone https://github.com/Jeff-Dok/MessagerieApp.git
cd messagerie-app

# Installer les dependances
npm run install:all

# Configurer l'environnement
cp backend/.env.example backend/.env
# Editer backend/.env avec vos parametres

# Initialiser la base de donnees
npm run db:init

# Demarrer le serveur
npm run dev
```

### URLs

```
Backend API:  http://localhost:5000/api
Frontend:     http://localhost:3000
Adminer:      http://localhost:8080  (via npm run adminer)
```

---

## Fonctionnalites

### Messagerie
- Messages texte en temps reel via Socket.io
- Partage d'images securise avec expiration automatique (5 minutes)
- Indicateur "en train d'ecrire..."
- Notifications de nouveaux messages
- Marquer les messages comme lus

### Securite des Images
- Rendu sur Canvas (non telechargeables directement)
- Expiration automatique apres 5 minutes de visualisation
- Protection contre clic droit et captures d'ecran
- Nettoyage automatique des images expirees

### Authentification
- Inscription et connexion securisees
- JWT (JSON Web Tokens)
- Hashage des mots de passe avec bcrypt
- Roles utilisateurs (admin/user)
- Validation des profils par administrateur

### Configuration Dynamique
- URLs API et Socket.io automatiquement detectees (localhost vs production)
- Configuration centralisee dans `frontend/js/config.js`

---

## Scripts npm

```bash
# Developpement
npm run dev              # Demarrer en mode developpement
npm run start            # Demarrer en production

# Base de donnees
npm run adminer          # Demarrer l'interface Adminer
npm run db:init          # Initialiser la base de donnees
npm run db:seed          # Ajouter des donnees de test
npm run db:reset         # Reinitialiser la base de donnees

# Tests et qualite
npm test                 # Lancer les tests
npm run lint             # Verifier le code
npm run format           # Formater le code

# Installation
npm run install:all      # Installer toutes les dependances
```

---

## Dependances Principales

### Backend
- **express** - Framework web
- **sequelize** - ORM PostgreSQL
- **bcryptjs** - Hashage mots de passe
- **jsonwebtoken** - JWT authentification
- **socket.io** - WebSocket temps reel
- **multer** - Upload fichiers
- **sharp** - Traitement images
- **helmet** - Securite HTTP
- **express-rate-limit** - Rate limiting

### Frontend
- Socket.io Client (CDN)
- Vanilla JavaScript (ES6+)
- CSS3 avec variables

---

## Securite

### Backend
- Hashage bcrypt (10 rounds)
- JWT avec expiration
- Validation express-validator
- Rate limiting
- Helmet headers
- CORS configure
- Protection XSS
- Sanitization des donnees

### Frontend
- Validation formulaires
- Echappement HTML
- Protection images (Canvas)
- Desactivation clic droit
- Blocage captures d'ecran

---

## Contribution

1. Fork le projet
2. Creer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## Licence

MIT License - voir LICENSE

---

## Auteurs

- Jean-Francois Gagnon - [@JeffDok](https://github.com/Jeff-Dok)

---

## Support

- Issues: [GitHub Issues](https://github.com/Jeff-Dok/MessagerieApp/issues)

---

Version: 3.1.0
Date: 22 janvier 2026
