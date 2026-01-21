/**
 * ============================================
 * PROFILE PHOTO SERVICE - Traitement photos de profil
 * ============================================
 *
 * Service dédié au traitement des photos de profil
 *
 * @module services/profilePhotoService
 */

const sharp = require("sharp");
const { PROFILE_PHOTO_CONFIG } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Service de gestion des photos de profil
 */
class ProfilePhotoService {
  /**
   * Valide une photo de profil
   * @param {Object} file - Fichier uploadé
   * @returns {Object} Résultat de la validation
   */
  static validateProfilePhoto(file) {
    if (!file) {
      return {
        valid: false,
        error: "Aucune photo fournie",
      };
    }

    // Vérifier le type MIME
    if (!PROFILE_PHOTO_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${PROFILE_PHOTO_CONFIG.ALLOWED_EXTENSIONS.join(", ")}`,
      };
    }

    // Vérifier la taille
    if (file.size > PROFILE_PHOTO_CONFIG.MAX_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximale: ${PROFILE_PHOTO_CONFIG.MAX_SIZE / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Traite une photo de profil (redimensionne, optimise)
   * @param {Buffer} buffer - Buffer de l'image
   * @returns {Promise<Buffer>} Image traitée
   */
  static async processProfilePhoto(buffer) {
    try {
      const { MAX_WIDTH, MAX_HEIGHT, QUALITY } = PROFILE_PHOTO_CONFIG;

      // Créer l'instance Sharp
      let image = sharp(buffer);

      // Obtenir les métadonnées
      const metadata = await image.metadata();
      logger.debug(
        `Photo profil originale: ${metadata.width}x${metadata.height}`,
      );

      // Redimensionner en carré (cover)
      image = image.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "cover",
        position: "center",
      });

      // Convertir en JPEG circulaire
      const processedBuffer = await image
        .jpeg({ quality: QUALITY, progressive: true })
        .toBuffer();

      logger.debug(`Photo profil traitée: ${processedBuffer.length} bytes`);

      // Convertir en Data URL
      const dataUrl = this.bufferToDataURL(processedBuffer);

      return {
        buffer: processedBuffer,
        dataUrl,
        size: processedBuffer.length,
      };
    } catch (error) {
      logger.error("Erreur lors du traitement de la photo:", error);
      throw new Error("Échec du traitement de la photo de profil");
    }
  }

  /**
   * Convertit un buffer en Data URL Base64
   * @param {Buffer} buffer - Buffer de l'image
   * @returns {string} Data URL
   */
  static bufferToDataURL(buffer) {
    const base64 = buffer.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  }

  /**
   * Génère une miniature de photo de profil
   * @param {Buffer} buffer - Buffer de l'image
   * @param {number} size - Taille de la miniature
   * @returns {Promise<Buffer>} Buffer de la miniature
   */
  static async generateThumbnail(buffer, size = 100) {
    try {
      return await sharp(buffer)
        .resize(size, size, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      logger.error("Erreur génération miniature:", error);
      throw new Error("Échec de la génération de la miniature");
    }
  }

  /**
   * Extrait les informations d'une photo
   * @param {Buffer} buffer - Buffer de l'image
   * @returns {Promise<Object>} Métadonnées
   */
  static async getPhotoInfo(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
      };
    } catch (error) {
      logger.error("Erreur lecture métadonnées:", error);
      throw new Error("Impossible de lire les informations de la photo");
    }
  }
}

module.exports = ProfilePhotoService;
