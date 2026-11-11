
const EntrepriseService = require("../services/entreprise.service");

// ==========================================
// IDENTIFICATION DE L'UTILISATEUR
// ==========================================

function getUserId(req) {
  const userId = Number(req.session?.user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error("Authentification requise.");
    error.status = 401;
    throw error;
  }

  return userId;
}

// ==========================================
// RÉCUPÉRER LES INFORMATIONS DE L'ENTREPRISE
// ==========================================

exports.get = async (req, res) => {
  try {
    const userId = getUserId(req);

    const entreprise = await EntrepriseService.get(userId);

    return res.json({
      success: true,
      entreprise: entreprise || null
    });

  } catch (error) {
    console.error("Erreur GET entreprise :", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status === 401
        ? "Authentification requise."
        : "Impossible de récupérer les informations de l'entreprise."
    });
  }
};

// ==========================================
// MODIFIER LES INFORMATIONS DE L'ENTREPRISE
// ==========================================

exports.update = async (req, res) => {
  try {
    const userId = getUserId(req);

    console.log("=== DEBUG ENTREPRISE ===");
    console.log("Session user :", req.session?.user);
    console.log("User ID :", userId);
    console.log("Body reçu :", req.body);

    const entreprise = await EntrepriseService.save(
      req.body || {},
      userId
    );

    console.log("Entreprise sauvegardée :", entreprise);

    return res.json({
      success: true,
      entreprise
    });

  } catch (error) {
    console.error("=== ERREUR RÉELLE ENTREPRISE ===");
    console.error(error.stack || error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status === 401
        ? "Authentification requise."
        : error.message || "Erreur inconnue lors de la sauvegarde."
    });
  }
};
