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

const sharp = require("sharp");
const { IMAGE_CONFIG } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Magic bytes (signatures) pour les formats d'images courants
 */
const IMAGE_SIGNATURES = {
  jpeg: [
    [0xff, 0xd8, 0xff, 0xe0], // JFIF
    [0xff, 0xd8, 0xff, 0xe1], // EXIF
    [0xff, 0xd8, 0xff, 0xe2], // ICC
    [0xff, 0xd8, 0xff, 0xe8], // SPIFF
    [0xff, 0xd8, 0xff, 0xdb], // Quantization table
  ],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF (suivi de WEBP)
};

/**
 * Service de gestion des images
 */
class ImageService {
  /**
   * Vérifie les magic bytes d'un buffer
   * @param {Buffer} buffer - Buffer du fichier
   * @returns {Object} Résultat avec le format détecté
   */
  static validateMagicBytes(buffer) {
    if (!buffer || buffer.length < 8) {
      return { valid: false, format: null, error: "Buffer invalide ou trop petit" };
    }

    // Vérifier chaque format
    for (const [format, signatures] of Object.entries(IMAGE_SIGNATURES)) {
      for (const signature of signatures) {
        let match = true;
        for (let i = 0; i < signature.length; i++) {
          if (buffer[i] !== signature[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          // Vérification supplémentaire pour WebP
          if (format === "webp") {
            const webpMarker = buffer.slice(8, 12).toString("ascii");
            if (webpMarker !== "WEBP") {
              continue;
            }
          }
          return { valid: true, format };
        }
      }
    }

    return { valid: false, format: null, error: "Format de fichier non reconnu" };
  }

  /**
   * Valide un fichier image (MIME type, taille et magic bytes)
   * @param {Object} file - Fichier uploadé (avec buffer)
   * @returns {Object} Résultat de la validation
   */
  static validateImage(file) {
    if (!file) {
      return {
        valid: false,
        error: "Aucun fichier fourni",
      };
    }

    // Vérifier le type MIME
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${IMAGE_CONFIG.ALLOWED_EXTENSIONS.join(", ")}`,
      };
    }

    // Vérifier la taille
    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximale: ${IMAGE_CONFIG.MAX_SIZE / 1024 / 1024}MB`,
      };
    }

    // Vérifier les magic bytes si le buffer est disponible
    if (file.buffer) {
      const magicValidation = this.validateMagicBytes(file.buffer);
      if (!magicValidation.valid) {
        logger.warn(
          `Tentative d'upload avec magic bytes invalides. MIME déclaré: ${file.mimetype}`,
        );
        return {
          valid: false,
          error: "Le contenu du fichier ne correspond pas à une image valide",
        };
      }

      // Vérifier la cohérence entre MIME et format détecté
      const mimeToFormat = {
        "image/jpeg": "jpeg",
        "image/jpg": "jpeg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
      };
      const expectedFormat = mimeToFormat[file.mimetype];
      if (expectedFormat && magicValidation.format !== expectedFormat) {
        logger.warn(
          `Incohérence MIME/magic bytes. MIME: ${file.mimetype}, Format réel: ${magicValidation.format}`,
        );
        return {
          valid: false,
          error: "Le type MIME ne correspond pas au contenu du fichier",
        };
      }
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
        addWatermark = false, // Désactiver le filigrane par défaut pour tester
      } = options;

      // Créer l'instance Sharp
      let image = sharp(buffer);

      // Obtenir les métadonnées
      const metadata = await image.metadata();
      logger.debug(
        `Image originale: ${metadata.width}x${metadata.height}, format: ${metadata.format}`,
      );

      // Calculer les dimensions finales après redimensionnement
      let finalWidth = metadata.width;
      let finalHeight = metadata.height;

      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        const ratio = Math.min(maxWidth / metadata.width, maxHeight / metadata.height);
        finalWidth = Math.round(metadata.width * ratio);
        finalHeight = Math.round(metadata.height * ratio);
      }

      // Redimensionner si nécessaire
      image = image.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });

      // Ajouter un filigrane invisible si demandé
      if (addWatermark) {
        try {
          const watermarkSvg = Buffer.from(`
            <svg width="${finalWidth}" height="${finalHeight}">
              <text
                x="50%"
                y="50%"
                text-anchor="middle"
                font-family="Arial"
                font-size="20"
                fill="white"
                opacity="0.05"
              >
                MessagerieApp
              </text>
            </svg>
          `);

          image = image.composite([
            {
              input: watermarkSvg,
              blend: "over",
            },
          ]);
        } catch (watermarkError) {
          logger.warn("Erreur lors de l'ajout du filigrane, traitement sans filigrane:", watermarkError.message);
          // Continue sans filigrane en cas d'erreur
        }
      }

      // Convertir en JPEG et optimiser
      const processedBuffer = await image
        .jpeg({ quality, progressive: true })
        .toBuffer();

      logger.debug(`Image traitée: ${processedBuffer.length} bytes`);

      return processedBuffer;
    } catch (error) {
      logger.error("Erreur lors du traitement de l'image:", error.message, error.stack);
      throw new Error(`Échec du traitement de l'image: ${error.message}`);
    }
  }

  /**
   * Convertit un buffer en Data URL Base64
   * @param {Buffer} buffer - Buffer de l'image
   * @param {string} mimeType - Type MIME de l'image
   * @returns {string} Data URL
   */
  static bufferToDataURL(buffer, mimeType = "image/jpeg") {
    const base64 = buffer.toString("base64");
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
    return this.bufferToDataURL(processedBuffer, "image/jpeg");
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
        orientation: metadata.orientation,
      };
    } catch (error) {
      logger.error("Erreur lors de la lecture des métadonnées:", error);
      throw new Error("Impossible de lire les informations de l'image");
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
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch (error) {
      logger.error("Erreur lors de la génération de la miniature:", error);
      throw new Error("Échec de la génération de la miniature");
    }
  }
}

module.exports = ImageService;
