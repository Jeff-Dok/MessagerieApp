/**
 * ============================================
 * IMAGE HANDLER - Gestionnaire d'images
 * ============================================
 * 
 * Gère le traitement et l'affichage sécurisé des images
 * 
 * Fonctionnalités:
 * - Validation des images avant envoi
 * - Compression et redimensionnement
 * - Rendu sécurisé sur Canvas
 * - Protection contre téléchargement
 * - Gestion des images expirées
 * - Preview avant envoi
 * 
 * @module services/imageHandler
 * @author MessagerieApp
 * @version 2.0.0
 */

/**
 * Configuration des images
 */
const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5 MB
  MAX_WIDTH: 800,
  MAX_HEIGHT: 800,
  QUALITY: 0.8,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp']
};

/**
 * Service de gestion des images
 */
const ImageHandler = {
  // ==========================================
  // VALIDATION
  // ==========================================

  /**
   * Valide un fichier image
   * @param {File} file - Fichier à valider
   * @returns {Object} Résultat de validation {valid: boolean, error?: string}
   */
  validateImage(file) {
    // Vérifier si un fichier est fourni
    if (!file) {
      return {
        valid: false,
        error: 'Aucun fichier fourni'
      };
    }

    // Vérifier le type MIME
    if (!IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${IMAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Vérifier la taille
    if (file.size > IMAGE_CONFIG.MAX_SIZE) {
      const maxSizeMB = (IMAGE_CONFIG.MAX_SIZE / 1024 / 1024).toFixed(2);
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille maximale: ${maxSizeMB} MB`
      };
    }

    // Vérifier l'extension
    const extension = this.getFileExtension(file.name);
    if (!IMAGE_CONFIG.ALLOWED_EXTENSIONS.includes(extension.toLowerCase())) {
      return {
        valid: false,
        error: `Extension non autorisée. Extensions acceptées: ${IMAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    return { valid: true };
  },

  /**
   * Extrait l'extension d'un nom de fichier
   * @param {string} filename - Nom du fichier
   * @returns {string} Extension du fichier
   */
  getFileExtension(filename) {
    return filename.split('.').pop() || '';
  },

  // ==========================================
  // TRAITEMENT
  // ==========================================

  /**
   * Compresse et redimensionne une image
   * @param {File} file - Fichier image
   * @param {Object} options - Options de compression
   * @returns {Promise<Blob>} Image compressée
   */
  async compressImage(file, options = {}) {
    const {
      maxWidth = IMAGE_CONFIG.MAX_WIDTH,
      maxHeight = IMAGE_CONFIG.MAX_HEIGHT,
      quality = IMAGE_CONFIG.QUALITY
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // Calculer les nouvelles dimensions
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Créer le canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          
          // Remplir le fond en blanc (pour PNG transparents)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Dessiner l'image
          ctx.drawImage(img, 0, 0, width, height);

          // Ajouter un filigrane invisible
          this._addWatermark(ctx, width, height);

          // Convertir en Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Échec de la conversion en blob'));
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Impossible de charger l\'image'));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Erreur de lecture du fichier'));
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * Ajoute un filigrane invisible sur le canvas
   * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
   * @param {number} width - Largeur du canvas
   * @param {number} height - Hauteur du canvas
   * @private
   */
  _addWatermark(ctx, width, height) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MessagerieApp - Protégé', width / 2, height / 2);
    ctx.restore();
  },

  // ==========================================
  // PREVIEW
  // ==========================================

  /**
   * Génère une preview de l'image
   * @param {File} file - Fichier image
   * @returns {Promise<string>} Data URL de la preview
   */
  async generatePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('Erreur de lecture du fichier'));
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * Affiche une preview dans un élément DOM
   * @param {File} file - Fichier image
   * @param {HTMLElement} container - Container pour la preview
   * @returns {Promise<void>}
   */
  async displayPreview(file, container) {
    try {
      const previewUrl = await this.generatePreview(file);
      
      container.innerHTML = '';
      
      const img = document.createElement('img');
      img.src = previewUrl;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '300px';
      img.style.objectFit = 'contain';
      img.style.borderRadius = '8px';
      
      container.appendChild(img);
    } catch (error) {
      console.error('Erreur displayPreview:', error);
      throw error;
    }
  },

  // ==========================================
  // RENDU SÉCURISÉ
  // ==========================================

  /**
   * Rend une image de manière sécurisée sur un canvas
   * @param {HTMLCanvasElement} canvas - Canvas où rendre l'image
   * @param {string} imageDataUrl - Data URL de l'image
   * @param {Object} options - Options de rendu
   * @returns {Promise<void>}
   */
  async renderSecureImage(canvas, imageDataUrl, options = {}) {
    const {
      maxWidth = 300,
      maxHeight = 300,
      addProtection = true
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculer les dimensions
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Définir les dimensions du canvas
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');

          // Dessiner l'image
          ctx.drawImage(img, 0, 0, width, height);

          // Ajouter la protection
          if (addProtection) {
            this._addWatermark(ctx, width, height);
            this._addProtectionLayer(canvas);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Impossible de charger l\'image'));
      };

      img.src = imageDataUrl;
    });
  },

  /**
   * Ajoute une couche de protection au canvas
   * @param {HTMLCanvasElement} canvas - Canvas à protéger
   * @private
   */
  _addProtectionLayer(canvas) {
    // Désactiver la sélection
    canvas.style.userSelect = 'none';
    canvas.style.webkitUserSelect = 'none';
    canvas.style.mozUserSelect = 'none';
    canvas.style.msUserSelect = 'none';

    // Désactiver le drag
    canvas.style.webkitUserDrag = 'none';
    canvas.draggable = false;

    // Désactiver le menu contextuel
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Désactiver les touches de capture d'écran
    canvas.addEventListener('keydown', (e) => {
      // PrintScreen ou Cmd+Shift+3/4/5 (Mac)
      if (e.keyCode === 44 || 
          (e.metaKey && e.shiftKey && [51, 52, 53].includes(e.keyCode))) {
        e.preventDefault();
        console.log('Capture d\'écran désactivée pour protéger l\'image');
        return false;
      }
    });
  },

  // ==========================================
  // GESTION DES IMAGES EXPIRÉES
  // ==========================================

  /**
   * Affiche un placeholder pour une image expirée
   * @param {HTMLElement} container - Container de l'image
   */
  displayExpiredImage(container) {
    container.innerHTML = `
      <div class="message-expired">
        <div class="expired-icon">🔒</div>
        <div class="expired-text">Image expirée</div>
        <div class="expired-subtitle">Cette image n'est plus disponible</div>
      </div>
    `;

    // Ajouter les styles si nécessaire
    this._ensureExpiredStyles();
  },

  /**
   * S'assure que les styles pour images expirées existent
   * @private
   */
  _ensureExpiredStyles() {
    if (document.getElementById('expiredImageStyles')) return;

    const style = document.createElement('style');
    style.id = 'expiredImageStyles';
    style.textContent = `
      .message-expired {
        padding: 48px 24px;
        text-align: center;
        background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
        border-radius: 12px;
        min-width: 200px;
      }

      .expired-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        opacity: 0.6;
      }

      .expired-text {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin-bottom: 8px;
      }

      .expired-subtitle {
        font-size: 0.875rem;
        color: #6B7280;
      }
    `;
    document.head.appendChild(style);
  },

  // ==========================================
  // UTILITAIRES
  // ==========================================

  /**
   * Convertit un Blob en Data URL
   * @param {Blob} blob - Blob à convertir
   * @returns {Promise<string>} Data URL
   */
  async blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        resolve(e.target.result);
      };

      reader.onerror = () => {
        reject(new Error('Erreur de conversion'));
      };

      reader.readAsDataURL(blob);
    });
  },

  /**
   * Télécharge une image (pour test)
   * @param {HTMLCanvasElement} canvas - Canvas contenant l'image
   * @param {string} filename - Nom du fichier
   */
  downloadImage(canvas, filename = 'image.jpg') {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.9);
  },

  /**
   * Obtient les dimensions d'une image
   * @param {string} imageDataUrl - Data URL de l'image
   * @returns {Promise<Object>} Dimensions {width, height}
   */
  async getImageDimensions(imageDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        reject(new Error('Impossible de charger l\'image'));
      };

      img.src = imageDataUrl;
    });
  },

  /**
   * Formate la taille d'un fichier
   * @param {number} bytes - Taille en bytes
   * @returns {string} Taille formatée
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Crée un élément d'upload d'image
   * @param {Function} onImageSelected - Callback appelé quand une image est sélectionnée
   * @returns {HTMLInputElement} Input file
   */
  createImageInput(onImageSelected) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = IMAGE_CONFIG.ALLOWED_TYPES.join(',');
    input.style.display = 'none';

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Valider
      const validation = this.validateImage(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      // Callback
      if (onImageSelected) {
        try {
          await onImageSelected(file);
        } catch (error) {
          console.error('Erreur onImageSelected:', error);
          alert('Erreur lors du traitement de l\'image');
        }
      }

      // Réinitialiser l'input
      input.value = '';
    });

    return input;
  }
};

// Export global
if (typeof window !== 'undefined') {
  window.ImageHandler = ImageHandler;
  window.IMAGE_CONFIG = IMAGE_CONFIG;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImageHandler, IMAGE_CONFIG };
}