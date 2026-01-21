🚀 Guide Pas à Pas - Installation et Test de MessagerieApp
Explication étape par étape comment installer, configurer et tester ce projet avec Live Server.

📋 Prérequis

Avant de commencer, assure-toi d'avoir installé :

1. Node.js et npm

# Vérifier l'installation
node --version    # Doit afficher v14.0.0 ou supérieur
npm --version     # Doit afficher v6.0.0 ou supérieur

Si non installé : Télécharge depuis https://nodejs.org/

2. PostgreSQL

# Vérifier l'installation
psql --version    # Doit afficher PostgreSQL 12 ou supérieur

Si non installé :

Windows : https://www.postgresql.org/download/windows/
Mac : brew install postgresql
Linux : sudo apt-get install postgresql

3. VS Code (recommandé)

Télécharge depuis https://code.visualstudio.com/

4. Extension Live Server pour VS Code

Ouvre VS Code
Va dans Extensions (Ctrl+Shift+X)
Cherche "Live Server"
Installe l'extension de Ritwick Dey


📁 ÉTAPE 1 : Copier la Structure du Projet

**Résultat attendu** :
```
messagerie-app/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── database/
└── frontend/
    ├── css/
    ├── js/
    │   ├── ui/
    │   └── services/
    ├── images/
    │   └── icons/
    └── docs/

📝 ÉTAPE 2 : Modification du Fichier .env.exemple

Change ces valeurs dans le fichier

DB_PASSWORD=ton_mot_de_passe_postgres
JWT_SECRET=change_moi_en_production_super_secret_key_123456789

Sauvegarde le fichier, puis renomme-le .env

🗄️ ÉTAPE 3 : Configurer PostgreSQL

3.1 Démarrer PostgreSQL

Windows :
# Ouvrir "Services" (Win+R, taper "services.msc")
# Démarrer le service "postgresql-x64-XX"

Mac :
brew services start postgresql

Linux :
sudo service postgresql start

3.2 Créer un utilisateur (si nécessaire)

# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, créer un mot de passe
ALTER USER postgres PASSWORD 'ton_mot_de_passe';

# Quitter
\q

🔨 ÉTAPE 4 : Vérifier que tous les Fichiers Backend sont présent

📂 backend/
    ├── 📄 server.js
    ├── 📄 package.json
    ├── 📄 .env.exemple
    ├── 📄 .gitignore
    ├── 📄 README.md
    │
    ├── 📂 config/
    │   ├── 📄 database.js
    │   ├── 📄 jwt.js
    │   └── 📄 multer.js
    │
    ├── 📂 models/
    │   ├── 📄 index.js
    │   ├── 📄 User.js
    │   └── 📄 Message.js
    │
    ├── 📂 controllers/
    │   ├── 📄 authController.js
    │   ├── 📄 userController.js
    │   ├── 📄 messageController.js
    │   └── 📄 adminController.js
    │
    ├── 📂 routes/
    │   ├── 📄 index.js
    │   ├── 📄 auth.js
    │   ├── 📄 users.js
    │   ├── 📄 messages.js
    │   └── 📄 admin.js
    │
    ├── 📂 middleware/
    │   ├── 📄 auth.js
    │   ├── 📄 validation.js
    │   ├── 📄 errorHandler.js
    │   └── 📄 rateLimiter.js
    │
    ├── 📂 services/
    │   ├── 📄 imageService.js
    │   ├── 📄 profilePhotoService.js
    │   ├── 📄 socketService.js
    │   └── 📄 cleanupService.js
    │
    ├── 📂 utils/
    │   ├── 📄 logger.js
    │   ├── 📄 helpers.js
    │   └── 📄 constants.js
    │
    └── 📂 database/
        ├── 📄 init.sql
        ├── 📄 seed.sql
        └── 📄 migration_profiles.sql

🎨 ÉTAPE 5 : Vérifier que tous les Fichiers Frontend sont présent

📂 frontend/
    ├── 📄 index.html
    ├── 📄 login.html
    ├── 📄 register.html
    ├── 📄 pending.html
    ├── 📄 dashboard.html
    ├── 📄 admin.html
    │
    ├── 📂 css/
    │   ├── 📄 reset.css
    │   ├── 📄 variables.css
    │   ├── 📄 global.css
    │   ├── 📄 components.css
    │   ├── 📄 auth.css
    │   └── 📄 dashboard.css
    │
    ├── 📂 js/
    │   ├── 📄 config.js
    │   ├── 📄 api.js
    │   ├── 📄 socket.js
    │   ├── 📄 auth.js
    │   ├── 📄 storage.js
    │   ├── 📄 app.js
    │   │
    │   ├── 📂 ui/
    │   │   ├── 📄 messageRenderer.js
    │   │   ├── 📄 conversationList.js
    │   │   └── 📄 notifications.js
    │   │
    │   ├── 📂 services/
    │   │   ├── 📄 imageHandler.js
    │   │   └── 📄 expirationManager.js
    │   │
    │   └── 📂 utils/
    │       ├── 📄 helpers.js
    │       └── 📄 validation.js
    │
    ├── 📂 images/
    │   ├── 📄 logo.svg
    │   └── 📂 icons/
    │       ├── 📄 send.svg
    │       ├── 📄 message.svg
    │       └── 📄 user.svg
    │
    └── 📂 docs/
        ├── 📄 API.md
        ├── 📄 GUIDE.md
        └── 📄 completion_summary.md

⚙️ ÉTAPE 6 : Installer les Dépendances

6.1 Installer les dépendances backend

cd backend
npm install
```

