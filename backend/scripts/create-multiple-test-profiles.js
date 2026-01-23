/**
 * ============================================
 * SCRIPT DE CRÉATION DE PROFILS DE TEST MULTIPLES
 * ============================================
 *
 * Crée plusieurs profils utilisateurs avec différents types de données manquantes
 * pour tester toutes les fonctionnalités de réparation
 *
 * Usage: node scripts/create-multiple-test-profiles.js
 */

const { sequelize } = require("../config/database");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function separator() {
  log("=".repeat(70), colors.cyan);
}

/**
 * Profils de test à créer
 */
const testProfiles = [
  {
    name: "Profil sans pseudo",
    description: "Manque uniquement le pseudo",
    data: {
      nom: "Jean Sans-Pseudo",
      email: "jean-sans-pseudo@test.com",
      ville: "Montréal",
      dateNaissance: "1990-05-15",
      bio: "Un utilisateur sans pseudo",
      // pseudo: manquant
    },
    issues: ["pseudo"],
  },
  {
    name: "Profil sans ville",
    description: "Manque uniquement la ville",
    data: {
      nom: "Marie Sans-Ville",
      pseudo: "marie_ville",
      email: "marie-sans-ville@test.com",
      dateNaissance: "1992-08-20",
      bio: "Une utilisatrice sans ville",
      // ville: manquant
    },
    issues: ["ville"],
  },
  {
    name: "Profil sans date de naissance",
    description: "Manque uniquement la date de naissance",
    data: {
      nom: "Pierre Sans-Age",
      pseudo: "pierre_age",
      email: "pierre-sans-age@test.com",
      ville: "Québec",
      bio: "Un utilisateur sans âge",
      // dateNaissance: manquant
    },
    issues: ["dateNaissance"],
  },
  {
    name: "Profil minimal",
    description: "Seulement nom, email et password (tout le reste manque)",
    data: {
      nom: "Sophie Minimale",
      email: "sophie-minimale@test.com",
      // Tout le reste manque
    },
    issues: ["pseudo", "ville", "dateNaissance", "bio"],
  },
  {
    name: "Profil sans nom",
    description: "Manque le nom (champ normalement obligatoire)",
    data: {
      pseudo: "user_sans_nom",
      email: "sans-nom@test.com",
      ville: "Laval",
      dateNaissance: "1988-03-12",
      bio: "Profil sans nom",
      // nom: manquant
    },
    issues: ["nom"],
  },
  {
    name: "Profil complètement vide",
    description: "Seulement email et password (test extrême)",
    data: {
      email: "vide@test.com",
      // Tout le reste manque
    },
    issues: ["nom", "pseudo", "ville", "dateNaissance", "bio"],
  },
  {
    name: "Profil sans email",
    description: "Manque l'email (champ critique)",
    data: {
      nom: "Alex Sans-Email",
      pseudo: "alex_email",
      ville: "Sherbrooke",
      dateNaissance: "1995-11-30",
      bio: "Utilisateur sans email",
      // email: manquant - devra être généré
    },
    issues: ["email"],
  },
  {
    name: "Profil incomplet multiple",
    description: "Manque nom, pseudo et ville",
    data: {
      email: "incomplet-multiple@test.com",
      dateNaissance: "1991-07-22",
      bio: "Profil avec plusieurs champs manquants",
      // nom, pseudo, ville: manquants
    },
    issues: ["nom", "pseudo", "ville"],
  },
];

/**
 * Génère un mot de passe hashé
 */
async function generatePassword() {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash("test123456", salt);
}

/**
 * Crée un profil avec des données spécifiques
 */
