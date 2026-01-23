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
const { validateId, validateRejectProfile } = require("../middleware/validation");

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
router.get("/profile/:id", validateId, AdminController.getProfileDetails);

/**
 * @route   POST /api/admin/approve/:id
 * @desc    Approuve un profil utilisateur
 * @access  Private/Admin
 */
router.post("/approve/:id", validateId, AdminController.approveProfile);

/**
 * @route   POST /api/admin/reject/:id
 * @desc    Rejette un profil utilisateur
 * @access  Private/Admin
 */
router.post("/reject/:id", validateRejectProfile, AdminController.rejectProfile);

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

/**
 * @route   GET /api/admin/incomplete-profiles
 * @desc    Récupère tous les profils incomplets
 * @access  Private/Admin
 */
router.get("/incomplete-profiles", AdminController.getIncompleteProfiles);

/**
 * @route   POST /api/admin/fix-profile/:id
 * @desc    Corrige un profil incomplet
 * @access  Private/Admin
 */
router.post("/fix-profile/:id", validateId, AdminController.fixProfile);

/**
 * @route   DELETE /api/admin/delete-profile/:id
 * @desc    Supprime un profil
 * @access  Private/Admin
 */
router.delete("/delete-profile/:id", validateId, AdminController.deleteProfile);

/**
 * @route   POST /api/admin/fix-all-profiles
 * @desc    Corrige tous les profils incomplets
 * @access  Private/Admin
 */
router.post("/fix-all-profiles", AdminController.fixAllProfiles);

/**
 * @route   POST /api/admin/delete-profiles
 * @desc    Supprime plusieurs profils
 * @access  Private/Admin
 */
router.post("/delete-profiles", AdminController.deleteProfiles);

module.exports = router;
