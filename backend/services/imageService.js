/**
 * ============================================
 * IMAGE SERVICE - Traitement des images
 * ============================================
 * 
 * Service dédié au traitement et à la gestion des images
 * 
 * Fonctionnalités:
 * - Validation des images
 * - Redimensionnement et optimisation
 * - Conversion en Base64
 * - Ajout de filigrane
 * 
 * @module services/imageService
 */

const sharp = require('sharp');
const { IMAGE_CONFIG } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Service de gestion des images
 */
class ImageService {
  /**
   * Valide un fichier image
   * @param {Object} file - Fichier uploadé
   * @returns {Object} Résultat de la validation
   */
  static validateImage(file) {
    if (!file) {
      return {
        valid: false,
        error: 'Aucun fichier fourni'
      };
    }

    // Vérifier le type MIME
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${IMAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Vérifier la taille
    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximale: ${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Traite une image (redimensionne, optimise, ajoute filigrane)
   * @param {Buffer} buffer - Buffer de l'image
   * @param {Object} options - Options de traitement
   * @returns {Promise<Buffer>} Image traitée
   */
  static async processImage(buffer, options = {}) {
    try {
      const {
        maxWidth = IMAGE_CONFIG.MAX_WIDTH,
        maxHeight = IMAGE_CONFIG.MAX_HEIGHT,
        quality = IMAGE_CONFIG.QUALITY,
        addWatermark = true
      } = options;

      // Créer l'instance Sharp
      let image = sharp(buffer);

      // Obtenir les métadonnées
      const metadata = await image.metadata();
      logger.debug(`Image originale: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      // Redimensionner si nécessaire
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Ajouter un filigrane invisible si demandé
      if (addWatermark) {
        const watermarkSvg = Buffer.from(`
          <svg width="${maxWidth}" height="${maxHeight}">
            <text 
              x="50%" 
              y="50%" 
              text-anchor="middle" 
              font-family="Arial" 
              font-size="20" 
              fill="white" 
              opacity="0.05"
            >
              MessagerieApp - Protégé
            </text>
          </svg>
        `);

        image = image.composite([{
          input: watermarkSvg,
          blend: 'over'
        }]);
      }

      // Convertir en JPEG et optimiser
      const processedBuffer = await image
        .jpeg({ quality, progressive: true })
        .toBuffer();

      logger.debug(`Image traitée: ${processedBuffer.length} bytes`);

      return processedBuffer;
    } catch (error) {
      logger.error('Erreur lors du traitement de l\'image:', error);
      throw new Error('Échec du traitement de l\'image');
    }
  }

  /**
   * Convertit un buffer en Data URL Base64
   * @param {Buffer} buffer - Buffer de l'image
   * @param {string} mimeType - Type MIME de l'image
   * @returns {string} Data URL
   */
  static bufferToDataURL(buffer, mimeType = 'image/jpeg') {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Traite et convertit une image en Data URL
   * @param {Buffer} buffer - Buffer de l'image originale
   * @param {Object} options - Options de traitement
   * @returns {Promise<string>} Data URL de l'image traitée
   */
  static async processAndEncode(buffer, options = {}) {
    const processedBuffer = await this.processImage(buffer, options);
    return this.bufferToDataURL(processedBuffer, 'image/jpeg');
  }

  /**
   * Extrait les informations d'une image
   * @param {Buffer} buffer - Buffer de l'image
   * @returns {Promise<Object>} Métadonnées de l'image
   */
  static async getImageInfo(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };
    } catch (error) {
      logger.error('Erreur lors de la lecture des métadonnées:', error);
      throw new Error('Impossible de lire les informations de l\'image');
    }
  }

  /**
   * Génère une miniature
   * @param {Buffer} buffer - Buffer de l'image
   * @param {number} size - Taille de la miniature
   * @returns {Promise<Buffer>} Buffer de la miniature
   */
  static async generateThumbnail(buffer, size = 150) {
    try {
      return await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch (error) {
      logger.error('Erreur lors de la génération de la miniature:', error);
      throw new Error('Échec de la génération de la miniature');
    }
  }
}

module.exports = ImageService;