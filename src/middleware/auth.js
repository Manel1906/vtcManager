function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  return res.redirect("/login");
}

function requireApiAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Authentification requise"
  });
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise"
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Accès réservé à l'administrateur"
    });
  }

  next();
}

module.exports = {
  requireAuth,
  requireApiAuth,
  requireAdmin
};