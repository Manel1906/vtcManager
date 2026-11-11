const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  PROFILE_UPLOADS_DIR
} = require("../config/paths");

if (!fs.existsSync(PROFILE_UPLOADS_DIR)) {
  fs.mkdirSync(PROFILE_UPLOADS_DIR, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, PROFILE_UPLOADS_DIR);
  },

  filename(req, file, cb) {
    const extension = path.extname(
      file.originalname
    ).toLowerCase();

    const filename =
      `user-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(
      new Error("Format d'image non autorisé")
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;