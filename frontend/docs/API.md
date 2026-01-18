# 📚 Documentation API - MessagerieApp

> Documentation complète de l'API REST du backend MessagerieApp

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Authentification](#authentification)
- [Utilisateurs](#utilisateurs)
- [Messages](#messages)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Codes de statut](#codes-de-statut)

---

## 🌐 Vue d'ensemble

### URL de base

```
http://localhost:5000/api
```

### Format des réponses

Toutes les réponses sont au format JSON :

```json
{
  "success": true,
  "message": "Message de succès",
  "data": { }
}
```

### Headers requis

```http
Content-Type: application/json
Authorization: Bearer {token}  # Pour les routes protégées
```

---

## 🔐 Authentification

### POST /auth/register

Inscrit un nouvel utilisateur.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "nom": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "password": "motdepasse123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "user",
    "dateCreation": "2024-01-18T10:00:00.000Z"
  }
}
```

**Erreurs possibles:**
- `409 Conflict` - Email déjà utilisé
- `422 Unprocessable Entity` - Validation échouée

---

### POST /auth/login

Connecte un utilisateur existant.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "jean.dupont@example.com",
  "password": "motdepasse123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "user"
  }
}
```

**Erreurs possibles:**
- `401 Unauthorized` - Email ou mot de passe incorrect

---

### GET /auth/verify

Vérifie la validité du token JWT.

**Request:**
```http
GET /api/auth/verify
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "user"
  }
}
```

**Erreurs possibles:**
- `401 Unauthorized` - Token invalide ou expiré

---

### POST /auth/refresh

Rafraîchit le token JWT.

**Request:**
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "user"
  }
}
```

---

## 👥 Utilisateurs

### GET /users

Récupère la liste des utilisateurs avec pagination.

**Request:**
```http
GET /api/users?page=1&limit=20&search=jean
Authorization: Bearer {token}
```

**Paramètres de requête:**
- `page` (optionnel) - Numéro de page (défaut: 1)
- `limit` (optionnel) - Nombre d'éléments par page (défaut: 20, max: 100)
- `search` (optionnel) - Recherche par nom ou email

**Response (200):**
```json
{
  "success": true,
  "count": 50,
  "totalPages": 3,
  "currentPage": 1,
  "users": [
    {
      "id": 1,
      "nom": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "user",
      "dateCreation": "2024-01-18T10:00:00.000Z"
    }
  ]
}
```

---

### GET /users/:id

Récupère les détails d'un utilisateur spécifique.

**Request:**
```http
GET /api/users/1
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "nom": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "user",
    "dateCreation": "2024-01-18T10:00:00.000Z",
    "dateModification": "2024-01-18T15:30:00.000Z"
  }
}
```

**Erreurs possibles:**
- `404 Not Found` - Utilisateur non trouvé

---

### GET /users/:id/stats

Récupère les statistiques d'un utilisateur.

**Request:**
```http
GET /api/users/1/stats
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "messagesSent": 45,
    "messagesReceived": 38,
    "unreadCount": 3,
    "totalMessages": 83
  }
}
```

**Permissions:**
- L'utilisateur peut voir ses propres stats
- Les admins peuvent voir les stats de tous les utilisateurs

---

### PUT /users/:id

Met à jour un utilisateur.

**Request:**
```http
PUT /api/users/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Jean Dupont Modifié",
  "email": "nouveau.email@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil mis à jour",
  "user": {
    "id": 1,
    "nom": "Jean Dupont Modifié",
    "email": "nouveau.email@example.com",
    "role": "user"
  }
}
```

**Permissions:**
- L'utilisateur peut modifier son propre profil
- Les admins peuvent modifier tous les profils

**Erreurs possibles:**
- `403 Forbidden` - Pas les permissions
- `409 Conflict` - Email déjà utilisé

---

### DELETE /users/:id

Supprime un utilisateur (admin uniquement).

**Request:**
```http
DELETE /api/users/1
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur supprimé"
}
```

**Permissions:**
- Admin uniquement

---

## 💬 Messages

### POST /messages

Envoie un message texte.

**Request:**
```http
POST /api/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "receiverId": 2,
  "content": "Salut ! Comment vas-tu ?"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message envoyé",
  "data": {
    "id": 15,
    "senderId": 1,
    "receiverId": 2,
    "content": "Salut ! Comment vas-tu ?",
    "messageType": "text",
    "read": false,
    "date": "2024-01-18T14:30:00.000Z",
    "sender": {
      "id": 1,
      "nom": "Jean Dupont",
      "email": "jean.dupont@example.com"
    },
    "receiver": {
      "id": 2,
      "nom": "Marie Martin",
      "email": "marie.martin@example.com"
    }
  }
}
```

**Validation:**
- `content` : requis, max 5000 caractères
- `receiverId` : requis, doit être un ID valide

---

### POST /messages/image

Envoie une image.

**Request:**
```http
POST /api/messages/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

