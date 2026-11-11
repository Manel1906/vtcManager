
const path = require("path");
const fs = require("fs");

const Reservation = require("../models/Reservation");
const reservationService = require("../services/reservation.service");
const PDFService = require("../services/pdf.service");
const Client = require("../models/Client");
const Entreprise = require("../models/Entreprise");

// =========================
// VÉRIFIER L'UTILISATEUR
// =========================

function getUserId(req, res) {
  const userId = Number(req.session?.user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({
      success: false,
      message: "Session invalide. Veuillez vous reconnecter."
    });

    return null;
  }

  return userId;
}

// =========================
// GET TOUTES LES RÉSERVATIONS
// =========================

exports.getAll = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (userId === null) return;

    const reservations = await Reservation.findAll(userId);

    return res.json({
      success: true,
      reservations
    });

  } catch (error) {
    console.error("Erreur récupération réservations :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les réservations."
    });
  }
};

// =========================
// GET UNE RÉSERVATION
// =========================

exports.getById = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (userId === null) return;

    const reservation = await Reservation.findById(
      req.params.id,
      userId
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable."
      });
    }

    return res.json({
      success: true,
      reservation
    });

  } catch (error) {
    console.error("Erreur récupération réservation :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur."
    });
  }
};

// =========================
// CRÉER UNE RÉSERVATION
// =========================

exports.create = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (userId === null) return;

    // L'identifiant vient de la session, jamais du formulaire.
    const reservation = await reservationService.create(
      req.body,
      userId
    );

    return res.status(201).json({
      success: true,
      reservationId: reservation.id,
      id: reservation.id,
      reservation
    });

  } catch (error) {
    console.error("Erreur création réservation :", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Impossible de créer la réservation."
    });
  }
};

// =========================
// MODIFIER UNE RÉSERVATION
// =========================

exports.update = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (userId === null) return;

    const id = req.params.id;

    // Vérification de propriété avant toute modification.
    const existingReservation = await Reservation.findById(
      id,
      userId
    );

    if (!existingReservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable."
      });
    }

    if (typeof reservationService.update !== "function") {
      return res.status(501).json({
        success: false,
        message: "La modification des réservations n'est pas disponible."
      });
    }

    const reservation = await reservationService.update(
      id,
      req.body,
      userId
    );

    return res.json({
      success: true,
      reservation
    });

  } catch (error) {
    console.error("Erreur modification réservation :", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Impossible de modifier la réservation."
    });
  }
};

// =========================
// SUPPRIMER UNE RÉSERVATION
// =========================

exports.delete = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (userId === null) return;

    // Suppression uniquement si l'id et le user_id correspondent.
    const result = await Reservation.delete(
      req.params.id,
      userId
    );

    // PostgreSQL utilise rowCount.
    if (
      !result ||
      result === false ||
      result.rowCount === 0 ||
      result.changes === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable."
      });
    }

    return res.json({
      success: true
    });

  } catch (error) {
    console.error("Erreur suppression réservation :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de supprimer la réservation."
    });
  }
};

// =========================
// GÉNÉRER ET AFFICHER LE PDF
// =========================



exports.pdf = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (userId === null) return;

    // Récupérer la réservation
    const reservation = await Reservation.findById(
      req.params.id,
      userId
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation introuvable."
      });
    }

   
// Récupérer le client associé
let client = null;

console.log("RÉSERVATION POUR PDF :", {
  id: reservation.id,
  client_id: reservation.client_id,
  client_nom: reservation.client_nom,
  client_telephone: reservation.client_telephone,
  client_email: reservation.client_email,
  client_adresse: reservation.client_adresse
});

if (reservation.client_id) {
  client = await Client.findById(
    Number(reservation.client_id),
    userId
  );
}

// Si le client n'a pas été trouvé, utiliser les données du JOIN
if (!client) {
  client = {
    nom: reservation.client_nom || "",
    telephone: reservation.client_telephone || "",
    email: reservation.client_email || "",
    adresse: reservation.client_adresse || ""
  };
}

console.log("CLIENT FINAL POUR PDF :", client);

    // Récupérer l'entreprise du compte connecté
    const entreprise = await Entreprise.get(userId) || {};

    // Prendre la première valeur non vide
    const valeurDisponible = (...valeurs) =>
      valeurs.find(
        valeur =>
          valeur !== null &&
          valeur !== undefined &&
          String(valeur).trim() !== ""
      ) ?? "";

    const entreprisePDF = {
      nom: valeurDisponible(
        reservation.entreprise_nom,
        entreprise.nom
      ),
      siret: valeurDisponible(
        reservation.entreprise_siret,
        entreprise.siret
      ),
      revtc: valeurDisponible(
        reservation.entreprise_revtc,
        entreprise.revtc
      ),
      telephone: valeurDisponible(
        reservation.entreprise_telephone,
        entreprise.telephone
      ),
      email: valeurDisponible(
        reservation.entreprise_email,
        entreprise.email
      ),
      adresse: valeurDisponible(
        reservation.entreprise_adresse,
        entreprise.adresse
      ),
      chauffeur: valeurDisponible(
        reservation.entreprise_chauffeur,
        entreprise.chauffeur
      )
    };

    // Vérification temporaire des données
    console.log("CLIENT POUR PDF :", client);
    console.log("ENTREPRISE POUR PDF :", entreprisePDF);

    // Générer le PDF
    const pdfPath = await PDFService.genererPDF(
      reservation,
      client,
      entreprisePDF
    );

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      throw new Error("Le fichier PDF n'a pas été créé.");
    }

    const filename = path.basename(pdfPath);

    return res.sendFile(path.resolve(pdfPath), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error("Erreur génération PDF :", error);

    if (res.headersSent) return;

    return res.status(500).json({
      success: false,
      message: error.message || "Impossible de générer le PDF."
    });
  }
};


