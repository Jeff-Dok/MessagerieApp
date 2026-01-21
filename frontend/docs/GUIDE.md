# 📖 MessagerieApp - Guide Utilisateur Complet

## 🎯 Introduction

**MessagerieApp** est une application de messagerie sécurisée en temps réel avec partage d'images à expiration automatique, inspirée de Snapchat mais avec une approche professionnelle et sécurisée.

### Fonctionnalités Principales

✅ **Messagerie temps réel** avec Socket.io  
✅ **Partage d'images sécurisé** avec expiration automatique après 5 minutes  
✅ **Profils enrichis** avec photo, bio, ville, âge  
✅ **Système de validation admin** pour modération des nouveaux profils  
✅ **Protection contre les captures d'écran** (limitation)  
✅ **Interface moderne** et responsive  
✅ **Support hors ligne** avec Service Worker  

---

## 🚀 Démarrage Rapide

### Pour les Utilisateurs

#### 1. Inscription

1. Rendez-vous sur `http://localhost:3000/register.html`
2. Remplissez le formulaire en 3 étapes:
   - **Étape 1:** Informations de base (nom, pseudo, email, mot de passe)
   - **Étape 2:** Informations personnelles (date de naissance, ville, bio)
   - **Étape 3:** Photo de profil (optionnelle)
3. Cliquez sur "S'inscrire"
4. Votre profil est **en attente de validation** par un administrateur

#### 2. Validation du Profil

- Après inscription, vous recevrez un message indiquant que votre profil est en attente
- Rendez-vous sur `http://localhost:3000/pending.html` pour vérifier le statut
- Cliquez sur "Vérifier le statut" pour actualiser
- Une fois approuvé, vous pourrez vous connecter

#### 3. Connexion

1. Rendez-vous sur `http://localhost:3000/login.html`
2. Entrez votre email et mot de passe
3. Cliquez sur "Se connecter"

**Comptes de démonstration:**
- Admin: `admin@example.com` / `admin123`
- User1: `user1@example.com` / `user123`
- User2: `user2@example.com` / `user123`

#### 4. Interface de Messagerie

Une fois connecté, vous accédez au dashboard:

```
┌─────────────────────────────────────────────────┐
│  [Logo] MessagerieApp    [Admin] [User] [Déco]  │
├──────────────┬──────────────────────────────────┤
│              │                                   │
│ Conversations│  Messages                        │
│              │                                   │
│ ○ John Doe   │  [Chat avec l'utilisateur]       │
│ ○ Jane Smith │                                   │
│ ○ Bob Martin │  [Zone de saisie]                │
│              │  [📷 Image] [📝 Texte] [Envoyer] │
└──────────────┴──────────────────────────────────┘
```

#### 5. Envoyer un Message Texte

1. Sélectionnez une conversation dans la liste de gauche
2. Tapez votre message dans le champ de saisie
3. Appuyez sur **Entrée** ou cliquez sur **Envoyer**

#### 6. Envoyer une Image

1. Sélectionnez une conversation
2. Cliquez sur l'icône **📷 Image**
3. Choisissez une image (max 5 MB, formats: JPG, PNG, GIF, WebP)
4. L'image sera automatiquement compressée et envoyée

⚠️ **Important:** L'image sera **expirée après 5 minutes** de la première visualisation par le destinataire!

#### 7. Visualiser une Image

1. Cliquez sur l'image reçue (badge "Nouvelle" visible)
2. Un compte à rebours de **5 minutes** démarre
3. Après expiration, l'image devient inaccessible (🔒 Image expirée)

**Protections anti-capture:**
- Menu contextuel désactivé (clic droit)
- Raccourcis de capture d'écran bloqués
- Glisser-déposer désactivé
- Filigrane invisible intégré

---

## 👑 Guide Administrateur

### Accès à l'Interface Admin

1. Connectez-vous avec un compte admin
2. Accédez à `http://localhost:3000/admin.html`

### Tableau de Bord Admin

