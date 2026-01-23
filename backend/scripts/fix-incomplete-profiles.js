/**
 * ============================================
 * SCRIPT DE CORRECTION DES PROFILS INCOMPLETS
 * ============================================
 *
 * Ce script identifie et corrige les utilisateurs avec des données manquantes
 *
 * Usage:
 *   node scripts/fix-incomplete-profiles.js --check    (vérification seulement)
 *   node scripts/fix-incomplete-profiles.js --fix      (correction automatique)
 */

const { sequelize } = require("../config/database");
const User = require("../models/User");
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
};

/**
 * Affiche un message coloré
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Affiche un séparateur
 */
function separator() {
  log("=".repeat(70), colors.cyan);
}

/**
 * Vérifie si un champ est vide ou null
 */
function isNullOrEmpty(value) {
  return value === null || value === undefined || value === "";
}

/**
 * Identifie les profils avec des données manquantes
 */
async function identifyIncompleteProfiles() {
  try {
    log("\n🔍 Recherche des profils incomplets...\n", colors.cyan);

    const allUsers = await User.findAll({
      attributes: ["id", "nom", "pseudo", "email", "ville", "dateNaissance", "bio", "statut"],
    });

    const incompleteProfiles = [];

    for (const user of allUsers) {
      const issues = [];

      // Vérifier les champs obligatoires
      if (isNullOrEmpty(user.pseudo)) {
        issues.push("pseudo manquant");
      }
      if (isNullOrEmpty(user.nom)) {
        issues.push("nom manquant");
      }
      if (isNullOrEmpty(user.email)) {
        issues.push("email manquant");
      }

      // Vérifier les champs optionnels mais recommandés
      if (isNullOrEmpty(user.ville)) {
        issues.push("ville manquante");
      }
      if (isNullOrEmpty(user.dateNaissance)) {
        issues.push("date de naissance manquante");
      }

      if (issues.length > 0) {
        incompleteProfiles.push({
          user,
          issues,
        });
      }
    }

    return incompleteProfiles;
  } catch (error) {
    log(`❌ Erreur lors de l'identification: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Affiche les profils incomplets
 */
function displayIncompleteProfiles(incompleteProfiles) {
  separator();
  log(`📊 RÉSULTATS DE L'ANALYSE`, colors.bright);
  separator();

  if (incompleteProfiles.length === 0) {
    log("\n✅ Aucun profil incomplet trouvé!", colors.green);
    log("Tous les profils ont des données complètes.\n", colors.green);
    return;
  }

  log(`\n⚠️  ${incompleteProfiles.length} profil(s) incomplet(s) trouvé(s):\n`, colors.yellow);

  incompleteProfiles.forEach((item, index) => {
    const { user, issues } = item;

    log(`\n[${index + 1}] ID: ${user.id}`, colors.bright);
    log(`    Pseudo: ${user.pseudo || colors.red + "NULL" + colors.reset}`);
    log(`    Nom: ${user.nom || colors.red + "NULL" + colors.reset}`);
    log(`    Email: ${user.email || colors.red + "NULL" + colors.reset}`);
    log(`    Ville: ${user.ville || colors.red + "NULL" + colors.reset}`);
    log(`    Date naissance: ${user.dateNaissance || colors.red + "NULL" + colors.reset}`);
    log(`    Statut: ${user.statut}`);
    log(`    Problèmes: ${colors.red}${issues.join(", ")}${colors.reset}`);
  });

  log("\n");
}

/**
 * Corrige les profils incomplets
 */
async function fixIncompleteProfiles(incompleteProfiles) {
  try {
    separator();
    log(`🔧 CORRECTION DES PROFILS INCOMPLETS`, colors.bright);
    separator();

    let fixedCount = 0;
    let errorCount = 0;

    for (const item of incompleteProfiles) {
      const { user, issues } = item;

      try {
        const updates = {};

        // Générer des valeurs par défaut pour les champs manquants
        if (isNullOrEmpty(user.pseudo)) {
          // Générer un pseudo basé sur l'email ou un ID
          if (user.email) {
            const emailPrefix = user.email.split("@")[0];
            updates.pseudo = `user_${emailPrefix}_${user.id}`;
          } else {
            updates.pseudo = `user_${user.id}`;
          }
        }

        if (isNullOrEmpty(user.nom)) {
          updates.nom = user.pseudo || `Utilisateur ${user.id}`;
        }

        if (isNullOrEmpty(user.email)) {
          // Ceci est critique - l'email devrait toujours exister
          updates.email = `user${user.id}@messagerie-app.local`;
          log(`  ⚠️  Email généré pour ID ${user.id}: ${updates.email}`, colors.yellow);
        }

        if (isNullOrEmpty(user.ville)) {
          updates.ville = "Non spécifié";
        }

        // Note: On ne génère pas de date de naissance par défaut car c'est sensible

        // Mettre à jour l'utilisateur
        await user.update(updates);

        log(`  ✅ Profil ${user.id} corrigé`, colors.green);
        log(`     Mises à jour: ${Object.keys(updates).join(", ")}`, colors.cyan);

        fixedCount++;
      } catch (error) {
        log(`  ❌ Erreur lors de la correction du profil ${user.id}: ${error.message}`, colors.red);
        errorCount++;
      }
    }

    separator();
    log(`\n📈 RÉSUMÉ DE LA CORRECTION:`, colors.bright);
    log(`   ✅ Profils corrigés: ${fixedCount}`, colors.green);
    if (errorCount > 0) {
      log(`   ❌ Erreurs: ${errorCount}`, colors.red);
    }
    log("\n");
  } catch (error) {
    log(`❌ Erreur lors de la correction: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    const mode = args[0];

    separator();
    log("🔧 SCRIPT DE CORRECTION DES PROFILS INCOMPLETS", colors.bright);
    separator();

    // Connexion à la base de données
    log("\n📡 Connexion à la base de données...", colors.cyan);
    await sequelize.authenticate();
    log("✅ Connexion établie\n", colors.green);

    // Identifier les profils incomplets
    const incompleteProfiles = await identifyIncompleteProfiles();

    // Afficher les résultats
    displayIncompleteProfiles(incompleteProfiles);

    // Corriger si demandé
    if (mode === "--fix" && incompleteProfiles.length > 0) {
      log("🔧 Mode correction activé\n", colors.yellow);
      await fixIncompleteProfiles(incompleteProfiles);

      // Vérifier à nouveau
      log("🔍 Vérification post-correction...\n", colors.cyan);
      const remainingIssues = await identifyIncompleteProfiles();

      if (remainingIssues.length === 0) {
        log("✅ Tous les profils ont été corrigés avec succès!", colors.green);
      } else {
        log(`⚠️  ${remainingIssues.length} profil(s) nécessitent encore une attention manuelle`, colors.yellow);
        displayIncompleteProfiles(remainingIssues);
      }
    } else if (mode === "--check") {
      log("ℹ️  Mode vérification uniquement (utilisez --fix pour corriger)", colors.blue);
    } else if (!mode && incompleteProfiles.length > 0) {
      separator();
      log("\n💡 COMMENT UTILISER CE SCRIPT:", colors.cyan);
      log("   node scripts/fix-incomplete-profiles.js --check    (vérification seulement)");
      log("   node scripts/fix-incomplete-profiles.js --fix      (correction automatique)\n");
    }

    // Fermer la connexion
    await sequelize.close();
    log("👋 Terminé!\n", colors.green);
    process.exit(0);
  } catch (error) {
    log(`\n❌ ERREUR CRITIQUE: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
main();
