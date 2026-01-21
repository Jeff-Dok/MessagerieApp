const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = ['auth.js', 'users.js', 'messages.js', 'admin.js', 'index.js'];

console.log('��� Vérification des routes...\n');

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} : MANQUANT`);
    return;
  }
  
  try {
    const imported = require(filePath);
    const type = typeof imported;
    
    if (type === 'function') {
      console.log(`✅ ${file} : OK (function)`);
    } else {
      console.log(`❌ ${file} : ERREUR (${type})`);
    }
  } catch (error) {
    console.log(`❌ ${file} : ${error.message}`);
  }
});