```
┌─────────────────────────────────────────────────┐
│  Statistiques                                    │
│  ┌─────────┬─────────┬─────────┬─────────┐     │
│  │   5     │   135   │   2     │   142   │     │
│  │ Attente │Approuvés│ Rejetés │  Total  │     │
│  └─────────┴─────────┴─────────┴─────────┘     │
│                                                  │
│  Profils en attente de validation                │
│  ┌────────────────────────────────────────────┐ │
│  │ 📷 Alice Martin (@alice_m)                 │ │
│  │    alice@example.com • 28 ans • Paris     │ │
│  │    "Passionnée de photographie..."        │ │
│  │    [✓ Approuver] [✗ Rejeter]              │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Approuver un Profil

1. Vérifiez les informations du profil (photo, bio, informations)
2. Cliquez sur **✓ Approuver**
3. Confirmation immédiate
4. L'utilisateur peut maintenant se connecter

### Rejeter un Profil

1. Cliquez sur **✗ Rejeter**
2. Une modale s'ouvre
3. Entrez une **raison du rejet** (min 10 caractères, obligatoire)
4. Cliquez sur **Confirmer le rejet**
5. L'utilisateur recevra la raison lors de sa prochaine tentative de connexion

**Raisons de rejet courantes:**
- Photo de profil inappropriée
- Informations suspectes ou fausses
- Pseudo offensant
- Âge insuffisant
- Contenu spam ou publicitaire

### Approbation en Masse

1. Cochez les profils à approuver (fonctionnalité à venir)
2. Cliquez sur **Approuver la sélection**
3. Tous les profils sélectionnés sont approuvés simultanément

### Recherche et Filtres

Utilisez les filtres pour trouver des utilisateurs:
- **Par texte:** Nom, pseudo, email
- **Par statut:** Pending, Approved, Rejected
- **Par ville:** Filtrage géographique
- **Par pagination:** 20 résultats par page

---

## ⚙️ Configuration et Personnalisation

### Variables d'Environnement

Créez un fichier `.env` dans le dossier `backend/`:

```env
# Serveur
NODE_ENV=development
PORT=5000
HOST=localhost

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=messagerie_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# Sécurité JWT
JWT_SECRET=votre_cle_secrete_tres_longue_et_securisee
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Images
MAX_FILE_SIZE=5242880
IMAGE_EXPIRATION_TIME=5

# Nettoyage
CLEANUP_INTERVAL=1
```

### Personnalisation des Couleurs

Éditez `frontend/css/variables.css`:

```css
:root {
  --color-primary: #4F46E5;      /* Couleur principale */
  --color-primary-hover: #4338CA; /* Hover */
  --color-success: #10B981;       /* Succès */
  --color-error: #EF4444;         /* Erreur */
  --color-warning: #F59E0B;       /* Avertissement */
}
```

### Modification du Temps d'Expiration

**Backend** (`backend/utils/constants.js`):
```javascript
const IMAGE_CONFIG = {
  EXPIRATION_TIME: 10 // Change to 10 minutes
};
```

**Frontend** (`frontend/js/services/expirationManager.js`):
```javascript
const EXPIRATION_CONFIG = {
  EXPIRATION_TIME: 10 * 60 * 1000 // 10 minutes
};
```

---

## 🔒 Sécurité et Confidentialité

### Protection des Données

1. **Mots de passe:** Hashés avec bcrypt (salt rounds: 10)
2. **Tokens JWT:** Signés avec clé secrète, expiration 24h
3. **Images:** Base64 en BD, expiration automatique
4. **HTTPS:** Recommandé en production
5. **CORS:** Configuré pour autoriser uniquement les origines approuvées

### Protection des Images

**Protections actives:**
- ✅ Rendu sur Canvas (pas de balise `<img>`)
- ✅ Menu contextuel désactivé
- ✅ Raccourcis clavier bloqués (PrintScreen, Cmd+Shift+3/4/5)
- ✅ Glisser-déposer désactivé
- ✅ Filigrane invisible
- ✅ Expiration automatique après 5 minutes

**Limitations connues:**
- ❌ Ne peut pas empêcher les captures physiques (smartphone)
- ❌ Les outils tiers de capture peuvent contourner
- ❌ Les utilisateurs avancés peuvent inspecter le DOM

**Recommandations:**
- N'envoyez que des images que vous acceptez de voir potentiellement sauvegardées
- Le système ajoute un filigrane invisible pour traçabilité

### Permissions des Rôles

| Action | User | Admin |
|--------|------|-------|
| Envoyer messages | ✅ | ✅ |
| Voir ses messages | ✅ | ✅ |
| Supprimer ses messages | ✅ | ✅ |
| Supprimer messages d'autrui | ❌ | ✅ |
| Modifier son profil | ✅ | ✅ |
| Modifier profils d'autrui | ❌ | ❌ |
| Valider profils | ❌ | ✅ |
| Supprimer utilisateurs | ❌ | ✅ |
| Voir stats admin | ❌ | ✅ |

---

## 📱 Utilisation Mobile

### Installation PWA (Progressive Web App)

1. Ouvrez l'application dans Chrome/Safari mobile
2. Cliquez sur "Ajouter à l'écran d'accueil"
3. L'icône apparaîtra sur votre écran d'accueil
4. Lancez comme une application native

### Mode Hors Ligne

Grâce au Service Worker:
- ✅ Interface accessible hors ligne
- ✅ Styles et scripts en cache
- ⚠️ Messages nécessitent connexion internet
- 🔄 Synchronisation automatique au retour en ligne

---

## 🐛 Résolution de Problèmes

### Problème: Impossible de se connecter

**Solutions:**
1. Vérifiez que le serveur backend est démarré (`npm run dev`)
2. Vérifiez l'URL (doit être `http://localhost:5000`)
3. Effacez le cache et les cookies du navigateur
4. Vérifiez que PostgreSQL est en cours d'exécution

