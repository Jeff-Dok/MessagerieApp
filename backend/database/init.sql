-- ============================================
-- INIT SQL - Initialisation de la base de données
-- ============================================
-- 
-- Script pour créer la base de données et les tables
-- Exécuter avec: npm run db:init

-- Suppression de la base de données si elle existe
DROP DATABASE IF EXISTS messagerie_db;

-- Création de la base de données
CREATE DATABASE messagerie_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connexion à la base de données
\c messagerie_db;

-- ============================================
-- EXTENSIONS
-- ============================================

-- Extension UUID pour générer des identifiants uniques
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour recherche plein texte en français
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================
-- TABLE USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    "dateCreation" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Commentaires
COMMENT ON TABLE users IS 'Table des utilisateurs de l''application';
COMMENT ON COLUMN users.id IS 'Identifiant unique';
COMMENT ON COLUMN users.nom IS 'Nom complet de l''utilisateur';
COMMENT ON COLUMN users.email IS 'Adresse email unique';
COMMENT ON COLUMN users.password IS 'Mot de passe hashé avec bcrypt';
COMMENT ON COLUMN users.role IS 'Rôle: user ou admin';

-- ============================================
-- TABLE MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    content TEXT,
    "messageType" VARCHAR(20) DEFAULT 'text' CHECK ("messageType" IN ('text', 'image')),
    
    -- Champs pour les images
    "imageData" TEXT,
    "imageMimeType" VARCHAR(50),
    "imageFileName" VARCHAR(255),
    "imageViewedAt" TIMESTAMP,
    "imageExpiresAt" TIMESTAMP,
    "imageExpired" BOOLEAN DEFAULT FALSE,
    
    -- État du message
    read BOOLEAN DEFAULT FALSE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    CONSTRAINT fk_sender FOREIGN KEY ("senderId") 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_receiver FOREIGN KEY ("receiverId") 
        REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contraintes
    CONSTRAINT different_users CHECK ("senderId" != "receiverId")
);

-- Commentaires
COMMENT ON TABLE messages IS 'Table des messages (texte et images)';
COMMENT ON COLUMN messages."messageType" IS 'Type de message: text ou image';
COMMENT ON COLUMN messages."imageViewedAt" IS 'Date de première visualisation de l''image';
COMMENT ON COLUMN messages."imageExpiresAt" IS 'Date d''expiration de l''image';

-- ============================================
-- INDEX POUR OPTIMISATION
-- ============================================

-- Index sur les emails pour recherche rapide
CREATE INDEX idx_users_email ON users(email);

-- Index sur le rôle pour filtrage
CREATE INDEX idx_users_role ON users(role);

-- Index sur les messages par expéditeur
CREATE INDEX idx_messages_sender ON messages("senderId");

-- Index sur les messages par destinataire
CREATE INDEX idx_messages_receiver ON messages("receiverId");

-- Index sur le type de message
CREATE INDEX idx_messages_type ON messages("messageType");

-- Index sur la date d'expiration pour le nettoyage
CREATE INDEX idx_messages_expires ON messages("imageExpiresAt") 
    WHERE "imageExpired" = FALSE AND "messageType" = 'image';

-- Index sur la date de création
CREATE INDEX idx_messages_date ON messages(date DESC);

-- Index composite pour conversations
CREATE INDEX idx_conversation ON messages("senderId", "receiverId", date);

-- Index pour messages non lus
CREATE INDEX idx_unread ON messages("receiverId", read) WHERE read = FALSE;

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour dateModification automatiquement
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."dateModification" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour users
CREATE TRIGGER update_user_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue des conversations actives
CREATE OR REPLACE VIEW active_conversations AS
SELECT DISTINCT
    LEAST("senderId", "receiverId") AS user1,
    GREATEST("senderId", "receiverId") AS user2,
    MAX(date) AS last_message_date,
    COUNT(*) AS message_count
FROM messages
GROUP BY LEAST("senderId", "receiverId"), GREATEST("senderId", "receiverId")
ORDER BY last_message_date DESC;

COMMENT ON VIEW active_conversations IS 'Conversations actives avec dernière date de message';

-- ============================================
-- PERMISSIONS (optionnel)
-- ============================================

-- Révoquer tous les privilèges publics
REVOKE ALL ON DATABASE messagerie_db FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Accorder les privilèges à l'utilisateur postgres
GRANT ALL ON DATABASE messagerie_db TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================
-- MESSAGE DE SUCCÈS
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Base de données initialisée avec succès!';
    RAISE NOTICE '📊 Tables créées: users, messages';
    RAISE NOTICE '🔍 Index créés pour optimisation';
    RAISE NOTICE '⚡ Triggers configurés';
END $$;