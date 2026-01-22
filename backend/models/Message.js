/**
 * ============================================
 * MODEL MESSAGE - Modèle Message
 * ============================================
 *
 * Représente un message (texte ou image) entre utilisateurs
 *
 * Fonctionnalités:
 * - Messages texte et images
 * - Expiration automatique des images après visualisation
 * - Marquage de lecture
 *
 * @module models/Message
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { MESSAGE_TYPES, IMAGE_CONFIG } = require("../utils/constants");

/**
 * Modèle Message
 */
const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identifiant unique du message",
    },

    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      comment: "ID de l'expéditeur",
    },

    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      comment: "ID du destinataire",
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 5000],
          msg: "Le contenu doit contenir entre 0 et 5000 caractères",
        },
      },
      comment: "Contenu du message texte",
    },

    messageType: {
      type: DataTypes.ENUM(Object.values(MESSAGE_TYPES)),
      defaultValue: MESSAGE_TYPES.TEXT,
      allowNull: false,
      comment: "Type de message (text ou image)",
    },

    // Champs spécifiques aux images
    imageData: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      comment: "Données de l'image encodées en Base64",
    },

    imageMimeType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Type MIME de l'image",
    },

    imageFileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Nom original du fichier image",
    },

    // Gestion de l'expiration des images
    imageViewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Date de première visualisation de l'image",
    },

    imageExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Date d'expiration de l'image",
    },

    imageExpired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indique si l'image a expiré",
    },

    // État de lecture
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indique si le message a été lu",
    },

    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Date d'envoi du message",
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    createdAt: "date",
    updatedAt: false,

    /**
     * Index pour optimiser les requêtes
     */
    indexes: [
      {
        fields: ["senderId"],
      },
      {
        fields: ["receiverId"],
      },
      {
        fields: ["messageType"],
      },
      {
        fields: ["imageExpiresAt"],
      },
      {
        fields: ["date"],
      },
      {
        // Index composite pour les conversations
        fields: ["senderId", "receiverId"],
      },
    ],
  }
);

/**
 * Méthodes d'instance
 */

/**
 * Vérifie si l'image a expiré
 * @returns {boolean} true si l'image est expirée
 */
Message.prototype.isImageExpired = function () {
  if (this.messageType !== MESSAGE_TYPES.IMAGE) return false;
  if (!this.imageExpiresAt) return false;
  return new Date() > this.imageExpiresAt || this.imageExpired;
};

/**
 * Marque l'image comme vue et définit la date d'expiration
 * @returns {Promise<Message>} Message mis à jour
 */
Message.prototype.markImageAsViewed = async function () {
  if (this.messageType !== MESSAGE_TYPES.IMAGE) {
    throw new Error("Ce message n'est pas une image");
  }

  if (this.imageViewedAt) {
    return this; // Déjà vue
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + IMAGE_CONFIG.EXPIRATION_TIME * 60 * 1000,
  );

  return await this.update({
    imageViewedAt: now,
    imageExpiresAt: expiresAt,
  });
};

/**
 * Fait expirer l'image manuellement
 * @returns {Promise<Message>} Message mis à jour
 */
Message.prototype.expireImage = async function () {
  if (this.messageType !== MESSAGE_TYPES.IMAGE) {
    throw new Error("Ce message n'est pas une image");
  }

  return await this.update({
    imageData: null,
    imageExpired: true,
    content: "[Image expirée]",
  });
};

/**
 * Retourne le message en version sécurisée (sans données d'image si expirée)
 * @returns {Object} Message en version sécurisée
 */
Message.prototype.toSecureJSON = function () {
  const data = this.toJSON();

  if (this.messageType === MESSAGE_TYPES.IMAGE && this.isImageExpired()) {
    data.imageData = null;
    data.imageExpired = true;
    data.content = "[Image expirée]";
  }

  return data;
};

/**
 * Vérifie si l'utilisateur peut voir ce message
 * @param {number} userId - ID de l'utilisateur
 * @returns {boolean} true si autorisé
 */
Message.prototype.canBeViewedBy = function (userId) {
  return this.senderId === userId || this.receiverId === userId;
};

/**
 * Vérifie si l'utilisateur peut supprimer ce message
 * @param {number} userId - ID de l'utilisateur
 * @param {string} userRole - Rôle de l'utilisateur
 * @returns {boolean} true si autorisé
 */
Message.prototype.canBeDeletedBy = function (userId, userRole) {
  return this.senderId === userId || userRole === "admin";
};

/**
 * Méthodes de classe
 */

/**
 * Trouve les messages d'une conversation
 * @param {number} userId1 - ID du premier utilisateur
 * @param {number} userId2 - ID du deuxième utilisateur
 * @returns {Promise<Message[]>} Messages de la conversation
 */
Message.findConversation = async function (userId1, userId2) {
  const { Op } = require("sequelize");

  return await this.findAll({
    where: {
      [Op.or]: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    },
    order: [["date", "ASC"]],
    include: [
      {
        model: require("./User"),
        as: "sender",
        attributes: ["id", "nom", "email"],
      },
      {
        model: require("./User"),
        as: "receiver",
        attributes: ["id", "nom", "email"],
      },
    ],
  });
};

/**
 * Trouve les images expirées
 * @returns {Promise<Message[]>} Images expirées
 */
Message.findExpiredImages = async function () {
  const { Op } = require("sequelize");
  const now = new Date();

  return await this.findAll({
    where: {
      messageType: MESSAGE_TYPES.IMAGE,
      imageExpired: false,
      imageExpiresAt: {
        [Op.lte]: now,
      },
    }
  });
};

/**
 * Compte les messages non lus d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<number>} Nombre de messages non lus
 */
Message.countUnreadForUser = async function (userId) {
  return await this.count({
    where: {
      receiverId: userId,
      read: false,
    },
  });
};

/**
 * Définir les associations
 */
const User = require("./User");
Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });

module.exports = Message;
