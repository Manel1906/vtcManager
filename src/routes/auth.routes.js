const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");
const upload = require("../middleware/upload");

router.post("/login", authController.login);

router.get("/me", authController.me);

router.post("/logout", authController.logout);

router.post(
  "/setup",
  upload.single("photo"),
  authController.setup
);

module.exports = router;