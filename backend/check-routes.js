const fs = require("fs");
const path = require("path");

const routesDir = path.join(__dirname, "routes");
const files = ["auth.js", "users.js", "messages.js", "admin.js", "index.js"];

console.log("🔍 Vérification des fichiers de routes...\n");

files.forEach((file) => {
  const filePath = path.join(routesDir, file);

  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} : MANQUANT`);
    return;
  }

  // Lire le contenu
  const content = fs.readFileSync(filePath, "utf8");

  // Vérifier la présence de "module.exports = router"
  if (content.includes("module.exports = router")) {
    console.log(`✅ ${file} : Export correct`);
  } else if (content.includes("module.exports")) {
    console.log(`⚠️  ${file} : Export trouvé mais peut-être incorrect`);
    console.log(
      `   Dernière ligne : ${content.split("\n").slice(-5).join("\n")}`,
    );
  } else {
    console.log(`❌ ${file} : Aucun export trouvé`);
  }
});

console.log("\n🎯 Test d'importation...\n");

files.forEach((file) => {
  const moduleName = `${routesDir}/${file.replace(".js", "")}`;
  try {
    const imported = require(moduleName);
    const type = typeof imported;

    if (type === "function") {
      console.log(`✅ ${file} : Type correct (function)`);
    } else {
      console.log(`❌ ${file} : Type incorrect (${type})`);
      console.log(`   Export :`, Object.keys(imported));
    }
  } catch (error) {
    console.log(`❌ ${file} : Erreur d'import`);
    console.log(`   ${error.message}`);
  }
});
