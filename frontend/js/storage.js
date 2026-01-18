// Gestion du stockage local
const Storage = {
    // Initialiser les données de démonstration
    init() {
        if (!this.get(CONFIG.STORAGE_KEYS.USERS)) {
            this.set(CONFIG.STORAGE_KEYS.USERS, CONFIG.DEMO_DATA.users);
        }
        if (!this.get(CONFIG.STORAGE_KEYS.MESSAGES)) {
            this.set(CONFIG.STORAGE_KEYS.MESSAGES, CONFIG.DEMO_DATA.messages);
        }
    },

    // Sauvegarder des données
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            return false;
        }
    },

    // Récupérer des données
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Erreur de lecture:', error);
            return null;
        }
    },

    // Supprimer des données
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erreur de suppression:', error);
            return false;
        }
    },

    // Tout effacer
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Erreur de nettoyage:', error);
            return false;
        }
    }
};

// Initialiser au chargement
Storage.init();