### Problème: "Profil en attente de validation"

**Solutions:**
1. Rendez-vous sur `/pending.html` pour vérifier le statut
2. Attendez qu'un admin valide votre profil
3. En développement, connectez-vous avec le compte admin et validez manuellement

### Problème: Images ne s'affichent pas

**Solutions:**
1. Vérifiez le format (JPG, PNG, GIF, WebP uniquement)
2. Vérifiez la taille (max 5 MB)
3. Vérifiez que l'image n'a pas expiré (5 minutes après visualisation)
4. Actualisez la page (F5)

### Problème: Socket.io déconnecté

**Solutions:**
1. Vérifiez votre connexion internet
2. Actualisez la page
3. Vérifiez les logs du serveur backend
4. Vérifiez que le port 5000 n'est pas bloqué par le firewall

### Problème: "Service Worker failed to register"

**Solutions:**
1. Assurez-vous que le fichier `sw.js` existe à la racine du frontend
2. Vérifiez que vous êtes en HTTPS ou localhost
3. Ouvrez les DevTools → Application → Service Workers pour voir les erreurs
4. Désenregistrez l'ancien SW et rechargez

---

## 📊 Statistiques et Métriques

### Pour les Utilisateurs

Accédez à vos statistiques via le profil:
- Nombre de messages envoyés
- Nombre de messages reçus
- Messages non lus
- Total des conversations

### Pour les Admins

Tableau de bord complet:
- Nombre total d'utilisateurs
- Profils en attente
- Profils approuvés
- Profils rejetés
- Approbations récentes (24h)
- Répartition par ville

---

## 🎨 Personnalisation Avancée

### Changer le Logo

Remplacez `frontend/images/logo.svg` par votre logo (format SVG recommandé)

### Ajouter des Sons de Notification

1. Ajoutez vos fichiers MP3 dans `frontend/sounds/`
2. Modifiez `frontend/js/services/advanced_notifications.js`:

```javascript
sounds: {
  message: '/sounds/votre-son-message.mp3',
  success: '/sounds/votre-son-succes.mp3'
}
```

### Modifier les Textes de l'Interface

Tous les textes sont dans les fichiers HTML et JavaScript:
- Messages d'erreur: `backend/utils/constants.js` → `SERVER_MESSAGES`
- Textes UI: Directement dans les fichiers HTML

---

## 🔄 Mises à Jour

### Appliquer une Mise à Jour

```bash
# 1. Sauvegarder votre base de données
pg_dump messagerie_db > backup.sql

# 2. Récupérer les dernières modifications
git pull origin main

# 3. Mettre à jour les dépendances
npm install
cd backend && npm install

# 4. Appliquer les migrations
npm run db:migrate

# 5. Redémarrer le serveur
npm run dev
```

### Vérifier la Version

- Backend: Voir `backend/package.json` → `version`
- Frontend: Voir `package.json` → `version`
- API: Endpoint `/` retourne la version

---

## 💡 Conseils d'Utilisation

### Pour une Meilleure Expérience

1. **Utilisez Chrome ou Firefox** pour une compatibilité optimale
2. **Activez les notifications navigateur** pour recevoir les alertes
3. **Gardez la page ouverte** pour recevoir les messages en temps réel
4. **Utilisez un réseau stable** pour éviter les déconnexions Socket.io

### Bonnes Pratiques

1. **Ne partagez jamais votre mot de passe** avec qui que ce soit
2. **Déconnectez-vous** après utilisation sur ordinateur partagé
3. **Vérifiez le destinataire** avant d'envoyer des images sensibles
4. **Rappelez-vous** que les images expirent après 5 minutes
5. **Respectez les autres utilisateurs** dans vos messages

---

## 📞 Support et Communauté

### Obtenir de l'Aide

- **Documentation:** Ce guide et `API.md`
- **Issues GitHub:** [github.com/Jeff-Dok/MessagerieApp/issues](https://github.com/Jeff-Dok/MessagerieApp/issues)
- **Email:** jn.francois.gagnon@gmail.com

### Signaler un Bug

1. Vérifiez que le bug n'a pas déjà été signalé
2. Créez une issue sur GitHub avec:
   - Description du problème
   - Étapes pour reproduire
   - Navigateur et version
   - Captures d'écran si possible

### Contribuer

Les contributions sont bienvenues! Voir `CONTRIBUTING.md` (à créer).

---

## 📜 Licence

MIT License - Voir `LICENSE` pour les détails.

---

## 🙏 Remerciements

Merci à tous les contributeurs et utilisateurs de MessagerieApp!

---

*Dernière mise à jour: 2026-01-21*  
*Version du guide: 3.0.0*
