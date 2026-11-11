const express = require("express");

const router = express.Router();

const dashboardController =
    require("../controllers/dashboard.controller");

const { requireApiAuth } =
    require("../middleware/auth");

router.get(
    "/",
    requireApiAuth,
    dashboardController.getStats
);

module.exports = router;