receiverId: 2
image: [fichier image]
```

**Response (201):**
```json
{
  "success": true,
  "message": "Image envoyée",
  "data": {
    "id": 16,
    "senderId": 1,
    "receiverId": 2,
    "content": "[Image]",
    "messageType": "image",
    "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "imageMimeType": "image/jpeg",
    "imageFileName": "photo.jpg",
    "imageViewedAt": null,
    "imageExpiresAt": null,
    "imageExpired": false,
    "read": false,
    "date": "2024-01-18T14:35:00.000Z"
  }
}
```

**Validation:**
- Types acceptés : JPEG, PNG, GIF, WebP
- Taille maximale : 5 MB
- Redimensionnement automatique : max 800x800 pixels

**Erreurs possibles:**
- `400 Bad Request` - Fichier invalide ou trop volumineux

---

### GET /messages

Récupère tous les messages de l'utilisateur.

**Request:**
```http
GET /api/messages
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "count": 45,
  "messages": [
    {
      "id": 15,
      "senderId": 1,
      "receiverId": 2,
      "content": "Salut !",
      "messageType": "text",
      "read": false,
      "date": "2024-01-18T14:30:00.000Z",
      "sender": { ... },
      "receiver": { ... }
    }
  ]
}
```

---

### GET /messages/conversation/:userId

Récupère les messages d'une conversation spécifique.

**Request:**
```http
GET /api/messages/conversation/2
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "count": 12,
  "messages": [
    {
      "id": 10,
      "senderId": 1,
      "receiverId": 2,
      "content": "Premier message",
      "messageType": "text",
      "read": true,
      "date": "2024-01-18T10:00:00.000Z"
    },
    {
      "id": 11,
      "senderId": 2,
      "receiverId": 1,
      "content": "Réponse",
      "messageType": "text",
      "read": true,
      "date": "2024-01-18T10:05:00.000Z"
    }
  ]
}
```

---

### PUT /messages/:id/read

Marque un message comme lu.

**Request:**
```http
PUT /api/messages/15/read
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message marqué comme lu"
}
```

**Permissions:**
- Seul le destinataire peut marquer comme lu

---

### PUT /messages/:id/view

Marque une image comme vue et démarre le timer d'expiration (5 minutes).

**Request:**
```http
PUT /api/messages/16/view
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image marquée comme vue",
  "viewedAt": "2024-01-18T14:40:00.000Z",
  "expiresAt": "2024-01-18T14:45:00.000Z"
}
```

**Comportement:**
- Première vue uniquement (ignoré si déjà vue)
- Démarre un timer de 5 minutes
- Notification Socket.io envoyée

**Erreurs possibles:**
- `400 Bad Request` - Le message n'est pas une image

---

### POST /messages/:id/expire

Fait expirer une image manuellement.

**Request:**
```http
POST /api/messages/16/expire
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Image expirée"
}
```

**Comportement:**
- Supprime les données d'image
- Marque comme expirée
- Notification Socket.io envoyée

---

### DELETE /messages/:id

Supprime un message.

**Request:**
```http
DELETE /api/messages/15
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message supprimé"
}
```

**Permissions:**
- L'expéditeur peut supprimer ses propres messages
- Les admins peuvent supprimer tous les messages

---

## ⚠️ Gestion des erreurs

### Format de réponse d'erreur

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [
    {
      "field": "email",
      "message": "Format d'email invalide",
      "type": "validation"
    }
  ]
}
```

### Erreurs de validation

```json
{
  "success": false,
  "message": "Erreurs de validation",
  "errors": [
    {
      "field": "password",
      "message": "Le mot de passe doit contenir au moins 6 caractères",
      "value": "123"
    }
  ]
}
```

---

## 📊 Codes de statut

| Code | Signification | Usage |
|------|---------------|-------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée |
| 204 | No Content | Suppression réussie |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Non authentifié |
| 403 | Forbidden | Pas les permissions |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Conflit (email existant) |
| 422 | Unprocessable Entity | Validation échouée |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Server Error | Erreur serveur |
| 503 | Service Unavailable | Service indisponible |

---

## 🔌 WebSocket (Socket.io)

### Connexion

```javascript
const socket = io('http://localhost:5000');
```

### Événements émis par le client

| Événement | Données | Description |
|-----------|---------|-------------|
| `user:connect` | `userId` | Enregistre l'utilisateur |
| `conversation:join` | `{userId1, userId2}` | Rejoint une room |
| `message:send` | `message` | Envoie un message |
| `typing:start` | `{userId1, userId2}` | Début de saisie |
| `typing:stop` | `{userId1, userId2}` | Fin de saisie |

### Événements reçus par le client

| Événement | Données | Description |
|-----------|---------|-------------|
| `user:online` | `{userId, online}` | Statut utilisateur |
| `message:new` | `message` | Nouveau message |
| `image:viewed` | `{messageId, viewedAt, expiresAt}` | Image vue |
| `image:expired` | `{messageId}` | Image expirée |
| `typing:start` | `{userId1, userId2}` | Utilisateur tape |
| `typing:stop` | `{userId1, userId2}` | Arrêt de saisie |
| `notification:new_message` | `{senderId, senderName, preview}` | Notification |

---

## 🛡️ Sécurité

### Rate Limiting

- **Authentification** : 5 requêtes / 15 minutes
- **Upload d'images** : 10 images / minute
- **API générale** : 100 requêtes / 15 minutes

### JWT

- **Expiration** : 24 heures
- **Algorithme** : HS256
- **Refresh** : Disponible via `/auth/refresh`

### Validation

- Tous les inputs sont validés et sanitizés
- Protection contre XSS
- Protection contre injection SQL (Sequelize)
- CORS configuré

---

## 📞 Support

Pour toute question sur l'API :
- **Email** : support@messagerie-app.com
- **Documentation** : https://github.com/votre-username/messagerie-app
- **Issues** : https://github.com/votre-username/messagerie-app/issues

---

**Version** : 2.0.0  
**Dernière mise à jour** : 18 janvier 2026