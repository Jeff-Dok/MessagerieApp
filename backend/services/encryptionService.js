/**
 * ============================================
 * ENCRYPTION SERVICE - Service de chiffrement
 * ============================================
 *
 * Gère le chiffrement/déchiffrement des données sensibles
 * Utilise AES-256-GCM pour le chiffrement symétrique
 *
 * @module services/encryptionService
 */

const crypto = require("crypto");

// Algorithme de chiffrement
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes pour AES
const AUTH_TAG_LENGTH = 16; // 16 bytes pour GCM
const KEY_LENGTH = 32; // 256 bits

/**
 * Service de chiffrement
 */
class EncryptionService {
  constructor() {
    this.masterKey = null;
    this.initialized = false;
  }

  /**
   * Initialise le service avec la clé maître
   * @throws {Error} Si la clé n'est pas configurée
   */
  initialize() {
    const keyHex = process.env.ENCRYPTION_KEY;

    if (!keyHex) {
      console.warn(
        "[EncryptionService] ENCRYPTION_KEY non définie - chiffrement désactivé"
      );
      this.initialized = false;
      return;
    }

    // Vérifier que la clé fait 64 caractères hex (32 bytes)
    if (keyHex.length !== 64) {
      throw new Error(
        "ENCRYPTION_KEY doit faire 64 caractères hexadécimaux (256 bits)"
      );
    }

    this.masterKey = Buffer.from(keyHex, "hex");
    this.initialized = true;
    console.log("[EncryptionService] Service initialisé avec succès");
  }

  /**
   * Vérifie si le service est initialisé
   * @returns {boolean}
   */
  isEnabled() {
    return this.initialized && this.masterKey !== null;
  }

  /**
   * Génère une nouvelle clé de chiffrement aléatoire
   * @returns {string} Clé en hexadécimal
   */
  static generateKey() {
    return crypto.randomBytes(KEY_LENGTH).toString("hex");
  }

  /**
   * Génère un IV aléatoire
   * @returns {Buffer}
   */
  generateIV() {
    return crypto.randomBytes(IV_LENGTH);
  }

  /**
   * Chiffre une chaîne de texte
   * @param {string} plaintext - Texte à chiffrer
   * @returns {string|null} Données chiffrées en base64 (iv:authTag:ciphertext) ou null si désactivé
   */
  encrypt(plaintext) {
    if (!this.isEnabled()) {
      return null; // Retourne null si chiffrement désactivé
    }

    try {
      const iv = this.generateIV();
      const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

      let encrypted = cipher.update(plaintext, "utf8", "base64");
      encrypted += cipher.final("base64");

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:ciphertext (tout en base64)
      return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
    } catch (error) {
      console.error("[EncryptionService] Erreur chiffrement:", error.message);
      throw error;
    }
  }

  /**
   * Déchiffre une chaîne de texte
   * @param {string} encryptedData - Données chiffrées (format iv:authTag:ciphertext)
   * @returns {string|null} Texte déchiffré ou null si désactivé/erreur
   */
  decrypt(encryptedData) {
    if (!this.isEnabled()) {
      return encryptedData; // Retourne tel quel si chiffrement désactivé
    }

    if (!encryptedData || !encryptedData.includes(":")) {
      return encryptedData; // Données non chiffrées, retourner tel quel
    }

    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 3) {
        return encryptedData; // Format invalide, probablement non chiffré
      }

      const iv = Buffer.from(parts[0], "base64");
      const authTag = Buffer.from(parts[1], "base64");
      const ciphertext = parts[2];

      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("[EncryptionService] Erreur déchiffrement:", error.message);
      // En cas d'erreur, retourner les données telles quelles
      // (peut être des données non chiffrées d'avant la migration)
      return encryptedData;
    }
  }

  /**
   * Chiffre des données binaires (images)
   * @param {Buffer|string} data - Données à chiffrer (Buffer ou base64)
   * @returns {string|null} Données chiffrées en base64 ou null si désactivé
   */
  encryptBinary(data) {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      // Convertir en Buffer si nécessaire
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "base64");

      const iv = this.generateIV();
      const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:ciphertext (tout en base64)
      return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
    } catch (error) {
      console.error(
        "[EncryptionService] Erreur chiffrement binaire:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Déchiffre des données binaires (images)
   * @param {string} encryptedData - Données chiffrées
   * @returns {Buffer|string} Données déchiffrées (Buffer) ou données originales si non chiffrées
   */
  decryptBinary(encryptedData) {
    if (!this.isEnabled()) {
      return encryptedData;
    }

    if (!encryptedData || !encryptedData.includes(":")) {
      return encryptedData;
    }

    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 3) {
        return encryptedData;
      }

      const iv = Buffer.from(parts[0], "base64");
      const authTag = Buffer.from(parts[1], "base64");
      const ciphertext = Buffer.from(parts[2], "base64");

      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error) {
      console.error(
        "[EncryptionService] Erreur déchiffrement binaire:",
        error.message
      );
      return encryptedData;
    }
  }

  /**
   * Chiffre une image Data URL
   * @param {string} dataUrl - Image en format data:image/...;base64,...
   * @returns {Object} { encrypted: string, mimeType: string } ou { original: string } si désactivé
   */
  encryptImageDataUrl(dataUrl) {
    if (!this.isEnabled() || !dataUrl) {
      return { original: dataUrl };
    }

    try {
      // Extraire le type MIME et les données base64
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return { original: dataUrl };
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // Chiffrer les données
      const encrypted = this.encryptBinary(base64Data);

      return {
        encrypted,
        mimeType,
        isEncrypted: true,
      };
    } catch (error) {
      console.error(
        "[EncryptionService] Erreur chiffrement image:",
        error.message
      );
      return { original: dataUrl };
    }
  }

  /**
   * Déchiffre une image et retourne la Data URL
   * @param {string} encryptedData - Données chiffrées
   * @param {string} mimeType - Type MIME de l'image
   * @returns {string} Data URL de l'image
   */
  decryptImageDataUrl(encryptedData, mimeType) {
    if (!this.isEnabled() || !encryptedData) {
      return encryptedData;
    }

    // Si ce n'est pas chiffré (format data:...), retourner tel quel
    if (encryptedData.startsWith("data:")) {
      return encryptedData;
    }

    try {
      const decrypted = this.decryptBinary(encryptedData);

      // Si le déchiffrement a échoué, retourner tel quel
      if (typeof decrypted === "string") {
        return decrypted;
      }

      // Reconstruire la Data URL
      const base64Data = decrypted.toString("base64");
      return `data:${mimeType || "image/jpeg"};base64,${base64Data}`;
    } catch (error) {
      console.error(
        "[EncryptionService] Erreur déchiffrement image:",
        error.message
      );
      return encryptedData;
    }
  }
}

// Instance singleton
const encryptionService = new EncryptionService();

module.exports = {
  EncryptionService,
  encryptionService,
};
