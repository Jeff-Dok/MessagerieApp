# 📡 MessagerieApp - Documentation API

## Vue d'ensemble

API REST pour l'application de messagerie sécurisée avec support Socket.io pour temps réel.

- **URL de base:** `http://localhost:5000/api`
- **Version:** 3.1.0
- **Format:** JSON
- **Authentification:** JWT (Bearer Token)

---

## 🔐 Authentification

### POST /auth/register
Inscription d'un nouvel utilisateur avec profil complet.

**Multipart/form-data requis** (pour la photo de profil)

**Champs:**
```json
{
  "nom": "string (2-100 caractères) - REQUIS",
  "pseudo": "string (3-50 caractères, alphanumérique + _ -) - REQUIS",
  "email": "string (format email valide) - REQUIS",
  "password": "string (min 6 caractères) - REQUIS",
  "dateNaissance": "date (format YYYY-MM-DD, 13+ ans) - REQUIS",
  "ville": "string (2-100 caractères) - REQUIS",
  "bio": "string (max 500 caractères) - OPTIONNEL",
  "photoProfil": "file (image, max 5MB) - OPTIONNEL"
}
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Inscription réussie, votre profil est en attente de validation",
  "user": {
    "id": 1,
    "pseudo": "john_doe",
    "email": "john@example.com",
    "statut": "pending"
  },
  "needsApproval": true
}
```

**Erreurs possibles:**
- `409 Conflict` - Email ou pseudo déjà utilisé
- `422 Unprocessable Entity` - Validation échouée

---

### POST /auth/login
Connexion utilisateur.

**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nom": "John Doe",
    "pseudo": "john_doe",
    "email": "john@example.com",
    "ville": "Montréal",
    "age": 25,
    "role": "user",
    "statut": "approved"
  }
}
```

**Erreurs possibles:**
- `401 Unauthorized` - Identifiants invalides
- `403 Forbidden` - Compte en attente ou rejeté

---

### GET /auth/verify
Vérifie la validité du token JWT.

**Headers:**
```
Authorization: Bearer {token}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

---

### POST /auth/refresh
Rafraîchit le token JWT.

**Headers:**
```
Authorization: Bearer {token}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { /* user object */ }
}
```

---

### POST /auth/check-status
Vérifie le statut de validation d'un profil.

**Body (JSON):**
```json
{
  "email": "john@example.com"
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "statut": "pending",
  "pseudo": "john_doe",
  "email": "john@example.com",
  "dateValidation": null,
  "raisonRejet": null
}
```

---

## 👥 Utilisateurs

### GET /users
Récupère la liste des utilisateurs.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (number, default: 1) - Numéro de page
- `limit` (number, default: 20, max: 100) - Nombre par page
- `search` (string) - Recherche dans nom/email/pseudo

**Réponse (200 OK):**
```json
{
  "success": true,
  "count": 42,
  "totalPages": 3,
  "currentPage": 1,
  "users": [
    {
      "id": 1,
      "nom": "John Doe",
      "pseudo": "john_doe",
      "email": "john@example.com",
      "ville": "Montréal",
      "age": 25,
      "role": "user",
      "statut": "approved"
    }
  ]
}
```

---

### GET /users/:id
Récupère un utilisateur par ID.

**Réponse (200 OK):**
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

---

### PUT /users/:id
Met à jour un utilisateur.

**Permissions:** Propriétaire ou Admin uniquement

**Body (JSON):**
```json
{
  "nom": "John Updated",
  "ville": "Québec",
  "bio": "Nouvelle bio..."
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Profil mis à jour",
  "user": { /* updated user */ }
}
```

---

### DELETE /users/:id
Supprime un utilisateur.

