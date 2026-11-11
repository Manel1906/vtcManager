const express = require("express");

const router = express.Router();

const reservationsController =
  require("../controllers/reservations.controller");

const {
  requireApiAuth
} = require("../middleware/auth");

router.get(
  "/",
  requireApiAuth,
  reservationsController.getAll
);

router.get(
  "/:id/pdf",
  requireApiAuth,
  reservationsController.pdf
);

router.get(
  "/:id",
  requireApiAuth,
  reservationsController.getById
);

router.post(
  "/",
  requireApiAuth,
  reservationsController.create
);

router.put(
  "/:id",
  requireApiAuth,
  reservationsController.update
);

router.delete(
  "/:id",
  requireApiAuth,
  reservationsController.delete
);

module.exports = router;