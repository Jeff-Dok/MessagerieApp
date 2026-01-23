# Guide de Réinitialisation du Mot de Passe PostgreSQL

## Méthode 1: Via pgAdmin (LA PLUS SIMPLE)

1. Ouvrez **pgAdmin** (si installé)
2. Connectez-vous avec votre mot de passe actuel
3. Dans l'arborescence de gauche, faites un clic droit sur **PostgreSQL** → **Servers** → votre serveur
4. Allez dans **Login/Group Roles** → clic droit sur **postgres** → **Properties**
5. Allez dans l'onglet **Definition**
6. Entrez le nouveau mot de passe: `1066703`
7. Cliquez sur **Save**
8. Fermez pgAdmin
9. Relancez le serveur Node.js

## Méthode 2: Via Adminer (RECOMMANDÉE)

1. Démarrez le serveur PHP avec le fichier `start-adminer.bat`
2. Ouvrez votre navigateur: http://localhost:8080/adminer.php
3. Connectez-vous avec votre mot de passe actuel:
   - Système: PostgreSQL
   - Serveur: localhost:5432
   - Utilisateur: postgres
   - Mot de passe: [votre mot de passe actuel]
   - Base de données: postgres
4. Une fois connecté, cliquez sur **Commande SQL** dans le menu
5. Copiez et collez cette commande:
   ```sql
   ALTER USER postgres WITH PASSWORD '1066703';
   ```
6. Cliquez sur **Exécuter**
7. Fermez Adminer
8. Relancez le serveur Node.js

## Méthode 3: Via psql en ligne de commande

1. Ouvrez l'invite de commandes Windows (cmd)
2. Localisez votre installation PostgreSQL (généralement dans `C:\Program Files\PostgreSQL\XX\bin`)
3. Exécutez la commande suivante (remplacez XX par votre version):
   ```bash
   "C:\Program Files\PostgreSQL\XX\bin\psql.exe" -U postgres -d postgres
   ```
4. Entrez votre mot de passe actuel quand demandé
5. Dans le terminal psql, exécutez:
   ```sql
   ALTER USER postgres WITH PASSWORD '1066703';
   \q
   ```
6. Relancez le serveur Node.js

## Méthode 4: Modification de pg_hba.conf (AVANCÉE)

**ATTENTION**: Cette méthode nécessite des droits administrateur.

1. Localisez le fichier `pg_hba.conf` (généralement dans `C:\Program Files\PostgreSQL\XX\data`)
2. Faites une copie de sauvegarde de ce fichier
3. Ouvrez `pg_hba.conf` avec un éditeur de texte en tant qu'administrateur
4. Trouvez les lignes qui ressemblent à:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   ```
5. Remplacez temporairement `scram-sha-256` par `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   ```
6. Enregistrez le fichier
7. Redémarrez le service PostgreSQL:
   - Ouvrez les Services Windows (Win+R → `services.msc`)
   - Trouvez "PostgreSQL"
   - Clic droit → Redémarrer
8. Exécutez le script SQL:
   ```bash
   psql -U postgres -d postgres -f reset-postgres-password.sql
   ```
9. Restaurez pg_hba.conf (remettez `scram-sha-256`)
10. Redémarrez à nouveau PostgreSQL
11. Relancez le serveur Node.js

## Après avoir changé le mot de passe

Une fois le mot de passe changé, testez la connexion:
```bash
node backend/server.js
```

Vous devriez voir:
```
✅ Connexion à la base de données réussie
✅ Modèles synchronisés
✅ Socket.io initialisé
✅ Service de nettoyage démarré
✅ Serveur PHP démarré sur http://localhost:8080
🚀 Serveur démarré avec succès
```

## Si vous ne connaissez pas votre mot de passe actuel

Utilisez la **Méthode 4** ci-dessus pour réinitialiser le mot de passe sans authentification.
