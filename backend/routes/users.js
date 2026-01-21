/**
 * ============================================
 * USER ROUTES - Routes utilisateurs
 * ============================================
 *
 * @module routes/users
 */

const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const { authenticate, isAdmin } = require("../middleware/auth");
const { validateUserUpdate } = require("../middleware/validation");

/**
 * @route   GET /api/users
 * @desc    Récupère tous les utilisateurs
 * @access  Private
 */
router.get("/", authenticate, UserController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Récupère un utilisateur par ID
 * @access  Private
 */
router.get("/:id", authenticate, UserController.getUserById);

/**
 * @route   GET /api/users/:id/stats
 * @desc    Récupère les statistiques d'un utilisateur
 * @access  Private
 */
router.get("/:id/stats", authenticate, UserController.getUserStats);

/**
 * @route   PUT /api/users/:id
 * @desc    Met à jour un utilisateur
 * @access  Private
 */
router.put("/:id", authenticate, validateUserUpdate, UserController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprime un utilisateur (admin uniquement)
 * @access  Private/Admin
 */
router.delete("/:id", authenticate, isAdmin, UserController.deleteUser);

module.exports = router;