**Attends que l'installation se termine.** Cela peut prendre 2-3 minutes.

**Tu devrais voir** :
```
✓ Installed 150+ packages

🗄️ ÉTAPE 7 : Initialiser la Base de Données

7.1 Créer la base de données

# Depuis backend/
psql -U postgres -f database/init.sql
```

**Entre ton mot de passe PostgreSQL quand demandé.**

**Tu devrais voir** :
```
CREATE DATABASE
\c messagerie_db
CREATE TABLE
CREATE TABLE
✅ Base de données initialisée avec succès!

7.2 Exécuter la migration des profils

psql -U postgres -d messagerie_db -f database/migration_profiles.sql
```

**Tu devrais voir** :
```
ALTER TABLE
CREATE INDEX
✅ Migration profils complétée!

7.3 Insérer les données de test

psql -U postgres -d messagerie_db -f database/seed.sql
```

**Tu devrais voir** :
```
INSERT 0 5
INSERT 0 10
✅ Données de test insérées avec succès!

🚀 ÉTAPE 8 : Démarrer le Backend

8.1 Créer un compte admin manuellement
IMPORTANT : Tu dois d'abord hasher le mot de passe.

Utiliser Node.js :
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10, (err, hash) => console.log(hash));"

8.2 Insérer l'admin dans la DB
psql -U postgres -d messagerie_db

Dans psql :
INSERT INTO users (
  nom, 
  pseudo, 
  email, 
  password, 
  role, 
  statut, 
  date_validation,
  "dateNaissance", 
  ville
) VALUES (
  'Administrateur',
  'admin',
  'admin@messagerie.com',
  'TON_HASH_ICI',  -- Remplace par le hash obtenu
  'admin',
  'approved',
  NOW(),
  '1990-01-01',
  'Montréal'
);

-- Vérifier
SELECT id, pseudo, email, role, statut FROM users;

-- Quitter
\q

8.3 Démarrer le serveur

# Depuis backend/
npm run dev
```

**Tu devrais voir** :
```
[INFO] Connexion à PostgreSQL...
✅ Connexion à PostgreSQL établie avec succès
✅ Modèles synchronisés
✅ Socket.io initialisé avec succès
✅ Service de nettoyage démarré
🚀 Serveur démarré avec succès
📍 URL: http://localhost:5000
🔌 WebSocket: ws://localhost:5000
🌍 Environnement: development

!!! Laisse ce terminal ouvert !!!


🌐 ÉTAPE 9 : Tester avec Live Server

9.1 Ouvrir le frontend dans VS Code

Nouveau terminal (garde le backend actif) :

# Depuis la racine du projet
cd frontend
code .

9.2 Configurer l'API URL

Ouvre frontend/js/api.js et vérifie ligne 12 :

const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',  // ✅ Doit être comme ça
  // ...
};
```

9.3 Démarrer Live Server

**Dans VS Code** :
1. Clique droit sur `index.html`
2. Sélectionne "Open with Live Server"

**OU**

1. Clique sur le bouton "Go Live" en bas à droite de VS Code

**Ton navigateur devrait s'ouvrir automatiquement sur** :
```
http://127.0.0.1:5500/index.html
```

---

✅ ÉTAPE 10 : Tester l'Application

### Test 1 : Connexion Admin
1. Tu seras redirigé vers `login.html`
2. Entre :
   - **Email** : `admin@messagerie.com`
   - **Mot de passe** : `admin123`
3. Clique sur "Se connecter"

**Résultat attendu** :
- ✅ Message "Connexion réussie !"
- ✅ Redirection vers `dashboard.html`
- ✅ Tu vois ton nom "Administrateur" en haut à droite
- ✅ Badge "Admin" visible

### Test 2 : Accéder au Panneau Admin
1. Dans ton navigateur, va sur :
```
   http://127.0.0.1:5500/admin.html
```

**Résultat attendu** :
- ✅ Panneau admin s'affiche
- ✅ Statistiques visibles (0 en attente, 1 approuvé, etc.)
- ✅ Message "Aucun profil en attente"

### Test 3 : Inscription d'un Nouveau Profil

**Nouvelle fenêtre de navigateur** (ou mode incognito) :
```
http://127.0.0.1:5500/register.html
```

**Étape 1 - Informations de base** :
- Nom : `Jean Dupont`
- Pseudo : `jean_dupont`
- Email : `jean@test.com`
- Mot de passe : `test123`
- Clique "Continuer"

**Étape 2 - Informations personnelles** :
- Date de naissance : `1995-06-15`
- Ville : `Montréal`
- Bio : `Développeur passionné`
- Clique "Continuer"

**Étape 3 - Photo de profil** :
- (Optionnel) Clique sur le cercle pour ajouter une photo
- Clique "S'inscrire"

