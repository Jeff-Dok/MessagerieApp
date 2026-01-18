# 📖 Guide Utilisateur - MessagerieApp

> Guide complet pour utiliser MessagerieApp

## 🎯 Introduction

MessagerieApp est une application de messagerie sécurisée avec partage d'images à expiration automatique. Les images partagées expirent 5 minutes après leur première visualisation.

---

## 🚀 Démarrage rapide

### 1. Inscription

1. Accédez à la page d'inscription
2. Remplissez le formulaire :
   - **Nom complet** (minimum 2 caractères)
   - **Email** (format valide requis)
   - **Mot de passe** (minimum 6 caractères)
3. Cliquez sur **"S'inscrire"**
4. Vous serez automatiquement connecté

### 2. Connexion

1. Sur la page de connexion, entrez :
   - Votre **email**
   - Votre **mot de passe**
2. Cliquez sur **"Se connecter"**

**Comptes de démonstration disponibles :**
- Admin : `admin@example.com` / `admin123`
- Utilisateur : `user1@example.com` / `user123`

---

## 💬 Utilisation de la messagerie

### Interface principale

L'interface est divisée en 3 zones :

```
┌─────────────────────────────────────────────┐
│  [Logo] MessagerieApp     [Nom] [Déco]     │ ← En-tête
├──────────────┬────────────────────────────────┤
│              │                                │
│ Conversations│      Zone de messages          │
│              │                                │
│  👤 Jean     │    Jean: Bonjour!              │
│  👤 Marie    │    Vous: Salut!                │
│  👤 Pierre   │                                │
│              │                                │
│              │  [Tapez votre message...] 📷 ✉│
└──────────────┴────────────────────────────────┘
```

### Démarrer une conversation

1. **Sélectionnez un contact** dans la liste de gauche
2. La zone de messages s'affiche à droite
3. Tapez votre message dans le champ en bas
4. Appuyez sur **Entrée** ou cliquez sur **"Envoyer"**

### Envoyer un message texte

1. Sélectionnez une conversation
2. Tapez votre message (max 5000 caractères)
3. Appuyez sur **Entrée** ou cliquez sur **Envoyer**
4. Le message apparaît immédiatement

**💡 Astuce** : L'indicateur "en train d'écrire..." s'affiche quand votre correspondant tape un message.

---

## 📸 Partage d'images

### Envoyer une image

1. Dans une conversation, cliquez sur l'icône **📷**
2. Sélectionnez une image :
   - **Formats acceptés** : JPEG, PNG, GIF, WebP
   - **Taille maximale** : 5 MB
3. L'image est automatiquement :
   - ✅ Redimensionnée (max 800x800px)
   - ✅ Compressée pour optimiser
   - ✅ Protégée avec un filigrane invisible
4. Cliquez sur **Envoyer**

### Voir une image

Lorsque vous recevez une image :

1. Une **badge "Nouvelle"** apparaît
2. Cliquez sur l'image pour la voir
3. ⏱️ **Le timer démarre automatiquement** (5 minutes)
4. L'image est protégée :
   - ❌ Pas de clic droit
   - ❌ Pas de téléchargement
   - ❌ Captures d'écran désactivées

### Timer d'expiration

```
⏱️ 4:52  ← En haut à droite de l'image
```

**Couleurs du timer :**
- 🟢 **Vert** : Plus de 1 minute restante
- 🟡 **Orange** : Moins de 1 minute
- 🔴 **Rouge** : Moins de 30 secondes (pulsation)

**Après expiration :**
```
┌─────────────────────────┐
│         🔒              │
│   Image expirée         │
│                         │
│ Cette image n'est       │
│ plus disponible         │
└─────────────────────────┘
```

---

## 👤 Gestion du profil

### Modifier votre profil

1. Cliquez sur votre **nom** en haut à droite
2. Sélectionnez **"Mon profil"**
3. Modifiez :
   - Votre nom
   - Votre email
4. Cliquez sur **"Enregistrer"**

### Changer votre mot de passe

1. Dans les paramètres du profil
2. Entrez :
   - Ancien mot de passe
   - Nouveau mot de passe
   - Confirmation
3. Cliquez sur **"Changer le mot de passe"**

---

## 🔔 Notifications

### Types de notifications

| Icône | Type | Description |
|-------|------|-------------|
| 💬 | Nouveau message | Message texte reçu |
| 📷 | Nouvelle image | Image reçue |
| 👁️ | Image vue | Votre image a été vue |
| 🔒 | Image expirée | Une image a expiré |
| ⌨️ | En train d'écrire | Correspondant tape |

### Notifications navigateur

Pour activer les notifications :

1. Cliquez sur **"Autoriser"** quand demandé
2. Recevez des notifications même quand l'onglet n'est pas actif

**💡 Astuce** : Vous pouvez désactiver les notifications dans les paramètres de votre navigateur.

---

## 🛡️ Sécurité et confidentialité

### Protection des images

**Nos mesures de sécurité :**

1. **Rendu sur Canvas** : Les images ne sont pas des fichiers téléchargeables
2. **Filigrane invisible** : Chaque image est marquée
3. **Expiration automatique** : Suppression après 5 minutes
4. **Protection clic droit** : Désactivé sur les images
5. **Blocage captures** : Tentatives de screenshots bloquées

### Bonnes pratiques

