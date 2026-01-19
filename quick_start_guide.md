# 🚀 Guide de Démarrage Rapide - Profils Étendus

> Mise en place du système de profils enrichis en 5 minutes

## ⚡ Installation Express

### Étape 1 : Migration de la base de données

```bash
cd backend
npm run db:migrate
```

**Ce que ça fait :**
- ✅ Ajoute les nouveaux champs (pseudo, date_naissance, ville, bio, photo)
- ✅ Crée les colonnes de validation (statut, date_validation, raison_rejet)
- ✅ Configure les index pour performance
- ✅ Crée les vues SQL pour les profils en attente

### Étape 2 : Vérifier les fichiers

Assurez-vous que ces fichiers sont bien présents :

**Backend :**
```
✓ backend/controllers/adminController.js
✓ backend/services/profilePhotoService.js
✓ backend/routes/admin.js
✓ backend/utils/constants.js (mis à jour)
```

**Frontend :**
```
✓ frontend/register.html (nouveau)
✓ frontend/pending.html (nouveau)
✓ frontend/admin.html (nouveau)
```

### Étape 3 : Redémarrer le serveur

```bash
npm run dev
```

### Étape 4 : Créer un compte admin

```bash
# Connexion PostgreSQL
psql -U postgres -d messagerie_db

# Créer un admin
INSERT INTO users (nom, pseudo, email, password, role, statut, date_validation, "dateNaissance", ville)
VALUES (
  'Administrateur',
  'admin',
  'admin@messagerie.com',
  '$2a$10$YourHashedPassword',  -- Utiliser bcrypt pour hasher
  'admin',
  'approved',
  NOW(),
  '1990-01-01',
  'Montréal'
);
```

**Ou utiliser un outil en ligne pour hasher le mot de passe :**
- Site : https://bcrypt-generator.com/
- Mot de passe : `admin123`
- Rounds : 10

### Étape 5 : Tester l'inscription

1. Ouvrir `http://localhost:3000/register.html`
2. Remplir le formulaire en 3 étapes
3. Vérifier la redirection vers `pending.html`

### Étape 6 : Valider le profil

1. Se connecter en tant qu'admin : `http://localhost:3000/login.html`
2. Accéder au panneau admin : `http://localhost:3000/admin.html`
3. Approuver le profil en attente

---

## 🎯 Flux complet

### Parcours utilisateur

```
1. Inscription (register.html)
   ↓
2. Profil en attente (pending.html)
   ↓
3. Admin valide (admin.html)
   ↓
4. Email de confirmation (optionnel)
   ↓
5. Connexion autorisée (login.html)
   ↓
6. Accès au dashboard (dashboard.html)
```

### Parcours admin

```
1. Connexion admin (login.html)
   ↓
2. Accès panneau admin (admin.html)
   ↓
3. Voir profils en attente
   ↓
4. Approuver ou rejeter
   ↓
5. Utilisateur notifié (Socket.io)
```

---

## 🧪 Tests rapides

### Test 1 : Inscription complète

```bash
# Données de test
Nom: Jean Dupont
Pseudo: jean_dupont
Email: jean@test.com
Mot de passe: test123
Date de naissance: 1995-06-15
Ville: Montréal
Bio: Développeur passionné
Photo: [Optionnelle]

# Résultat attendu
✓ Redirection vers pending.html
✓ Statut = pending dans la DB
✓ Message de confirmation affiché
```

### Test 2 : Validation admin

```bash
# Se connecter en admin
Email: admin@messagerie.com
Mot de passe: admin123

# Accéder à /admin.html
✓ Voir le profil de jean_dupont
✓ Cliquer sur "Approuver"
✓ Vérifier statut = approved dans la DB
```

### Test 3 : Connexion utilisateur

```bash
# Se connecter avec le compte approuvé
Email: jean@test.com
Mot de passe: test123

# Résultat attendu
✓ Connexion réussie
✓ Accès au dashboard
✓ Photo de profil affichée
```

### Test 4 : Rejet de profil

```bash
# Créer un nouveau compte
# Admin rejette avec raison
Raison: "Photo de profil inappropriée"

# Vérifier depuis pending.html
✓ Statut = rejected
✓ Raison affichée
✓ Connexion bloquée
```

---

## 🔧 Configuration