**Résultat attendu** :
- ✅ Message "Inscription réussie ! Votre profil est en attente de validation"
- ✅ Redirection vers `pending.html`
- ✅ Page d'attente affichée

### Test 4 : Valider le Profil (Admin)

**Retour à la fenêtre admin** :
```
http://127.0.0.1:5500/admin.html
```

1. Clique sur "Actualiser"
2. Tu devrais voir le profil de Jean Dupont
3. Clique sur "Approuver"
4. Confirme

**Résultat attendu** :
- ✅ Message "Profil approuvé avec succès !"
- ✅ Le profil disparaît de la liste
- ✅ Statistiques mises à jour

### Test 5 : Connexion Utilisateur Approuvé

**Fenêtre utilisateur** :
```
http://127.0.0.1:5500/login.html

Entre :

Email : jean@test.com
Mot de passe : test123


Clique "Se connecter"

Résultat attendu :

✅ Connexion réussie
✅ Accès au dashboard
✅ Photo de profil visible (si uploadée)

Test 6 : Envoyer un Message
Dans le dashboard :

Sélectionne "Administrateur" dans la liste de gauche
Tape un message : Bonjour !
Appuie sur Entrée

Résultat attendu :

✅ Message apparaît immédiatement
✅ Heure affichée

Test 7 : Envoyer une Image

Clique sur l'icône 📷
Sélectionne une image (max 5 MB)
L'image s'envoie automatiquement

Résultat attendu :

✅ Image affichée dans le chat
✅ Timer d'expiration visible (si tu cliques dessus)

Test 8 : Expiration d'Image

Clique sur l'image que tu viens d'envoyer
Un timer de 5 minutes démarre

Résultat attendu :

✅ Timer ⏱️ 4:59 affiché en haut à droite
✅ Compte à rebours fonctionne
✅ Après 5 minutes : image remplacée par "🔒 Image expirée"

🐛 Dépannage

Problème 1 : Le backend ne démarre pas

Erreur : Error: connect ECONNREFUSED

Solution :
# Vérifier que PostgreSQL tourne
# Windows
services.msc  # Chercher postgresql

# Mac
brew services list

# Linux
sudo service postgresql status

# Démarrer PostgreSQL
brew services start postgresql  # Mac
sudo service postgresql start   # Linux

Problème 2 : Erreur "Cannot find module"

Erreur : Error: Cannot find module 'express'

Solution :
cd backend
rm -rf node_modules package-lock.json
npm install

Problème 3 : Live Server ne démarre pas

Solution :
Ferme VS Code complètement
Rouvre VS Code
Réinstalle l'extension Live Server
Redémarre VS Code

Problème 4 : CORS Error dans le navigateur

Erreur : Access to fetch... has been blocked by CORS policy

Solution :
Vérifie backend/.env :
CORS_ORIGIN=http://127.0.0.1:5500

Redémarre le backend.

Problème 5 : Photos ne s'affichent pas

Solution :
cd backend
npm install sharp --force
npm run dev

Problème 6 : Base de données existe déjà

Erreur : database "messagerie_db" already exists

Solution :
# Supprimer et recréer
psql -U postgres -c "DROP DATABASE messagerie_db;"
psql -U postgres -f database/init.sql
psql -U postgres -d messagerie_db -f database/migration_profiles.sql

📊 Vérification Complète

Checklist Backend ✅

 npm run dev démarre sans erreur
 Tu vois 🚀 Serveur démarré avec succès
 Base de données connectée
 Socket.io initialisé
 Service de nettoyage démarré

Checklist Frontend ✅

 Live Server démarre
 Page de login s'affiche
 Connexion admin fonctionne
 Dashboard s'affiche
 Panneau admin accessible

Checklist Fonctionnalités ✅

 Inscription multi-étapes fonctionne
 Page d'attente s'affiche
 Admin peut approuver/rejeter
 Connexion utilisateur approuvé fonctionne
 Envoi de messages texte fonctionne
 Envoi d'images fonctionne
 Timer d'expiration fonctionne
 Socket.io temps réel fonctionne

 🎓 Commandes Utiles

 Backend

 # Démarrer en dev
npm run dev

# Réinitialiser la DB complètement
npm run db:init
npm run db:migrate
npm run db:seed

# Voir les logs PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log

PostgreSQL

# Se connecter
psql -U postgres -d messagerie_db

# Commandes utiles
\dt                    # Lister les tables
\d users              # Voir structure table users
SELECT * FROM users;  # Voir tous les users
\q                    # Quitter
```

### VS Code
```
Ctrl+Shift+P          # Palette de commandes
> Live Server: Stop   # Arrêter Live Server
> Live Server: Open   # Démarrer Live Server

🎉 Félicitations !

Si tu as suivi toutes les étapes et que tous les tests passent, tu as maintenant :

✅ Une application de messagerie complète fonctionnelle
✅ Système de profils enrichis avec validation admin
✅ Messages temps réel avec Socket.io
✅ Partage d'images sécurisé avec expiration
✅ Backend robuste avec PostgreSQL
✅ Frontend moderne et réactif