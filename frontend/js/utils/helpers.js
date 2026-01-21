/**
 * ============================================
 * HELPERS - Fonctions utilitaires frontend
 * ============================================
 * 
 * Collection de fonctions helper réutilisables pour le frontend
 * 
 * Fonctionnalités:
 * - Formatage de dates et heures
 * - Manipulation de chaînes
 * - Validation de données
 * - Génération d'IDs
 * - Utilitaires DOM
 * - Gestion du stockage
 * 
 * @module utils/helpers
 * @author MessagerieApp
 * @version 2.0.0
 */

/**
 * Utilitaires de formatage
 */
const FormatHelpers = {
  /**
   * Formate une date en français
   * @param {Date|string|number} date - Date à formater
   * @param {Object} options - Options de formatage
   * @returns {string} Date formatée
   */
  formatDate(date, options = {}) {
    const d = new Date(date);
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };

    try {
      return d.toLocaleDateString('fr-FR', defaultOptions);
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date invalide';
    }
  },

  /**
   * Formate une heure relative (il y a X minutes)
   * @param {Date|string|number} date - Date à comparer
   * @returns {string} Temps relatif
   */
  formatRelativeTime(date) {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    if (diffHour < 24) return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
    if (diffDay < 7) return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
    
    return this.formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
  },

  /**
   * Formate une heure (HH:MM)
   * @param {Date|string|number} date - Date
   * @returns {string} Heure formatée
   */
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  /**
   * Formate une taille de fichier
   * @param {number} bytes - Taille en bytes
   * @param {number} decimals - Nombre de décimales
   * @returns {string} Taille formatée
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Formate un nombre avec séparateurs de milliers
   * @param {number} num - Nombre à formater
   * @returns {string} Nombre formaté
   */
  formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
  },

  /**
   * Tronque un texte à une longueur maximale
   * @param {string} text - Texte à tronquer
   * @param {number} maxLength - Longueur maximale
   * @param {string} suffix - Suffixe à ajouter
   * @returns {string} Texte tronqué
   */
  truncate(text, maxLength = 50, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }
};

/**
 * Utilitaires de manipulation de chaînes
 */
const StringHelpers = {
  /**
   * Capitalise la première lettre
   * @param {string} str - Chaîne à capitaliser
   * @returns {string} Chaîne capitalisée
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Convertit en camelCase
   * @param {string} str - Chaîne à convertir
   * @returns {string} Chaîne en camelCase
   */
  toCamelCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, (_, c) => c.toLowerCase());
  },

  /**
   * Convertit en kebab-case
   * @param {string} str - Chaîne à convertir
   * @returns {string} Chaîne en kebab-case
   */
  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },

  /**
   * Génère un slug à partir d'un texte
   * @param {string} text - Texte à transformer
   * @returns {string} Slug généré
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^\w\s-]/g, '') // Retirer les caractères spéciaux
      .replace(/[\s_-]+/g, '-') // Remplacer espaces/underscores par tirets
      .replace(/^-+|-+$/g, ''); // Retirer tirets début/fin
  },

  /**
   * Échappe les caractères HTML
   * @param {string} str - Chaîne à échapper
   * @returns {string} Chaîne échappée
   */
  escapeHtml(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * Retire les accents
   * @param {string} str - Chaîne avec accents
   * @returns {string} Chaîne sans accents
   */
  removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Vérifie si une chaîne contient un mot
   * @param {string} str - Chaîne à vérifier
   * @param {string} word - Mot recherché
   * @param {boolean} caseSensitive - Sensible à la casse
   * @returns {boolean} True si contient
   */
  contains(str, word, caseSensitive = false) {
    if (caseSensitive) {
      return str.includes(word);
    }
    return str.toLowerCase().includes(word.toLowerCase());
  }
};

/**
 * Utilitaires DOM
 */
const DomHelpers = {
  /**
   * Crée un élément avec des attributs
   * @param {string} tag - Tag HTML
   * @param {Object} attributes - Attributs
   * @param {string|HTMLElement} content - Contenu
   * @returns {HTMLElement} Élément créé
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });

    if (content) {
      if (typeof content === 'string') {
        element.textContent = content;
      } else {
        element.appendChild(content);
      }
    }

    return element;
  },

  /**
   * Vide un élément de son contenu
   * @param {HTMLElement|string} element - Élément ou sélecteur
   */
  empty(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }
  },

  /**
   * Toggle une classe sur un élément
   * @param {HTMLElement|string} element - Élément ou sélecteur
   * @param {string} className - Classe à toggler
   */
  toggleClass(element, className) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      el.classList.toggle(className);
    }
  },

  /**
   * Vérifie si un élément est visible
   * @param {HTMLElement|string} element - Élément ou sélecteur
   * @returns {boolean} True si visible
   */
  isVisible(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return false;
    
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  },

  /**
   * Scroll vers un élément
   * @param {HTMLElement|string} element - Élément ou sélecteur
   * @param {Object} options - Options de scroll
   */
  scrollTo(element, options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
      });
    }
  }
};

