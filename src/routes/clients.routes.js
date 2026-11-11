const express = require("express");

const router = express.Router();

const clientsController = require("../controllers/clients.controller");

const {
  requireApiAuth
} = require("../middleware/auth");

router.get(
  "/",
  requireApiAuth,
  clientsController.getAll
);

router.get(
  "/:id",
  requireApiAuth,
  clientsController.getById
);

router.post(
  "/",
  requireApiAuth,
  clientsController.create
);

router.put(
  "/:id",
  requireApiAuth,
  clientsController.update
);

router.delete(
  "/:id",
  requireApiAuth,
  clientsController.delete
);

module.exports = router;