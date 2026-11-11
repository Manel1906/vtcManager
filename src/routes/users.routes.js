

const express = require("express");

const router = express.Router();

const usersController =
  require("../controllers/users.controller");

const {
  requireApiAuth,
  requireAdmin
} = require("../middleware/auth");

const upload =
  require("../middleware/upload");

// Liste des utilisateurs
router.get(
  "/",
  requireApiAuth,
  requireAdmin,
  usersController.getAll
);

// Utilisateur
router.get(
  "/:id",
  requireApiAuth,
  usersController.getById
);

// Création d'un utilisateur
router.post(
  "/",
  requireApiAuth,
  requireAdmin,
  upload.single("photo"),
  usersController.create
);

// Modification
router.put(
  "/:id",
  requireApiAuth,
  requireAdmin,
  usersController.update
);

// Suppression
router.delete(
  "/:id",
  requireApiAuth,
  requireAdmin,
  usersController.delete
);

// Mot de passe
router.put(
  "/:id/password",
  requireApiAuth,
  usersController.changePassword
);

// Photo
router.post(
  "/:id/photo",
  requireApiAuth,
  upload.single("photo"),
  usersController.uploadPhoto
);

// Suppression photo
router.delete(
  "/:id/photo",
  requireApiAuth,
  usersController.deletePhoto
);

module.exports = router;