/**
 * Utilitaires de génération
 */
const GenerateHelpers = {
  /**
   * Génère un ID unique
   * @param {string} prefix - Préfixe optionnel
   * @returns {string} ID unique
   */
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Génère une couleur aléatoire
   * @returns {string} Couleur hex
   */
  randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  },

  /**
   * Génère un nombre aléatoire
   * @param {number} min - Minimum
   * @param {number} max - Maximum
   * @returns {number} Nombre aléatoire
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Mélange un tableau
   * @param {Array} array - Tableau à mélanger
   * @returns {Array} Tableau mélangé
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
};

/**
 * Utilitaires de stockage
 */
const StorageHelpers = {
  /**
   * Sauvegarde dans localStorage avec JSON
   * @param {string} key - Clé
   * @param {*} value - Valeur
   * @returns {boolean} Succès
   */
  setLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Erreur setLocal:', error);
      return false;
    }
  },

  /**
   * Récupère depuis localStorage
   * @param {string} key - Clé
   * @param {*} defaultValue - Valeur par défaut
   * @returns {*} Valeur ou défaut
   */
  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erreur getLocal:', error);
      return defaultValue;
    }
  },

  /**
   * Retire une clé du localStorage
   * @param {string} key - Clé à retirer
   */
  removeLocal(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur removeLocal:', error);
      return false;
    }
  },

  /**
   * Vide le localStorage
   */
  clearLocal() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur clearLocal:', error);
      return false;
    }
  }
};

/**
 * Utilitaires de calcul
 */
const MathHelpers = {
  /**
   * Calcule un pourcentage
   * @param {number} value - Valeur
   * @param {number} total - Total
   * @param {number} decimals - Décimales
   * @returns {number} Pourcentage
   */
  percentage(value, total, decimals = 2) {
    if (total === 0) return 0;
    return parseFloat(((value / total) * 100).toFixed(decimals));
  },

  /**
   * Arrondit un nombre
   * @param {number} num - Nombre
   * @param {number} decimals - Décimales
   * @returns {number} Nombre arrondi
   */
  round(num, decimals = 0) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  /**
   * Clamp un nombre entre min et max
   * @param {number} num - Nombre
   * @param {number} min - Minimum
   * @param {number} max - Maximum
   * @returns {number} Nombre clampé
   */
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Calcule une moyenne
   * @param {number[]} numbers - Nombres
   * @returns {number} Moyenne
   */
  average(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
};

/**
 * Utilitaires asynchrones
 */
const AsyncHelpers = {
  /**
   * Attend un délai
   * @param {number} ms - Millisecondes
   * @returns {Promise} Promise
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Debounce une fonction
   * @param {Function} func - Fonction à debouncer
   * @param {number} wait - Délai en ms
   * @returns {Function} Fonction debouncée
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle une fonction
   * @param {Function} func - Fonction à throttler
   * @param {number} limit - Limite en ms
   * @returns {Function} Fonction throttlée
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

/**
 * Utilitaires de validation
 */
const ValidationHelpers = {
  /**
   * Valide un email
   * @param {string} email - Email à valider
   * @returns {boolean} True si valide
   */
  isEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Valide une URL
   * @param {string} url - URL à valider
   * @returns {boolean} True si valide
   */
  isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Vérifie si une valeur est vide
   * @param {*} value - Valeur à vérifier
   * @returns {boolean} True si vide
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
};

// Export global
if (typeof window !== 'undefined') {
  window.Helpers = {
    format: FormatHelpers,
    string: StringHelpers,
    dom: DomHelpers,
    generate: GenerateHelpers,
    storage: StorageHelpers,
    math: MathHelpers,
    async: AsyncHelpers,
    validate: ValidationHelpers
  };
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormatHelpers,
    StringHelpers,
    DomHelpers,
    GenerateHelpers,
    StorageHelpers,
    MathHelpers,
    AsyncHelpers,
    ValidationHelpers
  };
}