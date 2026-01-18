# 🚀 MessagerieApp Backend

Backend Node.js optimisé avec Express, PostgreSQL et Socket.io pour messagerie en temps réel.

## 📋 Caractéristiques

- ✅ API REST complète
- ✅ WebSocket temps réel (Socket.io)
- ✅ Authentification JWT sécurisée
- ✅ Upload et traitement d'images
- ✅ Expiration automatique des images
- ✅ Rate limiting et sécurité
- ✅ Logging détaillé
- ✅ Documentation complète

## 🛠️ Stack Technique

- **Runtime**: Node.js v14+
- **Framework**: Express.js
- **Base de données**: PostgreSQL avec Sequelize ORM
- **Authentification**: JWT + Bcrypt
- **WebSocket**: Socket.io
- **Upload**: Multer
- **Images**: Sharp
- **Sécurité**: Helmet, CORS, Rate Limiting

## 📦 Installation
```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env

# Initialiser la base de données
npm run db:init

# Insérer les données de test
npm run db:seed

# Démarrer le serveur
npm run dev
```

## 🔌 Endpoints API

### Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/register` | Inscription | Public |
| POST | `/login` | Connexion | Public |
| GET | `/verify` | Vérifier token | Privé |
| POST | `/refresh` | Rafraîchir token | Privé |

### Utilisateurs (`/api/users`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste utilisateurs | Privé |
| GET | `/:id` | Détails utilisateur | Privé |
| GET | `/:id/stats` | Statistiques | Privé |
| PUT | `/:id` | Mettre à jour | Privé |
| DELETE | `/:id` | Supprimer | Admin |

### Messages (`/api/messages`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/` | Envoyer message texte | Privé |
| POST | `/image` | Envoyer image | Privé |
| GET | `/` | Tous les messages | Privé |
| GET | `/conversation/:userId` | Conversation | Privé |
| PUT | `/:id/read` | Marquer comme lu | Privé |
| PUT | `/:id/view` | Marquer image comme vue | Privé |
| POST | `/:id/expire` | Expirer image | Privé |
| DELETE | `/:id` | Supprimer message | Privé |

## 🔌 Socket.io Events

### Client → Serveur
```javascript
'user:connect'         // Connexion utilisateur
'conversation:join'    // Rejoindre conversation
'message:send'         // Envoyer message
'typing:start'         // Début saisie
'typing:stop'          // Fin saisie
```

### Serveur → Client
```javascript
'user:online'          // Statut utilisateur
'message:new'          // Nouveau message
'image:viewed'         // Image vue
'image:expired'        // Image expirée
'typing:start'         // Utilisateur tape
'typing:stop'          // Arrêt saisie
'notification:new_message' // Notification
```

## 📁 Structure
backend/
├── config/          # Configuration
├── controllers/     # Logique métier
├── models/          # Modèles Sequelize
├── routes/          # Routes Express
├── middleware/      # Middleware
├── services/        # Services
├── utils/           # Utilitaires
├── database/        # Scripts SQL
└── server.js        # Point d'entrée

## 🔒 Sécurité

- JWT avec expiration
- Bcrypt (10 rounds)
- Helmet headers
- CORS configuré
- Rate limiting
- Validation complète
- Sanitization
- SQL injection protection

## 🚀 Déploiement

### Heroku
```bash
heroku create
heroku addons:create heroku-postgresql
heroku config:set NODE_ENV=production
git push heroku main
```

### Docker
```bash
docker build -t messagerie-api .
docker run -p 5000:5000 messagerie-api
```

## 📊 Monitoring
```http
GET /health
```

Retourne le statut du serveur et de la DB.

## 🐛 Debugging

Activez les logs détaillés :
```env
NODE_ENV=development
LOG_LEVEL=debug
```

## 📝 Licence

MIT