/**
 * ============================================
 * MODELS INDEX - Export centralisé des modèles
 * ============================================
 *
 * Centralise l'export de tous les modèles
 *
 * @module models
 */

const User = require("./User");
const Message = require("./Message");
const ConversationDeletion = require("./ConversationDeletion");

module.exports = {
  User,
  Message,
  ConversationDeletion,
};
