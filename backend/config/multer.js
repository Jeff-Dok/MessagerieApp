/**
 * ============================================
 * MULTER CONFIG - Configuration upload fichiers
 * ============================================
 * 
 * Configuration pour l'upload d'images avec Multer
 * 
 * @module config/multer
 */

const multer = require('multer');
const path = require('path');
const { IMAGE_CONFIG } = require('../utils/constants');

/**
 * Configuration du stockage en mémoire
 * Les fichiers sont stockés temporairement en RAM
 */
const storage = multer.memoryStorage();

/**
 * Filtre pour accepter uniquement les images
 */
const fileFilter = (req, file, cb) => {
  // Vérifier l'extension du fichier
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  const isValidExtension = IMAGE_CONFIG.ALLOWED_EXTENSIONS.includes(ext);
  
  // Vérifier le type MIME
  const isValidMimeType = IMAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype);
  
  if (isValidExtension && isValidMimeType) {
    // Fichier accepté
    cb(null, true);
  } else {
    // Fichier rejeté
    cb(new Error(
      `Type de fichier non autorisé. Types acceptés: ${IMAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    ), false);
  }
};

/**
 * Configuration de Multer
 */
const upload = multer({
  storage: storage,
  
  // Limite de taille de fichier
  limits: {
    fileSize: IMAGE_CONFIG.MAX_SIZE,           // 5MB par défaut
    files: 1,                                   // 1 fichier à la fois
    fields: 10,                                 // Maximum de champs
    fieldNameSize: 100,                         // Longueur max du nom de champ
    fieldSize: 1024 * 1024                     // 1MB pour les champs texte
  },
  
  // Filtre de fichiers
  fileFilter: fileFilter,
  
  // Préservation de l'extension
  preservePath: false
});

/**
 * Gestionnaire d'erreurs Multer personnalisé
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erreurs Multer
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `Fichier trop volumineux. Taille maximale: ${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB`
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Trop de fichiers. Maximum 1 fichier à la fois'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Champ de fichier inattendu. Utilisez "image"'
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Erreur lors de l\'upload',
          detail: err.message
        });
    }
  } else if (err) {
    // Autres erreurs (comme le fileFilter)
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;