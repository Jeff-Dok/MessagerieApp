# 📁 Structure du Projet MessagerieApp

> Application de messagerie sécurisée avec profils enrichis et validation administrative

## 🗂️ Architecture Globale
```
messagerie-app/
│
├── 📄 README.md                          # Documentation principale
├── 📄 README_PROFILS.md                  # Documentation profils étendus
├── 📄 quick_start_guide.md               # Guide de démarrage rapide
├── 📄 package.json                       # Configuration npm racine
├── 📄 .gitignore                         # Fichiers à ignorer
│
├── 📂 backend/                           # Serveur Node.js + Express
│   ├── 📄 server.js                      # ⭐ Point d'entrée principal
│   ├── 📄 package.json                   # Dépendances backend
│   ├── 📄 .env.exemple                   # Exemple de configuration
│   ├── 📄 .gitignore                     # Ignorer fichiers backend
│   ├── 📄 README.md                      # Documentation backend
│   │
│   ├── 📂 config/                        # ⚙️ Configuration
│   │   ├── database.js                   # Connexion PostgreSQL
│   │   ├── jwt.js                        # Configuration JWT
│   │   └── multer.js                     # Upload de fichiers (v3.0)
│   │
│   ├── 📂 models/                        # 💾 Modèles de données
│   │   ├── index.js                      # Export centralisé
│   │   ├── User.js                       # 👤 Modèle Utilisateur (v3.0 - Profils étendus)
│   │   └── Message.js                    # 💬 Modèle Message
│   │
│   ├── 📂 controllers/                   # 🎮 Logique métier
│   │   ├── authController.js             # 🔐 Authentification (v3.0 - Validation)
│   │   ├── userController.js             # 👥 Gestion utilisateurs
│   │   ├── messageController.js          # 💬 Gestion messages
│   │   └── adminController.js            # 🛡️ Gestion admin (v3.0 - NOUVEAU)
│   │
│   ├── 📂 routes/                        # 🛣️ Routes API
│   │   ├── index.js                      # Routes centralisées (v3.0)
│   │   ├── auth.js                       # Routes auth (v3.0 - Upload photo)
│   │   ├── users.js                      # Routes users
│   │   ├── messages.js                   # Routes messages
│   │   └── admin.js                      # Routes admin (v3.0 - NOUVEAU)
│   │
│   ├── 📂 middleware/                    # 🔧 Middleware
│   │   ├── auth.js                       # Authentification JWT
│   │   ├── validation.js                 # Validation données (v3.0 - Étendue)
│   │   ├── errorHandler.js               # Gestion erreurs
│   │   └── rateLimiter.js                # Limitation de requêtes
│   │
│   ├── 📂 services/                      # 🔨 Services métier
│   │   ├── imageService.js               # Traitement images (messages)
│   │   ├── profilePhotoService.js        # Traitement photos profil (v3.0 - NOUVEAU)
│   │   ├── socketService.js              # Gestion Socket.io
│   │   └── cleanupService.js             # Nettoyage automatique
│   │
│   ├── 📂 utils/                         # 🛠️ Utilitaires
│   │   ├── logger.js                     # Système de logs
│   │   ├── helpers.js                    # Fonctions utiles
│   │   └── constants.js                  # Constantes (v3.0 - Étendues)
│   │
│   └── 📂 database/                      # 🗄️ Scripts SQL
│       ├── init.sql                      # Initialisation DB
│       ├── seed.sql                      # Données de test
│       └── migration_profiles.sql        # Migration profils (v3.0 - NOUVEAU)
│
└── 📂 frontend/                          # 🎨 Application web
    ├── 📄 index.html                     # Page d'accueil (redirection)
    ├── 📄 login.html                     # Page de connexion
    ├── 📄 register.html                  # Page d'inscription (v3.0 - Multi-étapes)
    ├── 📄 pending.html                   # Page d'attente validation (v3.0 - NOUVEAU)
    ├── 📄 dashboard.html                 # Interface messagerie
    ├── 📄 admin.html                     # Panneau admin (v3.0 - NOUVEAU)
    │
    ├── 📂 css/                           # 🎨 Styles
    │   ├── reset.css                     # Reset CSS
    │   ├── variables.css                 # Variables globales
    │   ├── global.css                    # Styles globaux
    │   ├── components.css                # Composants réutilisables
    │   ├── auth.css                      # Pages authentification
    │   └── dashboard.css                 # Interface messagerie
    │
    ├── 📂 js/                            # ⚙️ JavaScript
    │   ├── config.js                     # Configuration
    │   ├── api.js                        # ⭐ Client API REST
    │   ├── socket.js                     # ⭐ Client Socket.io
    │   ├── auth.js                       # Authentification
    │   ├── storage.js                    # Gestion localStorage
    │   ├── app.js                        # ⭐ Point d'entrée app
    │   │
    │   ├── 📂 ui/                        # 🖼️ Composants UI
    │   │   ├── messageRenderer.js        # ⭐ Rendu messages
    │   │   ├── conversationList.js       # ⭐ Liste conversations
    │   │   └── notifications.js          # ⭐ Notifications
    │   │
    │   ├── 📂 services/                  # 🔨 Services frontend
    │   │   ├── imageHandler.js           # ⭐ Gestion images
    │   │   └── expirationManager.js      # ⭐ Gestion expiration
    │   │
    │   └── 📂 utils/                     # 🛠️ Utilitaires (optionnel)
    │       ├── helpers.js                # Fonctions utiles
    │       └── validation.js             # Validation formulaires
    │
    ├── 📂 images/                        # 🖼️ Ressources
    │   ├── logo.svg                      # Logo application
    │   └── 📂 icons/                     # Icônes
    │       ├── send.svg                  # Icône envoyer
    │       ├── message.svg               # Icône message
    │       └── user.svg                  # Icône utilisateur
    │
    └── 📂 docs/                          # 📚 Documentation
        ├── API.md                        # ⭐ Documentation API complète
        ├── GUIDE.md                      # ⭐ Guide utilisateur
        └── completion_summary.md         # Récapitulatif fichiers
```

