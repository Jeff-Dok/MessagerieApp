// Gestion de l'authentification
const Auth = {
    // Connexion
    login(email, password) {
        const users = Storage.get(CONFIG.STORAGE_KEYS.USERS) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Créer un token simple (en production, utiliser JWT)
            const token = btoa(JSON.stringify({
                userId: user.id,
                email: user.email,
                timestamp: Date.now()
            }));
            
            Storage.set(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
            Storage.set(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
            
            return { success: true, user };
        }
        
        return { success: false, message: 'Email ou mot de passe incorrect' };
    },

    // Inscription
    register(nom, email, password) {
        const users = Storage.get(CONFIG.STORAGE_KEYS.USERS) || [];
        
        // Vérifier si l'email existe déjà
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Cet email est déjà utilisé' };
        }
        
        // Créer le nouvel utilisateur
        const newUser = {
            id: users.length + 1,
            email,
            password,
            nom,
            role: CONFIG.USER_ROLES.USER,
            dateCreation: new Date().toISOString()
        };
        
        users.push(newUser);
        Storage.set(CONFIG.STORAGE_KEYS.USERS, users);
        
        // Connecter automatiquement
        return this.login(email, password);
    },

    // Déconnexion
    logout() {
        Storage.remove(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        Storage.remove(CONFIG.STORAGE_KEYS.CURRENT_USER);
        window.location.href = 'login.html';
    },

    // Vérifier si connecté
    isAuthenticated() {
        return !!Storage.get(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    },

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return Storage.get(CONFIG.STORAGE_KEYS.CURRENT_USER);
    },

    // Protéger une page
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
};