**Permissions:** Admin uniquement

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Utilisateur supprimé"
}
```

---

### GET /users/:id/stats
Récupère les statistiques d'un utilisateur.

**Réponse (200 OK):**
```json
{
  "success": true,
  "stats": {
    "messagesSent": 142,
    "messagesReceived": 238,
    "unreadCount": 5,
    "totalMessages": 380
  }
}
```

---

## 💬 Messages

### POST /messages
Envoie un message texte.

**Body (JSON):**
```json
{
  "receiverId": 2,
  "content": "Salut, comment vas-tu ?"
}
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Message envoyé",
  "data": {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "content": "Salut, comment vas-tu ?",
    "messageType": "text",
    "read": false,
    "date": "2026-01-21T10:30:00.000Z",
    "sender": {
      "id": 1,
      "nom": "John Doe",
      "email": "john@example.com"
    },
    "receiver": {
      "id": 2,
      "nom": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

---

### POST /messages/image
Envoie une image.

**Multipart/form-data:**
```
receiverId: 2
image: [fichier image, max 5MB]
```

**Formats acceptés:** JPEG, PNG, GIF, WebP

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Image envoyée",
  "data": {
    "id": 2,
    "senderId": 1,
    "receiverId": 2,
    "content": "[Image]",
    "messageType": "image",
    "imageData": "data:image/jpeg;base64,...",
    "imageMimeType": "image/jpeg",
    "imageFileName": "photo.jpg",
    "imageExpired": false,
    "read": false,
    "date": "2026-01-21T10:35:00.000Z"
  }
}
```

---

### GET /messages
Récupère tous les messages de l'utilisateur.

**Réponse (200 OK):**
```json
{
  "success": true,
  "count": 25,
  "messages": [ /* array of messages */ ]
}
```

---

### GET /messages/conversation/:userId
Récupère les messages d'une conversation.

**Réponse (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "messages": [ /* messages de la conversation */ ]
}
```

---

### PUT /messages/:id/read
Marque un message comme lu.

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Message marqué comme lu"
}
```

---

### PUT /messages/:id/view
Marque une image comme vue (démarre l'expiration de 5 minutes).

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Image marquée comme vue",
  "viewedAt": "2026-01-21T10:40:00.000Z",
  "expiresAt": "2026-01-21T10:45:00.000Z"
}
```

---

### POST /messages/:id/expire
Fait expirer une image manuellement.

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Image expirée"
}
```

---

### DELETE /messages/:id
Supprime un message.

**Permissions:** Expéditeur ou Admin

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Message supprimé"
}
```

---

## 👑 Administration

### GET /admin/pending-profiles
Récupère les profils en attente de validation.

**Permissions:** Admin uniquement

**Réponse (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "profiles": [
    {
      "id": 3,
      "nom": "Alice Martin",
      "pseudo": "alice_m",
      "email": "alice@example.com",
      "ville": "Paris",
      "age": 28,
      "bio": "Passionnée de photographie",
      "photoProfil": "data:image/jpeg;base64,...",
      "dateCreation": "2026-01-20T15:30:00.000Z",
      "statut": "pending"
    }
  ]
}
```

---

### GET /admin/pending-count
Compte les profils en attente.

**Réponse (200 OK):**
```json
{
  "success": true,
  "count": 5
}
```

---

### GET /admin/profile/:id
Récupère les détails d'un profil.

**Réponse (200 OK):**
```json
{
  "success": true,
  "profile": { /* profil complet avec infos admin */ }
}
```

---

### POST /admin/approve/:id
Approuve un profil utilisateur.

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Profil approuvé avec succès",
  "profile": {
    "id": 3,
    "statut": "approved",
    "dateValidation": "2026-01-21T11:00:00.000Z"
  }
}
```

---

### POST /admin/reject/:id
Rejette un profil utilisateur.

**Body (JSON):**
```json
{
  "raison": "Photo de profil inappropriée (min 10 caractères)"
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Profil rejeté",
  "profile": {
    "id": 3,
    "statut": "rejected",
    "dateValidation": "2026-01-21T11:05:00.000Z",
    "raisonRejet": "Photo de profil inappropriée"
  }
}
```

---

### POST /admin/approve-bulk
Approuve plusieurs profils en masse.

**Body (JSON):**
```json
{
  "userIds": [3, 4, 5, 6]
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "approved": 3,
  "failed": 1,
  "results": {
    "approved": [3, 4, 5],
    "failed": [6]
  }
}
```

---

### GET /admin/stats
Récupère les statistiques administrateur.

