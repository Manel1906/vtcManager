const express = require("express");

const router = express.Router();

const entrepriseController = require("../controllers/entreprise.controller");

const {
  requireApiAuth
} = require("../middleware/auth");

router.get(
  "/",
  requireApiAuth,
  entrepriseController.get
);

router.put(
  "/",
  requireApiAuth,
  entrepriseController.update
);

module.exports = router;