---

## 📊 Statistiques du Projet

### Backend (v3.0)
- **Fichiers totaux** : ~30 fichiers
- **Lignes de code** : ~8,000 lignes
- **Modèles** : 2 (User, Message)
- **Controllers** : 4 (Auth, User, Message, Admin)
- **Routes** : 4 groupes (Auth, Users, Messages, Admin)
- **Services** : 4 (Image, ProfilePhoto, Socket, Cleanup)
- **Middleware** : 4 (Auth, Validation, Error, RateLimit)

### Frontend (v3.0)
- **Pages HTML** : 6 pages
- **Fichiers CSS** : 6 fichiers
- **Fichiers JS** : 13 fichiers
- **Services** : 2 (ImageHandler, ExpirationManager)
- **Composants UI** : 3 (MessageRenderer, ConversationList, Notifications)

### Documentation
- **Guides** : 3 (README, README_PROFILS, Quick Start)
- **API Docs** : 1 (API.md - complète)
- **Guide utilisateur** : 1 (GUIDE.md)

---

## 🆕 Nouveautés Version 3.0 (Profils Étendus)

### Backend
```
backend/
├── controllers/
│   └── adminController.js              ✨ NOUVEAU - Gestion admin
├── services/
│   └── profilePhotoService.js          ✨ NOUVEAU - Traitement photos
├── routes/
│   └── admin.js                        ✨ NOUVEAU - Routes admin
├── database/
│   └── migration_profiles.sql          ✨ NOUVEAU - Migration DB
├── models/
│   └── User.js                         🔄 ÉTENDU - Profils enrichis
├── middleware/
│   └── validation.js                   🔄 ÉTENDU - Validation profils
├── config/
│   └── multer.js                       🔄 ÉTENDU - Upload photos
└── utils/
    └── constants.js                    🔄 ÉTENDU - Nouvelles constantes
```

### Frontend
```
frontend/
├── register.html                       ✨ NOUVEAU - Inscription multi-étapes
├── pending.html                        ✨ NOUVEAU - Attente validation
└── admin.html                          ✨ NOUVEAU - Panneau admin

🔑 Fichiers Clés

Backend

server.js - Point d'entrée, configuration Express + Socket.io
models/User.js - Modèle utilisateur avec profils étendus
controllers/adminController.js - Validation des profils
services/profilePhotoService.js - Traitement photos de profil
database/migration_profiles.sql - Migration base de données

Frontend

js/app.js - Point d'entrée application
js/api.js - Client HTTP pour l'API
js/socket.js - Client WebSocket
register.html - Inscription en 3 étapes
admin.html - Panneau de validation admin

Documentation

README.md - Documentation principale
README_PROFILS.md - Documentation profils étendus
docs/API.md - Référence API complète
quick_start_guide.md - Installation rapide


🎯 Points d'Entrée

Backend

# Démarrage serveur
npm run dev          # → backend/server.js
```

### Frontend
```
# Accès web
http://localhost:3000/              → index.html (redirection)
http://localhost:3000/login.html    → Page de connexion
http://localhost:3000/register.html → Inscription (3 étapes)
http://localhost:3000/pending.html  → Attente validation
http://localhost:3000/dashboard.html → Interface messagerie
http://localhost:3000/admin.html    → Panneau admin
```

