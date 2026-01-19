-- ============================================
-- MIGRATION - Profils Utilisateurs Étendus
-- ============================================
-- Ajoute les nouveaux champs pour les profils enrichis

-- Connexion à la base de données
\c messagerie_db;

-- ============================================
-- MODIFICATION DE LA TABLE USERS
-- ============================================

-- Ajouter les nouveaux champs
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS pseudo VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS date_naissance DATE,
  ADD COLUMN IF NOT EXISTS ville VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS photo_profil TEXT,
  ADD COLUMN IF NOT EXISTS photo_mime_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS date_validation TIMESTAMP,
  ADD COLUMN IF NOT EXISTS validateur_id INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS raison_rejet TEXT;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON COLUMN users.pseudo IS 'Nom d''utilisateur unique visible publiquement';
COMMENT ON COLUMN users.date_naissance IS 'Date de naissance de l''utilisateur';
COMMENT ON COLUMN users.ville IS 'Ville de résidence';
COMMENT ON COLUMN users.bio IS 'Brève description personnelle (max 500 caractères)';
COMMENT ON COLUMN users.photo_profil IS 'Photo de profil encodée en Base64';
COMMENT ON COLUMN users.photo_mime_type IS 'Type MIME de la photo de profil';
COMMENT ON COLUMN users.statut IS 'Statut du profil: pending, approved, rejected';
COMMENT ON COLUMN users.date_validation IS 'Date de validation/rejet du profil';
COMMENT ON COLUMN users.validateur_id IS 'ID de l''admin qui a validé/rejeté';
COMMENT ON COLUMN users.raison_rejet IS 'Raison du rejet si applicable';

-- ============================================
-- INDEX POUR OPTIMISATION
-- ============================================

-- Index sur le pseudo pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_pseudo ON users(pseudo);

-- Index sur le statut pour filtrage
CREATE INDEX IF NOT EXISTS idx_users_statut ON users(statut);

-- Index sur la ville pour filtrage géographique
CREATE INDEX IF NOT EXISTS idx_users_ville ON users(ville);

-- Index composite pour les profils en attente
CREATE INDEX IF NOT EXISTS idx_users_pending ON users(statut, "dateCreation") 
  WHERE statut = 'pending';

-- ============================================
-- CONTRAINTES SUPPLÉMENTAIRES
-- ============================================

-- Le pseudo doit être unique et avoir au moins 3 caractères
ALTER TABLE users 
  ADD CONSTRAINT check_pseudo_length 
  CHECK (pseudo IS NULL OR LENGTH(pseudo) >= 3);

-- La bio ne peut pas dépasser 500 caractères
ALTER TABLE users 
  ADD CONSTRAINT check_bio_length 
  CHECK (bio IS NULL OR LENGTH(bio) <= 500);

-- La date de naissance doit être dans le passé
ALTER TABLE users 
  ADD CONSTRAINT check_date_naissance 
  CHECK (date_naissance IS NULL OR date_naissance < CURRENT_DATE);

-- L'utilisateur doit avoir au moins 13 ans (COPPA compliance)
ALTER TABLE users 
  ADD CONSTRAINT check_age_minimum 
  CHECK (date_naissance IS NULL OR date_naissance <= CURRENT_DATE - INTERVAL '13 years');

-- ============================================
-- VUE POUR LES PROFILS EN ATTENTE
-- ============================================

CREATE OR REPLACE VIEW profils_en_attente AS
SELECT 
  u.id,
  u.pseudo,
  u.nom,
  u.email,
  u.ville,
  u.bio,
  u.photo_profil,
  u.date_naissance,
  u."dateCreation",
  EXTRACT(YEAR FROM AGE(u.date_naissance)) AS age
FROM users u
WHERE u.statut = 'pending'
ORDER BY u."dateCreation" ASC;

COMMENT ON VIEW profils_en_attente IS 'Profils en attente de validation';

-- ============================================
-- VUE POUR LES PROFILS APPROUVÉS
-- ============================================

CREATE OR REPLACE VIEW profils_approuves AS
SELECT 
  u.id,
  u.pseudo,
  u.nom,
  u.email,
  u.ville,
  u.bio,
  u.photo_profil,
  u.date_naissance,
  u.date_validation,
  v.nom AS validateur_nom
FROM users u
LEFT JOIN users v ON u.validateur_id = v.id
WHERE u.statut = 'approved'
ORDER BY u.date_validation DESC;

COMMENT ON VIEW profils_approuves IS 'Profils validés avec info validateur';

-- ============================================
-- FONCTION POUR VALIDER UN PROFIL
-- ============================================

CREATE OR REPLACE FUNCTION valider_profil(
  p_user_id INTEGER,
  p_validateur_id INTEGER,
  p_approuve BOOLEAN,
  p_raison_rejet TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET 
    statut = CASE WHEN p_approuve THEN 'approved' ELSE 'rejected' END,
    date_validation = CURRENT_TIMESTAMP,
    validateur_id = p_validateur_id,
    raison_rejet = CASE WHEN NOT p_approuve THEN p_raison_rejet ELSE NULL END
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION valider_profil IS 'Valide ou rejette un profil utilisateur';

-- ============================================
-- FONCTION POUR CALCULER L'ÂGE
-- ============================================

CREATE OR REPLACE FUNCTION calculer_age(date_naissance DATE)
RETURNS INTEGER AS $$
BEGIN
  IF date_naissance IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(YEAR FROM AGE(date_naissance));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculer_age IS 'Calcule l''âge à partir de la date de naissance';

-- ============================================
-- TRIGGER POUR METTRE À JOUR dateModification
-- ============================================

CREATE OR REPLACE FUNCTION update_profil_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW."dateModification" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profil_modified
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION update_profil_modified();

-- ============================================
-- MISE À JOUR DES UTILISATEURS EXISTANTS
-- ============================================

-- Mettre les utilisateurs existants comme "approved"
UPDATE users 
SET statut = 'approved', 
    date_validation = CURRENT_TIMESTAMP
WHERE statut IS NULL OR statut = 'pending';

-- ============================================
-- STATISTIQUES
-- ============================================

DO $$ 
DECLARE
  pending_count INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count FROM users WHERE statut = 'pending';
  SELECT COUNT(*) INTO approved_count FROM users WHERE statut = 'approved';
  SELECT COUNT(*) INTO rejected_count FROM users WHERE statut = 'rejected';
  
  RAISE NOTICE '✅ Migration profils complétée!';
  RAISE NOTICE '📊 Profils en attente: %', pending_count;
  RAISE NOTICE '✓ Profils approuvés: %', approved_count;
  RAISE NOTICE '✗ Profils rejetés: %', rejected_count;
END $$;