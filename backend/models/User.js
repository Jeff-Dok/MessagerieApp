/**
 * ============================================
 * MODEL USER ÉTENDU - Profils Enrichis
 * ============================================
 * 
 * Modèle utilisateur avec profil complet et système de validation
 * 
 * @module models/User
 * @version 3.0.0
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { USER_ROLES, USER_STATUS } = require('../utils/constants');

/**
 * Modèle Utilisateur Étendu
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique'
  },
  
  // ============================================
  // INFORMATIONS DE BASE
  // ============================================
  
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le nom ne peut pas être vide' },
      len: {
        args: [2, 100],
        msg: 'Le nom doit contenir entre 2 et 100 caractères'
      }
    },
    comment: 'Nom complet de l\'utilisateur'
  },
  
  pseudo: {
    type: DataTypes.STRING(50),
    unique: {
      name: 'unique_pseudo',
      msg: 'Ce pseudo est déjà utilisé'
    },
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le pseudo ne peut pas être vide' },
      len: {
        args: [3, 50],
        msg: 'Le pseudo doit contenir entre 3 et 50 caractères'
      },
      is: {
        args: /^[a-zA-Z0-9_-]+$/,
        msg: 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -'
      }
    },
    comment: 'Nom d\'utilisateur unique visible publiquement'
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Cet email est déjà utilisé'
    },
    validate: {
      isEmail: { msg: 'Format d\'email invalide' },
      notEmpty: { msg: 'L\'email ne peut pas être vide' }
    },
    comment: 'Adresse email unique'
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le mot de passe ne peut pas être vide' },
      len: {
        args: [6, 255],
        msg: 'Le mot de passe doit contenir au moins 6 caractères'
      }
    },
    comment: 'Mot de passe hashé avec bcrypt'
  },
  
  // ============================================
  // PROFIL ÉTENDU
  // ============================================
  
  dateNaissance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La date de naissance est requise' },
      isDate: { msg: 'Format de date invalide' },
      isInPast(value) {
        if (new Date(value) >= new Date()) {
          throw new Error('La date de naissance doit être dans le passé');
        }
      },
      isOldEnough(value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 13) {
          throw new Error('Vous devez avoir au moins 13 ans pour vous inscrire');
        }
      }
    },
    comment: 'Date de naissance (utilisateur doit avoir 13+ ans)'
  },
  
  ville: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La ville ne peut pas être vide' },
      len: {
        args: [2, 100],
        msg: 'La ville doit contenir entre 2 et 100 caractères'
      }
    },
    comment: 'Ville de résidence'
  },
  
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
    validate: {
      len: {
        args: [0, 500],
        msg: 'La bio ne peut pas dépasser 500 caractères'
      }
    },
    comment: 'Brève description personnelle (max 500 caractères)'
  },
  
  // ============================================
  // PHOTO DE PROFIL
  // ============================================
  
  photoProfil: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Photo de profil encodée en Base64'
  },
  
  photoMimeType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type MIME de la photo de profil'
  },
  
  // ============================================
  // SYSTÈME DE VALIDATION
  // ============================================
  
  statut: {
    type: DataTypes.ENUM(Object.values(USER_STATUS)),
    defaultValue: USER_STATUS.PENDING,
    allowNull: false,
    comment: 'Statut du profil (pending, approved, rejected)'
  },
  
  dateValidation: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de validation/rejet du profil'
  },
  
  validateurId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID de l\'admin qui a validé/rejeté'
  },
  
  raisonRejet: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison du rejet si applicable'
  },
  
  // ============================================
  // RÔLE ET DATES
  // ============================================
  
  role: {
    type: DataTypes.ENUM(Object.values(USER_ROLES)),
    defaultValue: USER_ROLES.USER,
    allowNull: false,
    comment: 'Rôle utilisateur (user ou admin)'
  },
  
  dateCreation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Date de création du compte'
  },
  
  dateModification: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Date de dernière modification'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'dateCreation',
  updatedAt: 'dateModification',
  
  /**
   * Hooks Sequelize
   */
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  
  indexes: [
    { unique: true, fields: ['email'] },
    { unique: true, fields: ['pseudo'] },
    { fields: ['role'] },
    { fields: ['statut'] },
    { fields: ['ville'] },
    { fields: ['statut', 'dateCreation'], where: { statut: 'pending' } }
  ]
});

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

