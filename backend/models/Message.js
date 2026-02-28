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
const { MESSAGE_TYPES, IMAGE_CONFIG, CLEANUP_CONFIG } = require("../utils/constants");
const { encryptionService } = require("../services/encryptionService");

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

    imageEncrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indique si les données de l'image sont chiffrées",
    },

    // Champs pour le chiffrement E2E des messages texte
    encryptedContent: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      comment: "Contenu du message chiffré (E2E)",
    },

    encryptedKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Clé AES chiffrée avec la clé publique du destinataire (E2E)",
    },

    isE2EEncrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indique si le message est chiffré de bout en bout",
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
    ]
  },
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
 * Retourne le message en version sécurisée (sans données d'image si expirée, déchiffrée si nécessaire)
 * @returns {Object} Message en version sécurisée
 */
Message.prototype.toSecureJSON = function () {
  const data = this.toJSON();

  if (this.messageType === MESSAGE_TYPES.IMAGE) {
    // Si l'image est expirée, ne pas envoyer les données
    if (this.isImageExpired()) {
      data.imageData = null;
      data.imageExpired = true;
      data.content = "[Image expirée]";
    }
    // Si l'image est chiffrée et non expirée, la déchiffrer
    else if (data.imageEncrypted && data.imageData) {
      try {
        const decryptedDataUrl = encryptionService.decryptImageDataUrl(
          data.imageData,
          data.imageMimeType
        );
        data.imageData = decryptedDataUrl;
      } catch (error) {
        console.error("[Message] Erreur déchiffrement image:", error.message);
        // En cas d'erreur, garder les données telles quelles
      }
    }
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
 * Trouve les messages d'une conversation avec pagination
 * @param {number} userId1 - ID du premier utilisateur
 * @param {number} userId2 - ID du deuxième utilisateur
 * @param {Object} options - Options de pagination
 * @param {number} [options.limit=50] - Nombre de messages par page
 * @param {number} [options.offset=0] - Décalage pour la pagination
 * @returns {Promise<{rows: Message[], count: number}>} Messages et total
 */
Message.findConversation = async function (userId1, userId2, options = {}) {
  const { Op } = require("sequelize");
  const { limit = 50, offset = 0 } = options;

  return await this.findAndCountAll({
    where: {
      [Op.or]: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ]
    },
    order: [["date", "DESC"]],
    limit,
    offset,
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
    ]
  });
};

/**
 * Trouve les images expirées et prêtes pour le nettoyage
 * (expirées depuis au moins CLEANUP_DELAY secondes)
 * @returns {Promise<Message[]>} Images à nettoyer
 */
Message.findExpiredImages = async function () {
  const { Op } = require("sequelize");
  // Nettoyer les images dont le timer a expiré depuis CLEANUP_DELAY secondes
  // On ne filtre plus par imageExpired car l'API expireImage() peut l'avoir mis à true
  const cleanupThreshold = new Date(Date.now() - CLEANUP_CONFIG.CLEANUP_DELAY * 1000);

  return await this.findAll({
    where: {
      messageType: MESSAGE_TYPES.IMAGE,
      imageExpiresAt: {
        [Op.not]: null,
        [Op.lte]: cleanupThreshold,
      }
    },
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
    }
  });
};

/**
 * Définir les associations
 */
const User = require("./User");
Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });

module.exports = Message;
