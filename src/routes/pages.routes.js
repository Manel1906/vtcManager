const express = require("express");

const router = express.Router();

const pagesController =
  require("../controllers/pages.controller");

const {
  requireAuth
} = require("../middleware/auth");

// Accueil
router.get(
  "/",
  requireAuth,
  pagesController.index
);

// Connexion
router.get(
  "/login",
  pagesController.login
);

// Dashboard
router.get(
  "/dashboard",
  requireAuth,
  pagesController.dashboard
);

// Réservations
router.get(
  "/reservations",
  requireAuth,
  pagesController.reservations
);

// Comptes
router.get(
  "/comptes",
  requireAuth,
  pagesController.comptes
);

module.exports = router;