**Réponse (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 142,
    "pending": 5,
    "approved": 135,
    "rejected": 2,
    "recentApprovals": 8
  }
}
```

---

### GET /admin/search
Recherche des utilisateurs par critères.

**Query Parameters:**
- `query` (string) - Recherche textuelle
- `statut` (string) - Filtre par statut (pending/approved/rejected)
- `ville` (string) - Filtre par ville
- `page` (number) - Pagination
- `limit` (number) - Limite

**Réponse (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "totalPages": 2,
  "currentPage": 1,
  "users": [ /* résultats de recherche */ ]
}
```

---

## 🔌 Socket.io Events

### Événements Client → Serveur

#### `user:connect`
Se connecter au système Socket.io.
```javascript
socket.emit('user:connect', userId);
```

#### `conversation:join`
Rejoindre une conversation.
```javascript
socket.emit('conversation:join', {
  userId1: 1,
  userId2: 2
});
```

#### `message:send`
Envoyer un message via Socket.io (en plus de l'API).
```javascript
socket.emit('message:send', {
  senderId: 1,
  receiverId: 2,
  content: "Message...",
  messageType: "text"
});
```

#### `typing:start`
Indiquer qu'on commence à écrire.
```javascript
socket.emit('typing:start', {
  userId1: 1,
  userId2: 2
});
```

#### `typing:stop`
Indiquer qu'on arrête d'écrire.
```javascript
socket.emit('typing:stop', {
  userId1: 1,
  userId2: 2
});
```

---

### Événements Serveur → Client

#### `message:new`
Nouveau message reçu.
```javascript
socket.on('message:new', (message) => {
  console.log('Nouveau message:', message);
});
```

#### `user:online`
Statut utilisateur en ligne/hors ligne.
```javascript
socket.on('user:online', (data) => {
  // data: { userId, online: true/false }
});
```

#### `image:viewed`
Image vue par le destinataire.
```javascript
socket.on('image:viewed', (data) => {
  // data: { messageId, viewedAt, expiresAt }
});
```

#### `image:expired`
Image expirée.
```javascript
socket.on('image:expired', (data) => {
  // data: { messageId }
});
```

#### `typing:start` / `typing:stop`
Indicateur de saisie.
```javascript
socket.on('typing:start', (data) => {
  // Afficher "... est en train d'écrire"
});
```

#### `notification:new_message`
Notification de nouveau message.
```javascript
socket.on('notification:new_message', (data) => {
  // data: { senderId, senderName, preview }
});
```

#### `profile:validated` / `profile:rejected`
Notification de validation/rejet de profil.
```javascript
socket.on('profile:validated', (data) => {
  // data: { userId, statut, message }
});
```

---

## 📋 Codes d'Erreur

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Non authentifié |
| 403 | Forbidden | Accès refusé |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict | Conflit (email/pseudo existant) |
| 422 | Unprocessable Entity | Validation échouée |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Server Error | Erreur serveur |

---

## 🔒 Rate Limiting

- **API générale:** 100 requêtes / 15 minutes par IP
- **Authentification:** 5 tentatives / 15 minutes
- **Upload d'images:** 10 images / minute

---

## 📝 Notes Importantes

1. **Tous les endpoints (sauf auth) nécessitent un token JWT** dans le header `Authorization: Bearer {token}`
2. **Les images sont stockées en Base64** dans la base de données (limitations de taille)
3. **L'expiration des images est de 5 minutes** après la première visualisation
4. **Les profils doivent être approuvés** par un admin avant de pouvoir se connecter
5. **Socket.io utilise le même port** que l'API REST (5000 par défaut)

---

## 🧪 Exemples d'Utilisation

### Exemple JavaScript (Fetch API)

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.token);
    return data.user;
  }
  
  throw new Error(data.message);
};

// Envoyer un message
const sendMessage = async (receiverId, content) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:5000/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ receiverId, content })
  });
  
  return await response.json();
};
```

---

## 🆘 Support

Pour toute question ou problème:
- **GitHub Issues:** [github.com/Jeff-Dok/MessagerieApp/issues](https://github.com/Jeff-Dok/MessagerieApp/issues)
- **Email:** jn.francois.gagnon@gmail.com

---

*Derniere mise a jour: 2026-01-22*
