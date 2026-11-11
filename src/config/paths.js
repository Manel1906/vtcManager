const path = require("path");

const SRC_DIR = path.join(__dirname, "..");

const DATA_DIR = path.join(
  SRC_DIR,
  "data"
);

const PUBLIC_DIR = path.join(
  SRC_DIR,
  "public"
);

const VIEWS_DIR = path.join(
  SRC_DIR,
  "views"
);

const UPLOADS_DIR = path.join(
  PUBLIC_DIR,
  "uploads"
);

const PROFILE_UPLOADS_DIR = path.join(
  UPLOADS_DIR,
  "profiles"
);

module.exports = {
  SRC_DIR,
  DATA_DIR,
  PUBLIC_DIR,
  VIEWS_DIR,
  UPLOADS_DIR,
  PROFILE_UPLOADS_DIR
};