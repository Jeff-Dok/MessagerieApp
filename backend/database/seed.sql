-- ============================================
-- SEED SQL - Données de test
-- ============================================
-- 
-- Script pour insérer des données de démonstration
-- Exécuter avec: npm run db:seed

-- Connexion à la base de données
\c messagerie_db;

-- ============================================
-- NETTOYAGE DES DONNÉES EXISTANTES
-- ============================================

TRUNCATE TABLE messages RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- ============================================
-- INSERTION DES UTILISATEURS
-- ============================================

-- Note: Les mots de passe doivent être hashés avec bcrypt
-- Pour les tests, utilisez un outil en ligne ou le code backend

INSERT INTO users (nom, email, password, role) VALUES
('Administrateur', 'admin@example.com', '$2a$10$YourHashedPasswordHere1', 'admin'),
('Jean Dupont', 'user1@example.com', '$2a$10$YourHashedPasswordHere2', 'user'),
('Marie Martin', 'user2@example.com', '$2a$10$YourHashedPasswordHere3', 'user'),
('Pierre Dubois', 'user3@example.com', '$2a$10$YourHashedPasswordHere4', 'user'),
('Sophie Lefebvre', 'user4@example.com', '$2a$10$YourHashedPasswordHere5', 'user');

-- ============================================
-- INSERTION DES MESSAGES DE TEST
-- ============================================

INSERT INTO messages ("senderId", "receiverId", content, "messageType", read, date) VALUES
-- Conversation Admin <-> Jean
(1, 2, 'Bienvenue sur la plateforme !', 'text', true, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 1, 'Merci beaucoup !', 'text', true, CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '5 minutes'),
(1, 2, 'N''hésitez pas si vous avez des questions', 'text', true, CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '10 minutes'),

-- Conversation Admin <-> Marie
(1, 3, 'Bonjour Marie, comment allez-vous ?', 'text', false, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 1, 'Très bien merci ! Et vous ?', 'text', true, CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '10 minutes'),

-- Conversation Jean <-> Marie
(2, 3, 'Salut Marie, on se voit demain ?', 'text', false, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(3, 2, 'Oui avec plaisir ! À quelle heure ?', 'text', true, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(2, 3, 'Vers 14h au café habituel ?', 'text', false, CURRENT_TIMESTAMP - INTERVAL '1 hour'),

-- Conversation Pierre <-> Jean
(4, 2, 'Jean, as-tu reçu mon email ?', 'text', false, CURRENT_TIMESTAMP - INTERVAL '1 hour'),

-- Conversation Admin <-> Sophie
(1, 5, 'Sophie, bienvenue dans l''équipe !', 'text', false, CURRENT_TIMESTAMP - INTERVAL '30 minutes');

-- ============================================
-- STATISTIQUES
-- ============================================

DO $$ 
DECLARE
    user_count INTEGER;
    message_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO message_count FROM messages;
    
    RAISE NOTICE '✅ Données de test insérées avec succès!';
    RAISE NOTICE '👥 Utilisateurs créés: %', user_count;
    RAISE NOTICE '💬 Messages créés: %', message_count;
END $$;

-- ============================================
-- AFFICHAGE DES DONNÉES
-- ============================================

-- Afficher les utilisateurs
SELECT '=== UTILISATEURS ===' AS section;
SELECT id, nom, email, role FROM users ORDER BY id;

-- Afficher les messages
SELECT '=== MESSAGES ===' AS section;
SELECT 
    m.id,
    u1.nom AS expediteur,
    u2.nom AS destinataire,
    LEFT(m.content, 50) AS apercu,
    m."messageType",
    m.read AS lu,
    m.date
FROM messages m
JOIN users u1 ON m."senderId" = u1.id
JOIN users u2 ON m."receiverId" = u2.id
ORDER BY m.date DESC;