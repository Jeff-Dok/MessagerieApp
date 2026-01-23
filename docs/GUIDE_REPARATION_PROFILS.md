# Guide de Reparation des Profils Incomplets

## Vue d'ensemble

Ce systeme permet de detecter, corriger et supprimer automatiquement les profils utilisateurs avec des donnees manquantes.

---

## Fonctionnalites

### Detection automatique
Quand une erreur de donnees incompletes est detectee dans la page admin, un bouton "Reparer les profils incomplets" apparait automatiquement.

### Actions disponibles

#### Par profil individuel :
- **Corriger** : Genere des valeurs par defaut
- **Supprimer** : Supprime le profil de la base de donnees

#### Actions groupees :
- **Corriger tous** : Corrige tous les profils en une fois
- **Supprimer tous** : Supprime tous les profils incomplets

---

## Utilisation

### Methode 1 : Depuis l'interface admin

1. Accedez a la page **Administration** (`admin.html`)
2. Si des profils incomplets causent une erreur, un bouton apparait
3. Cliquez sur **"Reparer les profils incomplets"**
4. Vous etes redirige vers la page de gestion

### Methode 2 : Script en ligne de commande

```bash
# Depuis le dossier backend
cd backend

# Verifier les profils incomplets
node scripts/fix-incomplete-profiles.js --check

# Corriger automatiquement
node scripts/fix-incomplete-profiles.js --fix
```

---

## Types de problemes detectes

| Champ | Requis | Action de correction |
|-------|--------|---------------------|
| **Pseudo** | Oui | Genere depuis l'email : `user_email_ID` |
| **Nom** | Oui | Utilise le pseudo ou `Utilisateur ID` |
| **Email** | Oui | Genere : `userID@messagerie-app.local` |
| **Ville** | Recommande | Defini a `Non specifie` |
| **Date de naissance** | Non | Reste NULL (optionnel) |

---

## Securite

### Protections en place :

1. **Protection administrateur** : Impossible de supprimer votre propre compte
2. **Double confirmation** : Pour les suppressions (individuelle et groupee)
3. **Logs complets** : Toutes les actions sont enregistrees cote serveur
4. **Authentification requise** : Seuls les admins peuvent acceder

---

## API Endpoints

### GET `/api/admin/incomplete-profiles`
Recupere la liste de tous les profils incomplets

**Reponse :**
```json
{
  "success": true,
  "count": 5,
  "profiles": [
    {
      "user": {
        "id": 2,
        "pseudo": null,
        "nom": "Jean Dupont",
        "email": "user@example.com"
      },
      "issues": ["pseudo manquant", "ville manquante"]
    }
  ]
}
```

### POST `/api/admin/fix-profile/:id`
Corrige un profil specifique

**Reponse :**
```json
{
  "success": true,
  "message": "Profil corrige avec succes",
  "updates": ["pseudo", "ville"],
  "user": { ... }
}
```

### DELETE `/api/admin/delete-profile/:id`
Supprime un profil specifique

### POST `/api/admin/fix-all-profiles`
Corrige tous les profils incomplets

**Reponse :**
```json
{
  "success": true,
  "fixed": 5,
  "message": "5 profil(s) corrige(s) avec succes"
}
```

### POST `/api/admin/delete-profiles`
Supprime plusieurs profils

**Body :**
```json
{
  "profileIds": [2, 3, 4, 5]
}
```

---

## Fichiers

### Backend
- `backend/scripts/fix-incomplete-profiles.js` - Script CLI
- Endpoints dans `backend/controllers/adminController.js`
- Routes dans `backend/routes/admin.js`

---

## Recommandations

### Quand corriger ?
- Profils de test avec des donnees manquantes
- Profils crees avant l'ajout de champs obligatoires
- Migration de donnees incomplete

### Quand supprimer ?
- Profils en double
- Comptes de spam
- Donnees invalides impossibles a corriger

---

## Depannage

### Le bouton n'apparait pas
- Verifiez qu'il y a effectivement une erreur dans la console du navigateur
- Actualisez la page admin

### Les profils ne se chargent pas
1. Verifiez que le serveur backend est demarre
2. Ouvrez la console du navigateur (F12)
3. Verifiez les logs du serveur

### Erreur lors de la correction
- Verifiez que vous etes connecte en tant qu'admin
- Consultez les logs du serveur backend
- Verifiez les contraintes de la base de donnees

---

## Support

En cas de probleme :
1. Consultez les logs du serveur : `backend/logs/`
2. Verifiez la connexion a la base de donnees

---

**Derniere mise a jour :** 2026-01-22
**Version :** 1.1.0
