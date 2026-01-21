/**
 * ============================================
 * SEARCH & FILTER SERVICE
 * ============================================
 * 
 * Service de recherche et filtrage avancé des conversations et messages
 * 
 * @module services/searchFilterService
 * @version 1.0.0
 */

const SearchFilterService = {
  // Cache des résultats de recherche
  searchCache: new Map(),
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  
  // Configuration
  config: {
    minSearchLength: 2,
    maxResults: 50,
    debounceDelay: 300,
    highlightClass: 'search-highlight'
  },
  
  /**
   * Recherche dans les conversations
   * @param {Array} conversations - Liste des conversations
   * @param {string} query - Terme de recherche
   * @param {Object} filters - Filtres supplémentaires
   * @returns {Array} Conversations filtrées
   */
  searchConversations(conversations, query, filters = {}) {
    if (!query || query.length < this.config.minSearchLength) {
      return conversations;
    }
    
    const cacheKey = this._getCacheKey('conversations', query, filters);
    
    // Vérifier le cache
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.results;
      }
    }
    
    const normalizedQuery = this._normalizeText(query);
    
    // Filtrer les conversations
    const results = conversations.filter(conv => {
      // Recherche dans le nom
      if (this._normalizeText(conv.nom).includes(normalizedQuery)) {
        return true;
      }
      
      // Recherche dans l'email
      if (this._normalizeText(conv.email).includes(normalizedQuery)) {
        return true;
      }
      
      // Recherche dans le pseudo
      if (conv.pseudo && this._normalizeText(conv.pseudo).includes(normalizedQuery)) {
        return true;
      }
      
      // Recherche dans la ville
      if (conv.ville && this._normalizeText(conv.ville).includes(normalizedQuery)) {
        return true;
      }
      
      return false;
    });
    
    // Appliquer les filtres supplémentaires
    const filtered = this._applyFilters(results, filters);
    
    // Trier par pertinence
    const sorted = this._sortByRelevance(filtered, normalizedQuery);
    
    // Limiter les résultats
    const limited = sorted.slice(0, this.config.maxResults);
    
    // Mettre en cache
    this.searchCache.set(cacheKey, {
      results: limited,
      timestamp: Date.now()
    });
    
    return limited;
  },
  
  /**
   * Recherche dans les messages
   * @param {Array} messages - Liste des messages
   * @param {string} query - Terme de recherche
   * @param {Object} filters - Filtres
   * @returns {Array} Messages filtrés
   */
  searchMessages(messages, query, filters = {}) {
    if (!query || query.length < this.config.minSearchLength) {
      return messages;
    }
    
    const cacheKey = this._getCacheKey('messages', query, filters);
    
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.results;
      }
    }
    
    const normalizedQuery = this._normalizeText(query);
    
    const results = messages.filter(msg => {
      // Recherche dans le contenu texte
      if (msg.messageType === 'text' && msg.content) {
        if (this._normalizeText(msg.content).includes(normalizedQuery)) {
          return true;
        }
      }
      
      // Recherche dans le nom de fichier image
      if (msg.messageType === 'image' && msg.imageFileName) {
        if (this._normalizeText(msg.imageFileName).includes(normalizedQuery)) {
          return true;
        }
      }
      
      return false;
    });
    
    const filtered = this._applyMessageFilters(results, filters);
    const sorted = this._sortMessagesByRelevance(filtered, normalizedQuery);
    const limited = sorted.slice(0, this.config.maxResults);
    
    this.searchCache.set(cacheKey, {
      results: limited,
      timestamp: Date.now()
    });
    
    return limited;
  },
  
  /**
   * Applique les filtres aux conversations
   */
  _applyFilters(conversations, filters) {
    let filtered = [...conversations];
    
    // Filtre par ville
    if (filters.ville) {
      filtered = filtered.filter(conv => 
        conv.ville && this._normalizeText(conv.ville) === this._normalizeText(filters.ville)
      );
    }
    
    // Filtre par rôle
    if (filters.role) {
      filtered = filtered.filter(conv => conv.role === filters.role);
    }
    
    // Filtre par statut
    if (filters.statut) {
      filtered = filtered.filter(conv => conv.statut === filters.statut);
    }
    
    // Filtre par âge
    if (filters.ageMin !== undefined) {
      filtered = filtered.filter(conv => conv.age >= filters.ageMin);
    }
    
    if (filters.ageMax !== undefined) {
      filtered = filtered.filter(conv => conv.age <= filters.ageMax);
    }
    
    return filtered;
  },
  
  /**
   * Applique les filtres aux messages
   */
  _applyMessageFilters(messages, filters) {
    let filtered = [...messages];
    
    // Filtre par type
    if (filters.messageType) {
      filtered = filtered.filter(msg => msg.messageType === filters.messageType);
    }
    
    // Filtre par statut de lecture
    if (filters.read !== undefined) {
      filtered = filtered.filter(msg => msg.read === filters.read);
    }
    
    // Filtre par date (après)
    if (filters.dateAfter) {
      const afterDate = new Date(filters.dateAfter);
      filtered = filtered.filter(msg => new Date(msg.date) >= afterDate);
    }
    
    // Filtre par date (avant)
    if (filters.dateBefore) {
      const beforeDate = new Date(filters.dateBefore);
      filtered = filtered.filter(msg => new Date(msg.date) <= beforeDate);
    }
    
    // Filtre images expirées
    if (filters.showExpired === false) {
      filtered = filtered.filter(msg => 
        msg.messageType !== 'image' || !msg.imageExpired
      );
    }
    
    return filtered;
  },
  
  /**
   * Trie par pertinence
   */
  _sortByRelevance(items, query) {
    return items.sort((a, b) => {
      const scoreA = this._calculateRelevanceScore(a, query);
      const scoreB = this._calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });
  },
  
  /**
   * Calcule le score de pertinence
   */
  _calculateRelevanceScore(item, query) {
    let score = 0;
    const normalizedQuery = this._normalizeText(query);
    
    // Correspondance exacte dans le nom (score élevé)
    if (item.nom && this._normalizeText(item.nom) === normalizedQuery) {
      score += 100;
    } else if (item.nom && this._normalizeText(item.nom).startsWith(normalizedQuery)) {
      score += 50;
    } else if (item.nom && this._normalizeText(item.nom).includes(normalizedQuery)) {
      score += 25;
    }
    
    // Correspondance dans le pseudo
    if (item.pseudo && this._normalizeText(item.pseudo) === normalizedQuery) {
      score += 80;
    } else if (item.pseudo && this._normalizeText(item.pseudo).includes(normalizedQuery)) {
      score += 20;
    }
    
    // Correspondance dans l'email
    if (item.email && this._normalizeText(item.email).includes(normalizedQuery)) {
      score += 15;
    }
    
    return score;
  },
  
  /**
   * Trie les messages par pertinence
   */
  _sortMessagesByRelevance(messages, query) {
    return messages.sort((a, b) => {
      const scoreA = this._calculateMessageRelevance(a, query);
      const scoreB = this._calculateMessageRelevance(b, query);
      
      if (scoreA === scoreB) {
        // Si même score, trier par date (plus récent d'abord)
        return new Date(b.date) - new Date(a.date);
      }
      
      return scoreB - scoreA;
    });
  },
  
  /**
   * Calcule la pertinence d'un message
   */
  _calculateMessageRelevance(message, query) {
    let score = 0;
    const normalizedQuery = this._normalizeText(query);
    
    if (message.messageType === 'text' && message.content) {
      const normalizedContent = this._normalizeText(message.content);
      
      // Correspondance exacte
      if (normalizedContent === normalizedQuery) {
        score += 100;
      }
      // Commence par la requête
      else if (normalizedContent.startsWith(normalizedQuery)) {
        score += 50;
      }
      // Contient la requête
      else if (normalizedContent.includes(normalizedQuery)) {
        // Plus de correspondances = score plus élevé
        const matches = normalizedContent.split(normalizedQuery).length - 1;
        score += 25 * matches;
      }
    }
    
    return score;
  },
  
  /**
   * Normalise le texte pour la recherche
   */
  _normalizeText(text) {
    if (!text) return '';
    
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
  },
  
  /**
   * Génère une clé de cache
   */
  _getCacheKey(type, query, filters) {
    return `${type}:${query}:${JSON.stringify(filters)}`;
  },
  
  /**
   * Surligne les termes de recherche dans le texte
   */
  highlightText(text, query) {
    if (!text || !query) return text;
    
    const normalizedQuery = this._normalizeText(query);
    const regex = new RegExp(`(${this._escapeRegex(query)})`, 'gi');
    
    return text.replace(regex, `<mark class="${this.config.highlightClass}">$1</mark>`);
  },
  
  /**
   * Échappe les caractères spéciaux regex
   */
  _escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
  
  /**
   * Vide le cache de recherche
   */
  clearCache() {
    this.searchCache.clear();
    console.log('[SearchFilter] Cache vidé');
  },
  
  /**
   * Crée un debounce pour la recherche
   */
  debounce(func, delay = this.config.debounceDelay) {
    let timeoutId;
    
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  },
  
  /**
   * Filtre avancé avec plusieurs critères
   */
  advancedSearch(items, criteria) {
    let results = [...items];
    
    // Recherche textuelle
    if (criteria.query) {
      const query = this._normalizeText(criteria.query);
      results = results.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return this._normalizeText(value).includes(query);
          }
          return false;
        });
      });
    }
    
    // Filtres personnalisés
    if (criteria.filters) {
      Object.keys(criteria.filters).forEach(key => {
        const filterValue = criteria.filters[key];
        results = results.filter(item => item[key] === filterValue);
      });
    }
    
    // Tri
    if (criteria.sortBy) {
      results.sort((a, b) => {
        const aVal = a[criteria.sortBy];
        const bVal = b[criteria.sortBy];
        
        if (criteria.sortOrder === 'desc') {
          return aVal < bVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    return results;
  },
  
  /**
   * Récupère les suggestions de recherche
   */
  getSuggestions(items, query, limit = 5) {
    if (!query || query.length < this.config.minSearchLength) {
      return [];
    }
    
    const normalizedQuery = this._normalizeText(query);
    const suggestions = new Set();
    
    items.forEach(item => {
      // Suggérer les noms qui commencent par la requête
      if (item.nom && this._normalizeText(item.nom).startsWith(normalizedQuery)) {
        suggestions.add(item.nom);
      }
      
      // Suggérer les pseudos
      if (item.pseudo && this._normalizeText(item.pseudo).startsWith(normalizedQuery)) {
        suggestions.add(item.pseudo);
      }
      
      // Suggérer les villes
      if (item.ville && this._normalizeText(item.ville).startsWith(normalizedQuery)) {
        suggestions.add(item.ville);
      }
    });
    
    return Array.from(suggestions).slice(0, limit);
  }
};

// Export global
if (typeof window !== 'undefined') {
  window.SearchFilterService = SearchFilterService;
}

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchFilterService;
}