---

## 📦 Dépendances Principales

### Backend
- **express** ^4.18.2 - Framework web
- **sequelize** ^6.35.2 - ORM PostgreSQL
- **bcryptjs** ^2.4.3 - Hashage mots de passe
- **jsonwebtoken** ^9.0.2 - JWT authentification
- **socket.io** ^4.5.4 - WebSocket temps réel
- **multer** ^1.4.5 - Upload fichiers
- **sharp** ^0.33.1 - Traitement images
- **express-validator** ^7.0.1 - Validation
- **helmet** ^7.1.0 - Sécurité
- **express-rate-limit** ^7.1.5 - Rate limiting

### Frontend
- **Socket.io Client** 4.5.4 (CDN)
- Vanilla JavaScript (ES6+)
- CSS3 avec variables

---

## 🌟 Fonctionnalités

### Messagerie
- ✅ Messages texte en temps réel
- ✅ Partage d'images sécurisé
- ✅ Indicateur "en train d'écrire..."
- ✅ Notifications de nouveaux messages
- ✅ Marquer les messages comme lus

### Sécurité des Images
- ✅ Images rendues sur Canvas (non téléchargeables)
- ✅ Expiration automatique après 5 minutes de visualisation
- ✅ Filigrane invisible sur chaque image
- ✅ Protection contre clic droit et captures d'écran
- ✅ Nettoyage automatique des images expirées

### Authentification
- ✅ Inscription et connexion sécurisées
- ✅ JWT (JSON Web Tokens)
- ✅ Hashage des mots de passe avec bcrypt
- ✅ Rôles utilisateurs (admin/user)

### Performance
- ✅ WebSocket (Socket.io) pour temps réel
- ✅ Optimisation des images avec Sharp
- ✅ Rate limiting
- ✅ Compression des réponses

## 🔐 Sécurité

### Backend
✅ Hashage bcrypt (10 rounds)
✅ JWT avec expiration
✅ Validation Sequelize + express-validator
✅ Rate limiting
✅ Helmet headers
✅ CORS configuré
✅ Protection XSS
✅ Sanitization des données

### Frontend
✅ Validation formulaires
✅ Échappement HTML
✅ Protection images (Canvas)
✅ Désactivation clic droit
✅ Blocage captures d'écran

---

## 🚀 Flux d'Exécution

### Inscription (v3.0)
```
1. register.html (3 étapes)
   ↓
2. POST /api/auth/register (avec photo)
   ↓
3. Validation backend
   ↓
4. Création utilisateur (statut: pending)
   ↓
5. Redirection → pending.html
   ↓
6. Admin approuve via admin.html
   ↓
7. POST /api/admin/approve/:id
   ↓
8. Statut → approved
   ↓
9. Connexion autorisée
```

### Messagerie
```
1. login.html
   ↓
2. POST /api/auth/login
   ↓
3. Token JWT généré
   ↓
4. Redirection → dashboard.html
   ↓
5. app.js initialise
   ↓
6. Socket.io connecté
   ↓
7. Conversations chargées
   ↓
8. Envoi/Réception messages temps réel

📝 Convention de Nommage

Backend

Fichiers : camelCase (userController.js)
Classes : PascalCase (class UserController)
Fonctions : camelCase (async getAllUsers())
Variables : camelCase (const userId)
Constantes : UPPER_SNAKE_CASE (USER_ROLES)

Frontend

Fichiers : camelCase (messageRenderer.js)
Classes : PascalCase (class App)
Objets : PascalCase (const API, MessageRenderer)
Fonctions : camelCase (function loadMessages())
Variables : camelCase (let currentUser)

SQL

Tables : snake_case (users, messages)
Colonnes : camelCase (dateCreation, photoMimeType)
Vues : snake_case (profils_en_attente)
Fonctions : snake_case (valider_profil)

## 🤝 Contribution

Les contributions sont bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

MIT License - voir [LICENSE](LICENSE)

## 👥 Auteurs

- Jean-François Gagnon - [@JeffDok](https://github.com/Jeff-Dok)

## 🙏 Remerciements

- Anthropic (Claude AI)
- Communauté Open Source
- Tous les contributeurs

## 📞 Support

- 📧 Email: email@email.com
- 🐛 Issues: [GitHub Issues](https://github.com/Jeff-Dok/MessagerieApp/issues)
- 💬 Discord: [Lien Discord]

Version : 3.0.0
Date : 18 janvier 2026
Statut : ✅ Complet et documenté
Cette structure représente une application complète avec système de profils enrichis, validation administrative, et toutes les fonctionnalités de messagerie sécurisée.