/**
 * Compare un mot de passe avec le hash stocké
 */
User.prototype.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du mot de passe');
  }
};

/**
 * Vérifie si l'utilisateur est administrateur
 */
User.prototype.isAdmin = function() {
  return this.role === USER_ROLES.ADMIN;
};

/**
 * Vérifie si le profil est validé
 */
User.prototype.isApproved = function() {
  return this.statut === USER_STATUS.APPROVED;
};

/**
 * Vérifie si le profil est en attente
 */
User.prototype.isPending = function() {
  return this.statut === USER_STATUS.PENDING;
};

/**
 * Vérifie si le profil est rejeté
 */
User.prototype.isRejected = function() {
  return this.statut === USER_STATUS.REJECTED;
};

/**
 * Calcule l'âge de l'utilisateur
 */
User.prototype.getAge = function() {
  if (!this.dateNaissance) return null;
  
  const birthDate = new Date(this.dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Approuve le profil
 */
User.prototype.approve = async function(validatorId) {
  return await this.update({
    statut: USER_STATUS.APPROVED,
    dateValidation: new Date(),
    validateurId: validatorId,
    raisonRejet: null
  });
};

/**
 * Rejette le profil
 */
User.prototype.reject = async function(validatorId, reason) {
  return await this.update({
    statut: USER_STATUS.REJECTED,
    dateValidation: new Date(),
    validateurId: validatorId,
    raisonRejet: reason
  });
};

/**
 * Retourne une version publique de l'utilisateur
 */
User.prototype.toPublicJSON = function() {
  const data = this.toJSON();
  delete data.password;
  delete data.validateurId;
  delete data.raisonRejet;
  
  // Ajouter l'âge calculé
  data.age = this.getAge();
  
  return data;
};

/**
 * Retourne le profil pour l'admin (avec infos sensibles)
 */
User.prototype.toAdminJSON = function() {
  const data = this.toJSON();
  delete data.password;
  data.age = this.getAge();
  return data;
};

/**
 * Override toJSON pour retirer automatiquement le mot de passe
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// ============================================
// MÉTHODES DE CLASSE
// ============================================

/**
 * Trouve un utilisateur par email
 */
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

/**
 * Trouve un utilisateur par pseudo
 */
User.findByPseudo = async function(pseudo) {
  return await this.findOne({ where: { pseudo } });
};

/**
 * Trouve tous les profils en attente
 */
User.findPendingProfiles = async function() {
  return await this.findAll({
    where: { statut: USER_STATUS.PENDING },
    order: [['dateCreation', 'ASC']],
    attributes: { exclude: ['password'] }
  });
};

/**
 * Trouve tous les profils approuvés
 */
User.findApprovedProfiles = async function() {
  return await this.findAll({
    where: { statut: USER_STATUS.APPROVED },
    order: [['dateValidation', 'DESC']],
    attributes: { exclude: ['password'] }
  });
};

/**
 * Compte les profils en attente
 */
User.countPending = async function() {
  return await this.count({
    where: { statut: USER_STATUS.PENDING }
  });
};

/**
 * Recherche des utilisateurs par ville
 */
User.findByCity = async function(ville) {
  return await this.findAll({
    where: { 
      ville,
      statut: USER_STATUS.APPROVED 
    },
    attributes: { exclude: ['password'] }
  });
};

/**
 * Trouve tous les administrateurs
 */
User.findAdmins = async function() {
  return await this.findAll({ 
    where: { role: USER_ROLES.ADMIN },
    attributes: { exclude: ['password'] }
  });
};

module.exports = User;