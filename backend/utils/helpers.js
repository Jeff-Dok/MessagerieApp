/**
 * ============================================
 * HELPERS - Fonctions utilitaires
 * ============================================
 * 
 * Collection de fonctions helper réutilisables
 * 
 * @module utils/helpers
 */

/**
 * Formate une date en français
 * @param {Date|string} date - Date à formater
 * @returns {string} Date formatée
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Génère un slug à partir d'un texte
 * @param {string} text - Texte à transformer
 * @returns {string} Slug généré
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Calcule les paramètres de pagination
 * @param {number} page - Numéro de page
 * @param {number} limit - Nombre d'éléments par page
 * @returns {{limit: number, offset: number}} Paramètres de pagination
 */
function paginate(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return { limit, offset };
}

/**
 * Génère un ID de room pour Socket.io
 * @param {number} userId1 - ID du premier utilisateur
 * @param {number} userId2 - ID du deuxième utilisateur
 * @returns {string} ID de la room
 */
function generateRoomId(userId1, userId2) {
  const minId = Math.min(userId1, userId2);
  const maxId = Math.max(userId1, userId2);
  return `conversation_${minId}_${maxId}`;
}

/**
 * Vérifie si une chaîne est un email valide
 * @param {string} email - Email à vérifier
 * @returns {boolean} true si valide
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Nettoie un objet en retirant les valeurs null/undefined
 * @param {Object} obj - Objet à nettoyer
 * @returns {Object} Objet nettoyé
 */
function cleanObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value != null)
  );
}

/**
 * Attend un certain temps (pour les tests ou retry)
 * @param {number} ms - Temps en millisecondes
 * @returns {Promise} Promise qui se résout après le délai
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcule le temps restant avant expiration
 * @param {Date|string} expiresAt - Date d'expiration
 * @returns {{minutes: number, seconds: number, expired: boolean}} Temps restant
 */
function getTimeRemaining(expiresAt) {
  const now = new Date();
  const expiration = new Date(expiresAt);
  const timeLeft = expiration - now;
  
  if (timeLeft <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  return { minutes, seconds, expired: false };
}

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @param {string} suffix - Suffixe à ajouter
 * @returns {string} Texte tronqué
 */
function truncate(text, maxLength = 50, suffix = '...') {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Génère un nombre aléatoire entre min et max
 * @param {number} min - Valeur minimale
 * @param {number} max - Valeur maximale
 * @returns {number} Nombre aléatoire
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  formatDate,
  generateSlug,
  paginate,
  generateRoomId,
  isValidEmail,
  cleanObject,
  sleep,
  getTimeRemaining,
  truncate,
  randomInt
};