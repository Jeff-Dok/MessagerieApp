# 👤 Système de Profils Étendus - MessagerieApp

> Documentation complète du système d'inscription avec profils enrichis et validation administrative

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [API Reference](#api-reference)
- [Sécurité](#sécurité)

---

## 🌟 Vue d'ensemble

Le système de profils étendus permet aux utilisateurs de créer des profils complets lors de l'inscription, avec validation obligatoire par un administrateur avant accès à l'application.

### Nouveautés v3.0.0

✅ **Profils enrichis** avec pseudo, date de naissance, ville, bio et photo  
✅ **Système de validation** par administrateur (pending/approved/rejected)  
✅ **Upload de photos** de profil (max 5 MB)  
✅ **Panneau admin** pour gérer les validations  
✅ **Notifications temps réel** via Socket.io  
✅ **Restriction d'âge** (18 ans minimum - COPPA compliance)

---

## ✨ Fonctionnalités

### Pour les utilisateurs

#### 1. Inscription en 3 étapes

**Étape 1 : Informations de base**
- Nom complet
- Pseudo (unique, 3-50 caractères, alphanumériques + _ -)
- Email (unique)
- Mot de passe (6+ caractères)

**Étape 2 : Informations personnelles**
- Date de naissance (18+ ans requis)
- Ville de résidence
- Bio (optionnelle, max 500 caractères)

**Étape 3 : Photo de profil**
- Upload optionnel
- Formats acceptés : JPG, PNG, GIF, WebP
- Taille max : 5 MB
- Redimensionnement automatique : 400x400px

#### 2. Statuts de profil

| Statut | Description | Actions disponibles |
|--------|-------------|---------------------|
| **Pending** | En attente de validation | Vérifier le statut |
| **Approved** | Profil validé | Connexion autorisée |
| **Rejected** | Profil rejeté | Voir la raison, créer nouveau compte |

#### 3. Vérification du statut

Les utilisateurs peuvent vérifier le statut de leur profil depuis la page "en attente" :
- Statut en temps réel
- Raison du rejet si applicable
- Notification par email (optionnel)

### Pour les administrateurs

#### 1. Panneau d'administration

Accessible via `/admin.html` (réservé aux administrateurs)

**Statistiques en temps réel :**
- Profils en attente
- Profils approuvés
- Profils rejetés
- Total utilisateurs

#### 2. Gestion des profils

**Actions disponibles :**
- ✅ **Approuver** un profil en un clic
- ❌ **Rejeter** un profil avec raison obligatoire
- 👁️ **Visualiser** tous les détails du profil
- 🔄 **Actualisation** automatique toutes les 30 secondes

**Informations affichées :**
- Photo de profil
- Pseudo et nom complet
- Email
- Âge calculé
- Ville
- Bio
- Date d'inscription

#### 3. Raisons de rejet prédéfinies

Le système propose des raisons courantes :
- Photo de profil inappropriée
- Description inappropriée
- Profil suspect ou faux
- Âge insuffisant
- Contenu spam/publicitaire
- Compte en double
- Pseudo offensant
- Autre (avec détails)

---

## 🏗️ Architecture

### Base de données

**Nouveaux champs dans la table `users` :**

```sql
-- Profil étendu
pseudo VARCHAR(50) UNIQUE NOT NULL
date_naissance DATE NOT NULL
ville VARCHAR(100) NOT NULL
bio TEXT (max 500 caractères)

-- Photo de profil
photo_profil TEXT (Base64)
photo_mime_type VARCHAR(50)

-- Système de validation
statut VARCHAR(20) DEFAULT 'pending' -- pending, approved, rejected
date_validation TIMESTAMP
validateur_id INTEGER REFERENCES users(id)
raison_rejet TEXT
```

### Backend

**Nouveaux modules :**

```
backend/
├── controllers/
│   └── adminController.js        # Gestion admin
├── services/
│   └── profilePhotoService.js    # Traitement photos
├── routes/
│   └── admin.js                  # Routes admin
└── utils/
    └── constants.js              # USER_STATUS, PROFILE_PHOTO_CONFIG
```

### Frontend

**Nouvelles pages :**

```
frontend/
├── register.html     # Inscription multi-étapes
├── pending.html      # Page d'attente
└── admin.html        # Panneau admin
```

---

## 🚀 Installation

### 1. Exécuter la migration

```bash
cd backend
psql -U postgres -d messagerie_db -f database/migration_profiles.sql
```

### 2. Installer les dépendances

Les dépendances existantes suffisent (sharp, multer déjà présents).

### 3. Variables d'environnement

Aucune nouvelle variable requise. Le système utilise les configs existantes.

### 4. Redémarrer le serveur

```bash
npm run dev
```

---

## 📖 Utilisation

### Pour les utilisateurs

#### 1. S'inscrire

```
1. Accéder à /register.html
2. Remplir les 3 étapes
3. Soumettre le formulaire
4. Redirection vers /pending.html
```

#### 2. Vérifier le statut

```javascript
// Depuis pending.html
await fetch('/api/auth/check-status', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com' })
});
```

#### 3. Se connecter

```
1. Une fois approuvé, se connecter normalement
2. Si rejeté, voir la raison et créer un nouveau compte
3. Si pending, attendre la validation
```

### Pour les administrateurs

#### 1. Accéder au panneau

```
1. Se connecter avec un compte admin
2. Accéder à /admin.html
3. Voir les profils en attente
```

#### 2. Approuver un profil

```javascript
// Un clic sur "Approuver"
await API._request('/admin/approve/{userId}', {
  method: 'POST'
});
```

#### 3. Rejeter un profil

```javascript
// Fournir une raison (min 10 caractères)
await API._request('/admin/reject/{userId}', {
  method: 'POST',
  body: { raison: 'Photo de profil inappropriée' }
});
```

---

## 🔌 API Reference

### Routes d'authentification

#### POST `/api/auth/register`

Inscription avec profil complet.

**Body (multipart/form-data) :**
```javascript
{
  nom: "Jean Dupont",
  pseudo: "jean_dupont",
  email: "jean@example.com",
  password: "securepass123",
  dateNaissance: "1995-06-15",
  ville: "Montréal",
  bio: "Développeur passionné",
  photoProfil: [File] // Optionnel
}
```

**Response (201) :**
```json
{
  "success": true,
  "message": "Inscription réussie, votre profil est en attente de validation",
  "user": {
    "id": 5,
    "pseudo": "jean_dupont",
    "email": "jean@example.com",
    "statut": "pending"
  },
  "needsApproval": true
}
```

#### POST `/api/auth/check-status`

Vérifie le statut d'un profil.

**Body :**
```json
{
  "email": "jean@example.com"
}
```

**Response (200) :**
```json
{
  "success": true,
  "statut": "pending",
  "pseudo": "jean_dupont",
  "email": "jean@example.com",
  "dateValidation": null,
  "raisonRejet": null
}
```

### Routes admin

#### GET `/api/admin/pending-profiles`

Récupère tous les profils en attente.

**Response (200) :**
```json
{
  "success": true,
  "count": 3,
  "profiles": [
    {
      "id": 5,
      "pseudo": "jean_dupont",
      "nom": "Jean Dupont",
      "email": "jean@example.com",
      "ville": "Montréal",
      "bio": "Développeur passionné",
      "age": 28,
      "photoProfil": "data:image/jpeg;base64,...",
      "dateCreation": "2026-01-18T10:00:00Z"
    }
  ]
}
```

#### POST `/api/admin/approve/:id`

Approuve un profil.

**Response (200) :**
```json
{
  "success": true,
  "message": "Profil approuvé avec succès",
  "profile": { }
}
```

#### POST `/api/admin/reject/:id`

Rejette un profil avec raison.

**Body :**
```json
{
  "raison": "Photo de profil inappropriée"
}
```

**Response (200) :**
```json
{
  "success": true,
  "message": "Profil rejeté",
  "profile": { }
}
```

#### GET `/api/admin/stats`

Récupère les statistiques.

**Response (200) :**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 42,
    "pending": 5,
    "approved": 35,
    "rejected": 2,
    "recentApprovals": 3
  }
}
```

---

## 🔒 Sécurité

### Validation côté serveur

✅ **Pseudo :** Regex strict, longueur 3-50, caractères autorisés uniquement  
✅ **Email :** Validation format + unicité  
✅ **Mot de passe :** Minimum 6 caractères, hashé avec bcrypt (10 rounds)  
✅ **Date de naissance :** Vérification âge minimum (18 ans)  
✅ **Bio :** Limitation 500 caractères  
✅ **Photo :** Type MIME vérifié, taille max 5MB

### Protection des données

🔒 **Photos de profil :** Stockées en Base64 dans la DB (pas de fichiers locaux)  
🔒 **Mots de passe :** Toujours hashés, jamais exposés dans l'API  
🔒 **Tokens JWT :** Expiration 24h, refresh disponible  
🔒 **Rate limiting :** 5 tentatives / 15 min pour l'inscription

### Validation administrative

👮 **Double vérification :** Aucun accès sans approbation admin  
👮 **Traçabilité :** ID de l'admin validateur enregistré  
👮 **Raisons obligatoires :** Rejet documenté pour transparence  
👮 **Notifications :** Socket.io pour info temps réel

### COPPA Compliance

👶 **Âge minimum :** 13 ans strictement appliqué  
👶 **Validation :** Côté client ET serveur  
👶 **Blocage :** Inscription impossible si < 18 ans

---

## 🎨 Personnalisation

### Modifier l'âge minimum

```javascript
// backend/utils/constants.js
const AGE_CONFIG = {
  MINIMUM: 18 // Au lieu de 18
};
```

### Ajouter des raisons de rejet

```javascript
// backend/utils/constants.js
const REJECTION_REASONS = {
  // ... existants
  CUSTOM_REASON: 'Ma raison personnalisée'
};
```

### Changer la taille des photos

```javascript
// backend/utils/constants.js
const PROFILE_PHOTO_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_WIDTH: 800,  // Au lieu de 400
  MAX_HEIGHT: 800
};
```

---

## 🧪 Tests

### Test inscription complète

```bash
# 1. S'inscrire avec tous les champs
# 2. Vérifier statut = pending
# 3. Admin approuve
# 4. Connexion réussie
```

### Test rejet de profil

```bash
# 1. Admin rejette avec raison
# 2. Utilisateur voit la raison
# 3. Connexion bloquée
```

### Test validation d'âge

```bash
# 1. Entrer date de naissance < 18 ans
# 2. Vérifier erreur de validation
# 3. Inscription bloquée
```

---

## 📊 Statistiques et monitoring

### Métriques disponibles

- Nombre de profils en attente
- Taux d'approbation/rejet
- Délai moyen de validation
- Profils approuvés récemment (24h)

### Logs

```bash
# Logs d'inscription
[INFO] Nouvel utilisateur inscrit (en attente): jean@example.com

