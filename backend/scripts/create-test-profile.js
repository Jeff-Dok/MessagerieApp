/**
 * ============================================
 * SCRIPT DE CRÉATION DE PROFIL DE TEST
 * ============================================
 *
 * Crée un profil utilisateur avec des données manquantes
 * pour tester la fonctionnalité de réparation
 *
 * Usage: node scripts/create-test-profile.js
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
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function separator() {
  log("=".repeat(70), colors.cyan);
}

/**
 * Crée un profil avec des données manquantes
 */
async function createIncompleteProfile() {
  try {
    separator();
    log("🔧 CRÉATION D'UN PROFIL DE TEST INCOMPLET", colors.bright);
    separator();

    log("\n📡 Connexion à la base de données...", colors.cyan);
    await sequelize.authenticate();
    log("✅ Connexion établie\n", colors.green);

    // Hasher un mot de passe par défaut
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("test123456", salt);

    log("👤 Création du profil de test...\n", colors.cyan);

    // Créer un utilisateur avec des champs manquants
    // On doit utiliser une requête SQL brute pour contourner les validations
    const [result] = await sequelize.query(`
      INSERT INTO users (
        nom,
        email,
        password,
        statut,
        role,
        "dateCreation",
        "dateModification"
      ) VALUES (
        'Test User Incomplet',
        'test-incomplete@example.com',
        :password,
        'pending',
        'user',
        NOW(),
        NOW()
      ) RETURNING id
    `, {
      replacements: {
        password: hashedPassword
      }
    });

    const userId = result[0].id;

    separator();
    log("\n✅ PROFIL DE TEST CRÉÉ AVEC SUCCÈS!", colors.green);
    separator();

    log("\n📊 Détails du profil créé:", colors.bright);
    log(`   ID: ${userId}`, colors.cyan);
    log(`   Nom: Test User Incomplet`, colors.cyan);
    log(`   Email: test-incomplete@example.com`, colors.cyan);
    log(`   Mot de passe: test123456`, colors.cyan);
    log(`   Statut: pending`, colors.cyan);
    log(`   Rôle: user`, colors.cyan);

    log("\n⚠️  Champs manquants (NULL):", colors.yellow);
    log(`   - pseudo`, colors.red);
    log(`   - ville`, colors.red);
    log(`   - dateNaissance`, colors.red);
    log(`   - bio`, colors.red);
    log(`   - photoProfil`, colors.red);

    log("\n💡 Vous pouvez maintenant:", colors.cyan);
    log("   1. Ouvrir fix-profiles.html pour voir le profil");
    log("   2. Tester la correction automatique");
    log("   3. Tester la suppression du profil\n");

    // Vérifier combien de profils incomplets il y a maintenant
    const allUsers = await User.findAll({
      attributes: ["id", "nom", "pseudo", "email", "ville"],
    });

    let incompleteCount = 0;
    for (const user of allUsers) {
      if (!user.pseudo || !user.ville) {
        incompleteCount++;
      }
    }

    log(`📈 Total de profils incomplets: ${incompleteCount}\n`, colors.bright);

    await sequelize.close();
    log("👋 Terminé!\n", colors.green);
    process.exit(0);
  } catch (error) {
    log(`\n❌ ERREUR: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter
createIncompleteProfile();