✅ **À faire :**
- Utilisez un mot de passe fort (8+ caractères, chiffres, symboles)
- Déconnectez-vous sur les ordinateurs partagés
- Vérifiez toujours le destinataire avant d'envoyer

❌ **À éviter :**
- Partager votre mot de passe
- Laisser votre session ouverte
- Envoyer des informations sensibles par image

---

## ⚙️ Paramètres et options

### Options disponibles

| Option | Description |
|--------|-------------|
| Notifications | Activer/désactiver les notifications |
| Son | Activer/désactiver les sons |
| Thème | Clair / Sombre |
| Langue | Français / Anglais |

### Raccourcis clavier

| Touche | Action |
|--------|--------|
| `Entrée` | Envoyer le message |
| `Échap` | Fermer la conversation |
| `Ctrl + K` | Rechercher |

---

## 👨‍💼 Fonctionnalités Admin

### Compte administrateur

Les administrateurs ont des privilèges supplémentaires :

✅ **Permissions admin :**
- Voir tous les utilisateurs
- Supprimer des utilisateurs
- Supprimer tous les messages
- Voir les statistiques globales

### Panneau d'administration

Accessible via l'icône **🛡️** dans l'en-tête :

1. **Utilisateurs** : Gérer tous les comptes
2. **Messages** : Modération des messages
3. **Statistiques** : Analytiques de l'application
4. **Logs** : Journaux d'activité

---

## ❓ FAQ

### Comment savoir si mon message est lu ?

Les messages lus affichent une double coche : ✓✓

### Puis-je récupérer une image expirée ?

Non, les images expirées sont définitivement supprimées pour des raisons de sécurité.

### Quelle est la durée d'expiration des images ?

**5 minutes** après la première visualisation par le destinataire.

### Puis-je envoyer plusieurs images ?

Oui, mais une à la fois. Chaque image a son propre timer d'expiration.

### Y a-t-il une limite de messages ?

Non, vous pouvez envoyer un nombre illimité de messages texte. Les images sont limitées à 10 par minute.

### Comment signaler un contenu inapproprié ?

Contactez un administrateur via le menu "Aide" ou par email : `support@messagerie-app.com`

### L'application fonctionne-t-elle hors ligne ?

Non, une connexion internet est requise pour l'envoi et la réception de messages.

### Sur quels navigateurs l'app fonctionne ?

- ✅ Chrome (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ IE non supporté

---

## 🐛 Résolution des problèmes

### Problèmes courants

#### "Impossible de se connecter"

**Solutions :**
1. Vérifiez votre connexion internet
2. Vérifiez email et mot de passe
3. Videz le cache du navigateur
4. Réessayez dans quelques minutes

#### "L'image ne se charge pas"

**Solutions :**
1. Vérifiez la taille du fichier (< 5 MB)
2. Vérifiez le format (JPEG, PNG, GIF, WebP)
3. Essayez de compresser l'image
4. Rechargez la page

#### "Les notifications ne fonctionnent pas"

**Solutions :**
1. Autorisez les notifications dans votre navigateur
2. Vérifiez les paramètres de l'application
3. Rechargez la page
4. Essayez un autre navigateur

#### "Le timer d'expiration ne s'affiche pas"

**Solutions :**
1. L'image n'a peut-être pas encore été vue
2. Rechargez la page
3. Vérifiez votre connexion
4. Contactez le support

---

## 📱 Version mobile

### Application mobile

MessagerieApp est responsive et fonctionne sur mobile :

**Fonctionnalités mobiles :**
- ✅ Interface adaptée aux petits écrans
- ✅ Gestes tactiles (swipe, pinch)
- ✅ Notifications push
- ✅ Partage d'images depuis la galerie

**💡 Astuce** : Ajoutez l'app à votre écran d'accueil pour un accès rapide !

---

## 🆘 Support

### Besoin d'aide ?

**Plusieurs options :**

1. **Documentation** : Consultez ce guide
2. **FAQ** : Questions fréquentes
3. **Email** : support@messagerie-app.com
4. **Chat** : Support en direct (heures de bureau)
5. **Forum** : Communauté d'utilisateurs

**Temps de réponse moyen :** 24 heures

---

## 📜 Mentions légales

### Conditions d'utilisation

En utilisant MessagerieApp, vous acceptez :
- Les conditions générales d'utilisation
- La politique de confidentialité
- L'utilisation de cookies

### Confidentialité

- Vos données sont chiffrées
- Les images expirent automatiquement
- Nous ne vendons pas vos données
- Conformité RGPD

### Contact légal

Pour toute question légale :
- **Email** : legal@messagerie-app.com
- **Adresse** : [Votre adresse]

---

## 🎓 Tutoriels vidéo

**Vidéos disponibles :**
1. [Premiers pas avec MessagerieApp](https://youtube.com/...)
2. [Envoyer une image sécurisée](https://youtube.com/...)
3. [Comprendre l'expiration automatique](https://youtube.com/...)

---

## ✨ Nouveautés

### Version 2.0.0 (Janvier 2026)

**Nouvelles fonctionnalités :**
- 🔒 Expiration automatique des images
- 🎨 Interface redessinée
- ⚡ Performance améliorée
- 📱 Meilleure expérience mobile

**À venir :**
- 👥 Conversations de groupe
- 📞 Appels vidéo
- 📎 Partage de fichiers
- 🌙 Mode sombre

---

**Version du guide** : 2.0.0  
**Dernière mise à jour** : 18 janvier 2026  
**Contact** : support@messagerie-app.com