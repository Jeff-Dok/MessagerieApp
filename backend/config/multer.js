/**
 * ============================================
 * MULTER CONFIG - Configuration upload fichiers
 * ============================================
 *
 * Configuration pour l'upload d'images de messages et photos de profil
 *
 * @module config/multer
 * @version 3.0.0
 */

const multer = require("multer");
const path = require("path");
const { IMAGE_CONFIG, PROFILE_PHOTO_CONFIG } = require("../utils/constants");

/**
 * Configuration du stockage en mémoire
 * Les fichiers sont stockés temporairement en RAM
 */
const storage = multer.memoryStorage();

/**
 * Filtre pour accepter uniquement les images
 */
const fileFilter = (req, file, cb) => {
  // Déterminer quel type d'upload (photo de profil ou message)
  const isProfilePhoto =
    req.path.includes("register") || req.path.includes("profile");

  const allowedTypes = isProfilePhoto
    ? PROFILE_PHOTO_CONFIG.ALLOWED_TYPES
    : IMAGE_CONFIG.ALLOWED_TYPES;

  const allowedExtensions = isProfilePhoto
    ? PROFILE_PHOTO_CONFIG.ALLOWED_EXTENSIONS
    : IMAGE_CONFIG.ALLOWED_EXTENSIONS;

  // Vérifier l'extension du fichier
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  const isValidExtension = allowedExtensions.includes(ext);

  // Vérifier le type MIME
  const isValidMimeType = allowedTypes.includes(file.mimetype);

  if (isValidExtension && isValidMimeType) {
    // Fichier accepté
    cb(null, true);
  } else {
    // Fichier rejeté
    cb(
      new Error(
        `Type de fichier non autorisé. Types acceptés: ${allowedExtensions.join(", ")}`,
      ),
      false,
    );
  }
};

/**
 * Configuration de Multer
 */
const upload = multer({
  storage: storage,

  // Limite de taille de fichier
  limits: {
    fileSize: PROFILE_PHOTO_CONFIG.MAX_SIZE, // 5MB (le plus grand des deux)
    files: 1,
    fields: 20, // Augmenté pour les formulaires d'inscription
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
  },

  // Filtre de fichiers
  fileFilter: fileFilter,

  // Préservation de l'extension
  preservePath: false,
});

/**
 * Gestionnaire d'erreurs Multer personnalisé
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erreurs Multer
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: `Fichier trop volumineux. Taille maximale: ${PROFILE_PHOTO_CONFIG.MAX_SIZE / 1024 / 1024}MB`,
      });

      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Trop de fichiers. Maximum 1 fichier à la fois",
        });

      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message:
            'Champ de fichier inattendu. Utilisez "photoProfil" ou "image"',
      });

      default:
        return res.status(400).json({
          success: false,
          message: "Erreur lors de l'upload",
          detail: err.message,
      });
    }
  } else if (err) {
    // Autres erreurs (comme le fileFilter)
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;