async function createProfile(profileConfig, index) {
  try {
    const password = await generatePassword();
    const data = profileConfig.data;

    // Construire la requête SQL dynamiquement
    const fields = ["password", "statut", "role", '"dateCreation"', '"dateModification"'];
    const values = [":password", "'pending'", "'user'", "NOW()", "NOW()"];
    const replacements = { password };

    // Ajouter les champs fournis
    if (data.nom) {
      fields.push("nom");
      values.push(":nom");
      replacements.nom = data.nom;
    }

    if (data.pseudo) {
      fields.push("pseudo");
      values.push(":pseudo");
      replacements.pseudo = data.pseudo;
    }

    if (data.email) {
      fields.push("email");
      values.push(":email");
      replacements.email = data.email;
    } else {
      // Générer un email unique si manquant
      const timestamp = Date.now();
      fields.push("email");
      values.push(":email");
      replacements.email = `user-${timestamp}-${index}@generated.test`;
    }

    if (data.ville) {
      fields.push("ville");
      values.push(":ville");
      replacements.ville = data.ville;
    }

    if (data.dateNaissance) {
      fields.push('"dateNaissance"');
      values.push(":dateNaissance");
      replacements.dateNaissance = data.dateNaissance;
    }

    if (data.bio) {
      fields.push("bio");
      values.push(":bio");
      replacements.bio = data.bio;
    }

    const query = `
      INSERT INTO users (${fields.join(", ")})
      VALUES (${values.join(", ")})
      RETURNING id
    `;

    const [result] = await sequelize.query(query, { replacements });
    return result[0].id;
  } catch (error) {
    throw new Error(`Erreur création profil: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    separator();
    log("🔧 CRÉATION DE PROFILS DE TEST MULTIPLES", colors.bright);
    separator();

    log("\n📡 Connexion à la base de données...", colors.cyan);
    await sequelize.authenticate();
    log("✅ Connexion établie\n", colors.green);

    log(`📦 Nombre de profils à créer: ${testProfiles.length}\n`, colors.bright);

    const createdProfiles = [];

    for (let i = 0; i < testProfiles.length; i++) {
      const profile = testProfiles[i];

      log(`[${i + 1}/${testProfiles.length}] ${profile.name}`, colors.cyan);
      log(`    Description: ${profile.description}`, colors.reset);
      log(`    Problèmes: ${colors.red}${profile.issues.join(", ")}${colors.reset}`);

      try {
        const userId = await createProfile(profile, i);
        createdProfiles.push({
          id: userId,
          name: profile.name,
          issues: profile.issues,
        });

        log(`    ✅ Créé avec ID: ${userId}\n`, colors.green);
      } catch (error) {
        log(`    ❌ Erreur: ${error.message}\n`, colors.red);
      }
    }

    separator();
    log("\n📊 RÉSUMÉ DE LA CRÉATION", colors.bright);
    separator();

    log(`\n✅ Profils créés: ${createdProfiles.length}/${testProfiles.length}\n`, colors.green);

    if (createdProfiles.length > 0) {
      log("📋 Liste des profils créés:", colors.cyan);
      createdProfiles.forEach((profile) => {
        log(`   • ID ${profile.id}: ${profile.name}`, colors.reset);
        log(`     Problèmes: ${colors.red}${profile.issues.join(", ")}${colors.reset}`);
      });
    }

    // Compter le total de profils incomplets
    log("\n🔍 Vérification dans la base de données...", colors.cyan);
    const allUsers = await User.findAll({
      attributes: ["id", "nom", "pseudo", "email", "ville", "dateNaissance"],
    });

    let incompleteCount = 0;
    for (const user of allUsers) {
      if (!user.pseudo || !user.nom || !user.email || !user.ville || !user.dateNaissance) {
        incompleteCount++;
      }
    }

    log(`📈 Total de profils incomplets dans la DB: ${incompleteCount}`, colors.bright);

    separator();
    log("\n💡 PROCHAINES ÉTAPES", colors.cyan);
    separator();

    log("\n1. Ouvrez fix-profiles.html pour voir tous les profils:");
    log("   http://localhost:5500/frontend/fix-profiles.html\n");

    log("2. Testez les corrections individuelles:");
    log("   - Cliquez sur le bouton ✅ pour corriger un profil");
    log("   - Vérifiez les valeurs générées automatiquement\n");

    log("3. Testez les corrections en masse:");
    log("   - Cliquez sur 'Corriger tous les profils'");
    log("   - Vérifiez que tous sont corrigés\n");

    log("4. Testez les suppressions:");
    log("   - Essayez de supprimer un profil individuel");
    log("   - Essayez de supprimer tous les profils\n");

    log("5. Testez l'affichage dans admin.html:");
    log("   - Rafraîchissez la page admin");
    log("   - Le bouton 'Réparer' devrait apparaître si erreur\n");

    log("🔑 Mot de passe pour tous les profils: test123456\n", colors.yellow);

    separator();

    await sequelize.close();
    log("\n👋 Terminé!\n", colors.green);
    process.exit(0);
  } catch (error) {
    log(`\n❌ ERREUR CRITIQUE: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter
main();
