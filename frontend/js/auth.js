// Gestion de l'authentification avec API Backend
const Auth = {
    // Connexion
    async login(email, password) {
        try {
            const response = await API.login(email, password);

            if (response && response.success) {
                // Stocker le token et l'utilisateur
                if (response.token) {
                    localStorage.setItem('authToken', response.token);
                }
                if (response.user) {
                    localStorage.setItem('currentUser', JSON.stringify(response.user));
                }
                return { success: true, user: response.user };
            }

            return { success: false, message: response?.message || 'Email ou mot de passe incorrect' };
        } catch (error) {
            console.error('Erreur login:', error);
            throw error;
        }
    },

    // Inscription (désactivé, utiliser register.html qui appelle l'API directement)
    register(nom, email, password) {
        console.error('Utiliser register.html pour l\'inscription');
        return { success: false, message: 'Utiliser la page d\'inscription' };
    },

    // Déconnexion
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        // Obtenir le répertoire de la page actuelle et ajouter login.html
        const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        window.location.href = currentDir + 'login.html';
    },

    // Vérifier si connecté
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // Protéger une page
    requireAuth() {
        if (!this.isAuthenticated()) {
            // Construire l'URL de login dans le même dossier
            const currentPath = window.location.pathname;
            const lastSlashIndex = currentPath.lastIndexOf('/');
            const loginPath = currentPath.substring(0, lastSlashIndex + 1) + 'login.html';
            window.location.href = loginPath;
            return false;
        }
        return true;
    }
};
