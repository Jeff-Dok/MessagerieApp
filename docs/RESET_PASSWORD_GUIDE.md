# Guide de Reinitialisation du Mot de Passe PostgreSQL

## Methode 1: Via pgAdmin

1. Ouvrez **pgAdmin** (si installe)
2. Connectez-vous avec votre mot de passe actuel
3. Dans l'arborescence de gauche, faites un clic droit sur **PostgreSQL** > **Servers** > votre serveur
4. Allez dans **Login/Group Roles** > clic droit sur **postgres** > **Properties**
5. Allez dans l'onglet **Definition**
6. Entrez le nouveau mot de passe
7. Cliquez sur **Save**
8. Fermez pgAdmin
9. Relancez le serveur Node.js

## Methode 2: Via Adminer (Recommandee)

1. Demarrez le serveur avec `npm run dev`
2. Ouvrez votre navigateur: http://localhost:8080/tools/adminer/adminer-login.php
3. Connectez-vous avec votre mot de passe actuel:
   - Systeme: PostgreSQL
   - Serveur: localhost:5432
   - Utilisateur: postgres
   - Mot de passe: [votre mot de passe actuel]
   - Base de donnees: postgres
4. Une fois connecte, cliquez sur **Commande SQL** dans le menu
5. Copiez et collez cette commande:
   ```sql
   ALTER USER postgres WITH PASSWORD 'nouveau_mot_de_passe';
   ```
6. Cliquez sur **Executer**
7. Fermez Adminer
8. Relancez le serveur Node.js

## Methode 3: Via psql en ligne de commande

1. Ouvrez l'invite de commandes Windows (cmd)
2. Localisez votre installation PostgreSQL (generalement dans `C:\Program Files\PostgreSQL\XX\bin`)
3. Executez la commande suivante (remplacez XX par votre version):
   ```bash
   "C:\Program Files\PostgreSQL\XX\bin\psql.exe" -U postgres -d postgres
   ```
4. Entrez votre mot de passe actuel quand demande
5. Dans le terminal psql, executez:
   ```sql
   ALTER USER postgres WITH PASSWORD 'nouveau_mot_de_passe';
   \q
   ```
6. Relancez le serveur Node.js

## Methode 4: Modification de pg_hba.conf (Avancee)

**ATTENTION**: Cette methode necessite des droits administrateur.

1. Localisez le fichier `pg_hba.conf` (generalement dans `C:\Program Files\PostgreSQL\XX\data`)
2. Faites une copie de sauvegarde de ce fichier
3. Ouvrez `pg_hba.conf` avec un editeur de texte en tant qu'administrateur
4. Trouvez les lignes qui ressemblent a:
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
7. Redemarrez le service PostgreSQL:
   - Ouvrez les Services Windows (Win+R > `services.msc`)
   - Trouvez "PostgreSQL"
   - Clic droit > Redemarrer
8. Executez la commande SQL pour changer le mot de passe
9. Restaurez pg_hba.conf (remettez `scram-sha-256`)
10. Redemarrez a nouveau PostgreSQL
11. Relancez le serveur Node.js

## Apres avoir change le mot de passe

Une fois le mot de passe change, testez la connexion:
```bash
npm run dev
```

Vous devriez voir:
```
Connexion a la base de donnees reussie
Modeles synchronises
Socket.io initialise
Service de nettoyage demarre
Serveur PHP demarre sur http://localhost:8080
Serveur demarre avec succes
```

## Si vous ne connaissez pas votre mot de passe actuel

Utilisez la **Methode 4** ci-dessus pour reinitialiser le mot de passe sans authentification.

---

**Derniere mise a jour :** 2026-01-22
**Version :** 1.1.0
