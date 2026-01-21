/**
 * ============================================
 * ADMIN ROUTES - Routes administration
 * ============================================
 *
 * @module routes/admin
 */

const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const { authenticate, isAdmin } = require("../middleware/auth");

/**
 * Toutes les routes admin nécessitent authentification + rôle admin
 */
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/pending-profiles
 * @desc    Récupère tous les profils en attente
 * @access  Private/Admin
 */
router.get("/pending-profiles", AdminController.getPendingProfiles);

/**
 * @route   GET /api/admin/pending-count
 * @desc    Récupère le nombre de profils en attente
 * @access  Private/Admin
 */
router.get("/pending-count", AdminController.getPendingCount);

/**
 * @route   GET /api/admin/profile/:id
 * @desc    Récupère les détails d'un profil
 * @access  Private/Admin
 */
router.get("/profile/:id", AdminController.getProfileDetails);

/**
 * @route   POST /api/admin/approve/:id
 * @desc    Approuve un profil utilisateur
 * @access  Private/Admin
 */
router.post("/approve/:id", AdminController.approveProfile);

/**
 * @route   POST /api/admin/reject/:id
 * @desc    Rejette un profil utilisateur
 * @access  Private/Admin
 */
router.post("/reject/:id", AdminController.rejectProfile);

/**
 * @route   POST /api/admin/approve-bulk
 * @desc    Approuve plusieurs profils en masse
 * @access  Private/Admin
 */
router.post("/approve-bulk", AdminController.approveBulk);

/**
 * @route   GET /api/admin/stats
 * @desc    Récupère les statistiques administrateur
 * @access  Private/Admin
 */
router.get("/stats", AdminController.getAdminStats);

/**
 * @route   GET /api/admin/search
 * @desc    Recherche des utilisateurs par critères
 * @access  Private/Admin
 */
router.get("/search", AdminController.searchUsers);

module.exports = router;
