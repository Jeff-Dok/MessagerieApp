/**
 * ============================================
 * CRYPTO UTILS - Utilitaires de chiffrement E2E
 * ============================================
 *
 * Gère le chiffrement de bout en bout des messages texte
 * Utilise Web Crypto API (ECDH + AES-GCM)
 *
 * @module utils/crypto
 */

const CryptoUtils = {
  // Constantes
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  ECDH_CURVE: 'P-256',
  STORAGE_KEY_PREFIX: 'messagerie_e2e_',

  /**
   * Vérifie si Web Crypto API est disponible
   * @returns {boolean}
   */
  isSupported() {
    return typeof window !== 'undefined' &&
           window.crypto &&
           window.crypto.subtle;
  },

  /**
   * Génère une paire de clés ECDH pour l'utilisateur
   * @returns {Promise<{publicKey: string, privateKey: string}>} Clés en format exportable
   */
  async generateKeyPair() {
    if (!this.isSupported()) {
      throw new Error('Web Crypto API non supportée');
    }

    try {
      // Générer la paire de clés ECDH
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: this.ECDH_CURVE
        },
        true, // extractable
        ['deriveKey', 'deriveBits']
      );

      // Exporter la clé publique en format JWK
      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);

      // Exporter la clé privée en format JWK
      const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

      return {
        publicKey: JSON.stringify(publicKeyJwk),
        privateKey: JSON.stringify(privateKeyJwk)
      };
    } catch (error) {
      console.error('[CryptoUtils] Erreur génération clés:', error);
      throw error;
    }
  },

  /**
   * Sauvegarde la clé privée dans le stockage local
   * @param {number} userId - ID de l'utilisateur
   * @param {string} privateKey - Clé privée en JSON
   */
  savePrivateKey(userId, privateKey) {
    try {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}private_${userId}`, privateKey);
      console.log('[CryptoUtils] Clé privée sauvegardée');
    } catch (error) {
      console.error('[CryptoUtils] Erreur sauvegarde clé privée:', error);
      throw error;
    }
  },

  /**
   * Récupère la clé privée du stockage local
   * @param {number} userId - ID de l'utilisateur
   * @returns {string|null} Clé privée en JSON ou null
   */
  getPrivateKey(userId) {
    try {
      return localStorage.getItem(`${this.STORAGE_KEY_PREFIX}private_${userId}`);
    } catch (error) {
      console.error('[CryptoUtils] Erreur récupération clé privée:', error);
      return null;
    }
  },

  /**
   * Vérifie si l'utilisateur a une paire de clés valide
   * @param {number} userId - ID de l'utilisateur
   * @returns {boolean}
   */
  hasKeyPair(userId) {
    const privateKey = this.getPrivateKey(userId);
    if (!privateKey) {
      console.log('[CryptoUtils] hasKeyPair: Pas de clé privée pour userId', userId);
      return false;
    }

    // Vérifier que la clé est un JWK valide
    try {
      const jwk = JSON.parse(privateKey);
      const isValid = jwk && jwk.kty === 'EC' && jwk.crv === 'P-256' && jwk.d;
      console.log('[CryptoUtils] hasKeyPair: Clé valide =', isValid);
      return isValid;
    } catch {
      // Clé corrompue, la supprimer
      console.warn('[CryptoUtils] Clé privée corrompue détectée, suppression...');
      this.clearKeys(userId);
      return false;
    }
  },

  /**
   * Importe une clé publique depuis son format JWK
   * @param {string} publicKeyJson - Clé publique en JSON
   * @returns {Promise<CryptoKey>}
   */
  async importPublicKey(publicKeyJson) {
    const jwk = JSON.parse(publicKeyJson);
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: this.ECDH_CURVE
      },
      true,
      []
    );
  },

  /**
   * Importe une clé privée depuis son format JWK
   * @param {string} privateKeyJson - Clé privée en JSON
   * @returns {Promise<CryptoKey>}
   */
  async importPrivateKey(privateKeyJson) {
    const jwk = JSON.parse(privateKeyJson);
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: this.ECDH_CURVE
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  },

  /**
   * Dérive une clé AES partagée à partir des clés ECDH
   * @param {CryptoKey} privateKey - Clé privée de l'utilisateur
   * @param {CryptoKey} publicKey - Clé publique de l'autre utilisateur
   * @returns {Promise<CryptoKey>} Clé AES dérivée
   */
  async deriveSharedKey(privateKey, publicKey) {
    return await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: publicKey
      },
      privateKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false, // non extractable
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Génère un IV aléatoire
   * @returns {Uint8Array}
   */
  generateIV() {
    return window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
  },

  /**
   * Chiffre un message avec AES-GCM
   * @param {string} plaintext - Message en clair
   * @param {CryptoKey} key - Clé AES
   * @returns {Promise<{encrypted: string, iv: string}>} Données chiffrées en base64
   */
  async encryptMessage(plaintext, key) {
    const iv = this.generateIV();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      data
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv)
    };
  },

  /**
   * Déchiffre un message avec AES-GCM
   * @param {string} encryptedBase64 - Données chiffrées en base64
   * @param {string} ivBase64 - IV en base64
   * @param {CryptoKey} key - Clé AES
   * @returns {Promise<string>} Message en clair
   */
  async decryptMessage(encryptedBase64, ivBase64, key) {
    const encrypted = this.base64ToArrayBuffer(encryptedBase64);
    const iv = this.base64ToArrayBuffer(ivBase64);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  },

  /**
   * Chiffre un message pour un destinataire
   * @param {string} plaintext - Message en clair
   * @param {string} recipientPublicKey - Clé publique du destinataire (JSON)
   * @param {string} senderPrivateKey - Clé privée de l'expéditeur (JSON)
   * @returns {Promise<{encryptedContent: string, iv: string}>}
   */
  async encryptForRecipient(plaintext, recipientPublicKey, senderPrivateKey) {
    try {
      // Importer les clés
      const publicKey = await this.importPublicKey(recipientPublicKey);
      const privateKey = await this.importPrivateKey(senderPrivateKey);

      // Dériver la clé partagée
      const sharedKey = await this.deriveSharedKey(privateKey, publicKey);

      // Chiffrer le message
      const result = await this.encryptMessage(plaintext, sharedKey);

      return {
        encryptedContent: result.encrypted,
        iv: result.iv
      };
    } catch (error) {
      console.error('[CryptoUtils] Erreur chiffrement:', error);
      throw error;
    }
  },

  /**
   * Déchiffre un message reçu
   * @param {string} encryptedContent - Contenu chiffré (base64)
   * @param {string} iv - IV (base64)
   * @param {string} senderPublicKey - Clé publique de l'expéditeur (JSON)
   * @param {string} recipientPrivateKey - Clé privée du destinataire (JSON)
   * @returns {Promise<string>} Message en clair
   */
  async decryptFromSender(encryptedContent, iv, senderPublicKey, recipientPrivateKey) {
    try {
      // Importer les clés
      const publicKey = await this.importPublicKey(senderPublicKey);
      const privateKey = await this.importPrivateKey(recipientPrivateKey);

      // Dériver la clé partagée
      const sharedKey = await this.deriveSharedKey(privateKey, publicKey);

      // Déchiffrer le message
      return await this.decryptMessage(encryptedContent, iv, sharedKey);
    } catch (error) {
      console.error('[CryptoUtils] Erreur déchiffrement:', error);
      throw error;
    }
  },

  // ==========================================
  // UTILITAIRES
  // ==========================================

  /**
   * Convertit un ArrayBuffer en base64
   * @param {ArrayBuffer} buffer
   * @returns {string}
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Convertit une chaîne base64 en ArrayBuffer
   * @param {string} base64
   * @returns {ArrayBuffer}
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },

  /**
   * Supprime les clés de l'utilisateur (déconnexion)
   * @param {number} userId
   */
  clearKeys(userId) {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}private_${userId}`);
      console.log('[CryptoUtils] Clés supprimées');
    } catch (error) {
      console.error('[CryptoUtils] Erreur suppression clés:', error);
    }
  }
};

// Export pour utilisation dans les modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoUtils;
}