### Variables d'environnement (.env)

Aucune nouvelle variable requise ! Le système utilise les configs existantes.

**Optionnel - Personnalisation :**

```env
# Âge minimum (défaut: 13)
MIN_AGE=13

# Taille max photo de profil (défaut: 5MB)
MAX_PROFILE_PHOTO_SIZE=5242880

# Taille max photo de profil redimensionnée (défaut: 400x400)
PROFILE_PHOTO_MAX_WIDTH=400
PROFILE_PHOTO_MAX_HEIGHT=400
```

---

## 📝 Checklist de déploiement

### Avant de déployer en production

- [ ] Exécuter la migration SQL
- [ ] Créer au moins 1 compte admin
- [ ] Tester l'inscription complète
- [ ] Tester l'approbation admin
- [ ] Tester le rejet avec raison
- [ ] Vérifier les notifications Socket.io
- [ ] Tester sur mobile
- [ ] Configurer les emails (optionnel)
- [ ] Backup de la base de données
- [ ] Logs activés

### Sécurité

- [ ] HTTPS activé
- [ ] JWT_SECRET changé
- [ ] Rate limiting configuré
- [ ] CORS configuré correctement
- [ ] Validation côté serveur testée
- [ ] Upload de fichiers sécurisé

---

## 🐛 Dépannage rapide

### Erreur : "Column does not exist"

```bash
# La migration n'a pas été exécutée
npm run db:migrate
```

### Erreur : "Cannot read property 'photoProfil'"

```bash
# Vérifier que multer et sharp sont installés
npm install multer sharp
```

### Admin ne peut pas accéder au panneau

```bash
# Vérifier le rôle
psql -U postgres -d messagerie_db
SELECT id, email, role FROM users WHERE email = 'admin@messagerie.com';

# Si role != 'admin', mettre à jour
UPDATE users SET role = 'admin' WHERE email = 'admin@messagerie.com';
```

### Photos ne s'affichent pas

```bash
# Vérifier sharp
node -e "require('sharp')"

# Si erreur, réinstaller
npm uninstall sharp
npm install sharp
```

---

## 📊 Vérification post-installation

### 1. Vérifier la structure DB

```sql
-- Voir les nouvelles colonnes
\d users

-- Doit afficher :
-- pseudo, date_naissance, ville, bio, photo_profil, 
-- photo_mime_type, statut, date_validation, validateur_id, raison_rejet
```

### 2. Tester les routes

```bash
# Health check
curl http://localhost:5000/health

# Inscription
curl -X POST http://localhost:5000/api/auth/register \
  -F "nom=Test User" \
  -F "pseudo=testuser" \
  -F "email=test@test.com" \
  -F "password=test123" \
  -F "dateNaissance=1995-01-01" \
  -F "ville=Montreal"

# Stats admin (avec token admin)
curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Vérifier les logs

```bash
# Voir les logs en temps réel
npm run dev

# Chercher :
✓ "Migration profils complétée"
✓ "Nouvel utilisateur inscrit (en attente)"
✓ "Profil approuvé"
```

---

## 🎓 Ressources

### Documentation

- [README Profils](./README_PROFILS.md) - Documentation complète
- [API Reference](./docs/API.md) - Documentation API
- [Guide Utilisateur](./docs/GUIDE.md) - Guide pour les utilisateurs

### Support

- **Email :** support@messagerie-app.com
- **GitHub :** Issues sur le repo
- **Discord :** [Lien Discord]

---

## ✅ Validation finale

Avant de considérer l'installation terminée, vérifier :

✓ Migration SQL exécutée sans erreur  
✓ Serveur démarre sans erreur  
✓ Compte admin créé et fonctionnel  
✓ Inscription utilisateur fonctionne  
✓ Upload de photo fonctionne  
✓ Panneau admin accessible  
✓ Approbation/rejet fonctionne  
✓ Connexion utilisateur après approbation  

---

**🎉 Félicitations !** Le système de profils étendus est maintenant opérationnel.

**Prochaines étapes :**
1. Personnaliser les messages de validation
2. Configurer les notifications par email
3. Ajouter des raisons de rejet personnalisées
4. Créer des statistiques détaillées

---

**Version :** 3.0.0  
**Date :** 18 janvier 2026  
**Temps d'installation :** ~5 minutes