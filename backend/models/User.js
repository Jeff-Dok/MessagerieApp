/**
 * ============================================
 * MODEL USER - Modèle Utilisateur
 * ============================================
 * 
 * Représente un utilisateur de l'application
 * 
 * Relations:
 * - Un utilisateur peut envoyer plusieurs messages
 * - Un utilisateur peut recevoir plusieurs messages
 * 
 * @module models/User
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../utils/constants');

/**
 * Modèle Utilisateur
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identifiant unique de l\'utilisateur'
  },
  
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom ne peut pas être vide'
      },
      len: {
        args: [2, 100],
        msg: 'Le nom doit contenir entre 2 et 100 caractères'
      }
    },
    comment: 'Nom complet de l\'utilisateur'
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Cet email est déjà utilisé'
    },
    validate: {
      isEmail: {
        msg: 'Format d\'email invalide'
      },
      notEmpty: {
        msg: 'L\'email ne peut pas être vide'
      }
    },
    comment: 'Adresse email unique de l\'utilisateur'
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le mot de passe ne peut pas être vide'
      },
      len: {
        args: [6, 255],
        msg: 'Le mot de passe doit contenir au moins 6 caractères'
      }
    },
    comment: 'Mot de passe hashé avec bcrypt'
  },
  
  role: {
    type: DataTypes.ENUM(Object.values(USER_ROLES)),
    defaultValue: USER_ROLES.USER,
    allowNull: false,
    comment: 'Rôle de l\'utilisateur (user ou admin)'
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
    /**
     * Avant création - Hash le mot de passe
     */
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    
    /**
     * Avant mise à jour - Hash le mot de passe si modifié
     */
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  
  /**
   * Index pour optimiser les requêtes
   */
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    }
  ]
});

/**
 * Méthodes d'instance
 */

/**
 * Compare un mot de passe avec le hash stocké
 * @param {string} candidatePassword - Mot de passe à vérifier
 * @returns {Promise<boolean>} true si le mot de passe correspond
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
 * @returns {boolean} true si admin
 */
User.prototype.isAdmin = function() {
  return this.role === USER_ROLES.ADMIN;
};

/**
 * Retourne une version publique de l'utilisateur (sans mot de passe)
 * @returns {Object} Données publiques de l'utilisateur
 */
User.prototype.toPublicJSON = function() {
  const { password, ...publicData } = this.toJSON();
  return publicData;
};

/**
 * Override toJSON pour retirer automatiquement le mot de passe
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

/**
 * Méthodes de classe
 */

/**
 * Trouve un utilisateur par email
 * @param {string} email - Email à rechercher
 * @returns {Promise<User|null>} Utilisateur trouvé ou null
 */
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

/**
 * Trouve tous les administrateurs
 * @returns {Promise<User[]>} Liste des administrateurs
 */
User.findAdmins = async function() {
  return await this.findAll({ 
    where: { role: USER_ROLES.ADMIN },
    attributes: { exclude: ['password'] }
  });
};

module.exports = User;