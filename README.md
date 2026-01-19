# 💬 MessagerieApp - Application de Messagerie Sécurisée

Application web complète de messagerie en temps réel avec partage d'images sécurisé et expiration automatique.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

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

## 🏗️ Architecture
messagerie-app/
│
├── backend/                # Serveur Node.js + Express
│   ├── config/             # Configuration (DB, JWT, Multer)
│   ├── controllers/        # Logique métier
│   ├── models/             # Modèles Sequelize
│   ├── routes/             # Routes Express
│   ├── middleware/         # Middleware
│   ├── services/           # Services (Image, Socket, Cleanup)
│   ├── utils/              # Utilitaires
│   └── server.js           # Point d'entrée
│
└── frontend/           # Application web
├── css/                # Styles
├── js/                 # JavaScript
├── images/             # Ressources
└── *.html              # Pages HTML

## 🚀 Installation Rapide

### Prérequis

- Node.js >= 14.0.0
- PostgreSQL >= 12.0
- npm >= 6.0.0

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/Jeff-Dok/MessagerieApp.git
cd messagerie-app
```

2. **Installer les dépendances du projet**
```bash
npm install
```

3. **Configurer le backend**
```bash
cd backend
cp .env.example .env
# Éditer .env avec vos configurations
```

4. **Initialiser la base de données**
```bash
npm run db:init
npm run db:seed
```

5. **Démarrer le backend**
```bash
npm run dev
```

6. **Ouvrir le frontend**
```bash
# Ouvrir frontend/index.html dans votre navigateur
# Ou utiliser un serveur local comme Live Server
```

## 🔧 Configuration

### Backend (.env)
```env
# Serveur
PORT=5000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=messagerie_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=changez_moi_en_production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000

# Images
IMAGE_EXPIRATION_TIME=5
```

### Frontend

Modifier `frontend/js/config.js` :
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

## 📚 Documentation

- [Documentation Backend](./backend/README.md)
- [Documentation API](./docs/API.md)
- [Documentation Profils](./docs/PROFILS.md)
- [Guide Utilisateur](./docs/GUIDE.md)

## 🎮 Utilisation

### Comptes de démonstration

Admin: Email: admin@example.com Mot de passe: admin123
Utilisateur 1: Email: user1@example.com Mot de passe: user123
Utilisateur 2: Email: user2@example.com Mot de passe: user123

### Fonctionnalités principales

1. **Connexion** - Se connecter avec un compte
2. **Sélectionner un contact** - Cliquer sur un utilisateur
3. **Envoyer un message** - Taper et envoyer
4. **Partager une image** - Cliquer sur 📷
5. **Voir l'expiration** - Timer visible après ouverture de l'image

## 🛠️ Scripts Disponibles

### Racine du projet
```bash
npm install              # Installer toutes les dépendances
npm run install:all      # Installer backend + frontend
npm start                # Démarrer le backend
npm run dev              # Mode développement
```

### Backend
```bash
cd backend
npm start                # Mode production
npm run dev              # Mode développement
npm run db:init          # Initialiser la DB
npm run db:seed          # Données de test
npm run db:reset         # Reset complet
```

## 🔒 Sécurité

### Mesures implémentées

- Authentification JWT
- Hashage bcrypt (10 rounds)
- Protection CORS
- Rate limiting
- Validation des données
- Protection XSS
- Protection CSRF
- Headers de sécurité (Helmet)

### Sécurité des images

- Canvas rendering (non téléchargeable)
- Expiration automatique (5 min)
- Filigrane invisible
- Désactivation clic droit
- Protection raccourcis clavier

## 🚀 Déploiement

### Backend (Heroku)
```bash
cd backend
heroku create messagerie-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
git push heroku main
```

### Frontend (Netlify/Vercel)
```bash
cd frontend
# Déployer via interface Netlify/Vercel
```

## 📊 Technologies

### Backend
- Node.js + Express
- PostgreSQL + Sequelize
- Socket.io
- JWT + Bcrypt
- Sharp (traitement images)
- Multer (upload)

### Frontend
- HTML5 + CSS3
- JavaScript ES6+
- Socket.io Client
- Fetch API

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