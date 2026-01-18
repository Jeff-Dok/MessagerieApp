// Configuration de l'application
const CONFIG = {
    APP_NAME: 'MessagerieApp',
    VERSION: '1.0.0',
    STORAGE_KEYS: {
        USERS: 'messagerie_users',
        MESSAGES: 'messagerie_messages',
        CURRENT_USER: 'messagerie_current_user',
        AUTH_TOKEN: 'authToken'
    },
    USER_ROLES: {
        ADMIN: 'admin',
        USER: 'user'
    },
    DEMO_DATA: {
        users: [
            {
                id: 1,
                email: 'admin@example.com',
                password: 'admin123',
                nom: 'Administrateur',
                role: 'admin',
                dateCreation: new Date().toISOString()
            },
            {
                id: 2,
                email: 'user1@example.com',
                password: 'user123',
                nom: 'Jean Dupont',
                role: 'user',
                dateCreation: new Date().toISOString()
            },
            {
                id: 3,
                email: 'user2@example.com',
                password: 'user123',
                nom: 'Marie Martin',
                role: 'user',
                dateCreation: new Date().toISOString()
            }
        ],
        messages: [
            {
                id: 1,
                senderId: 1,
                receiverId: 2,
                content: 'Bienvenue sur la plateforme !',
                date: new Date('2024-01-15T10:00:00').toISOString(),
                read: true
            },
            {
                id: 2,
                senderId: 2,
                receiverId: 1,
                content: 'Merci beaucoup !',
                date: new Date('2024-01-15T10:05:00').toISOString(),
                read: true
            }
        ]
    }
};