# Logs de validation
[SUCCESS] Profil approuvé: jean_dupont (ID: 5) par admin 1

# Logs de rejet
[WARN] Profil rejeté: fake_user (ID: 8) par admin 1. Raison: Profil suspect
```

---

## 🚧 Améliorations futures possible

- [ ] Email automatique à la validation/rejet
- [ ] Historique des validations par admin
- [ ] Export CSV des profils en attente
- [ ] Filtres avancés (par ville, par âge, etc.)
- [ ] Statistiques détaillées par admin
- [ ] Système de commentaires entre admins
- [ ] Validation en masse (approuver plusieurs profils)
- [ ] Édition de profil après approbation

---

## 🆘 Dépannage

### Problème : Photos ne s'affichent pas

**Solution :** Vérifier que Sharp est installé et fonctionne

```bash
npm install sharp
```

### Problème : Erreur migration SQL

**Solution :** Supprimer et recréer la base

```bash
psql -U postgres -c "DROP DATABASE messagerie_db"
npm run db:init
psql -U postgres -d messagerie_db -f database/migration_profiles.sql
```

### Problème : Admin ne voit pas les profils

**Solution :** Vérifier le rôle dans la DB

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## 📞 Support

- **Email :** email@email.com
- **Documentation :** /docs
- **Issues :** GitHub Issues (https://github.com/Jeff-Dok/MessagerieApp/issues)

---

**Version :** 3.0.0  
**Date :** 18 janvier 2026  
**Auteur :** MessagerieApp Team

✨ Développé avec ❤️ par JeffDok utilisant Anthropic (Claude AI)