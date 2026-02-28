/**
 * ============================================
 * MODEL CONVERSATION DELETION - Suppression de conversations
 * ============================================
 *
 * Représente une suppression de conversation par un utilisateur
 * Permet le soft delete: la conversation est cachée pour l'utilisateur
 * mais reste visible pour l'autre jusqu'à ce qu'il la supprime aussi
 *
 * @module models/ConversationDeletion
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Modèle ConversationDeletion
 */
const ConversationDeletion = sequelize.define(
  "ConversationDeletion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Identifiant unique de la suppression",
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      comment: "ID de l'utilisateur qui a supprimé la conversation",
    },

    otherUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      comment: "ID de l'autre utilisateur de la conversation",
    },

    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Date de suppression de la conversation",
    },
  },
  {
    tableName: "conversation_deletions",
    timestamps: false,

    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["otherUserId"],
      },
      {
        // Index unique pour éviter les doublons
        unique: true,
        fields: ["userId", "otherUserId"],
      },
    ],
  }
);

/**
 * Méthodes de classe
 */

/**
 * Vérifie si un utilisateur a supprimé une conversation
 * @param {number} userId - ID de l'utilisateur
 * @param {number} otherUserId - ID de l'autre utilisateur
 * @returns {Promise<boolean>} true si supprimée
 */
ConversationDeletion.hasDeleted = async function (userId, otherUserId) {
  const deletion = await this.findOne({
    where: { userId, otherUserId },
  });
  return !!deletion;
};

/**
 * Vérifie si les deux utilisateurs ont supprimé la conversation
 * @param {number} userId1 - ID du premier utilisateur
 * @param {number} userId2 - ID du deuxième utilisateur
 * @returns {Promise<boolean>} true si les deux ont supprimé
 */
ConversationDeletion.bothDeleted = async function (userId1, userId2) {
  const { Op } = require("sequelize");
  const count = await this.count({
    where: {
      [Op.or]: [
        { userId: userId1, otherUserId: userId2 },
        { userId: userId2, otherUserId: userId1 },
      ],
    },
  });
  return count === 2;
};

/**
 * Récupère tous les IDs d'utilisateurs dont les conversations ont été supprimées par un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<number[]>} Liste des IDs d'utilisateurs
 */
ConversationDeletion.getDeletedConversationUserIds = async function (userId) {
  const deletions = await this.findAll({
    where: { userId },
    attributes: ["otherUserId"],
  });
  return deletions.map((d) => d.otherUserId);
};

/**
 * Supprime les enregistrements de suppression pour une conversation
 * (utilisé après suppression définitive des messages)
 * @param {number} userId1 - ID du premier utilisateur
 * @param {number} userId2 - ID du deuxième utilisateur
 * @returns {Promise<number>} Nombre d'enregistrements supprimés
 */
ConversationDeletion.removeForConversation = async function (userId1, userId2) {
  const { Op } = require("sequelize");
  return await this.destroy({
    where: {
      [Op.or]: [
        { userId: userId1, otherUserId: userId2 },
        { userId: userId2, otherUserId: userId1 },
      ],
    },
  });
};

module.exports = ConversationDeletion;
