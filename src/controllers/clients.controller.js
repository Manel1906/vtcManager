
const db = require("../database");

// =========================
// GET TOUS LES CLIENTS
// =========================

const getAll = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        nom,
        telephone,
        email,
        adresse,
        created_at
      FROM clients
      ORDER BY nom ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erreur getAll clients :", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des clients"
    });
  }
};

// =========================
// GET CLIENT PAR ID
// =========================

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        id,
        nom,
        telephone,
        email,
        adresse,
        created_at
      FROM clients
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Client introuvable"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur getById client :", error);
    res.status(500).json({
      error: "Erreur lors de la récupération du client"
    });
  }
};

// =========================
// CREER CLIENT
// =========================

const create = async (req, res) => {
  try {
    const {
      nom,
      telephone,
      email,
      adresse
    } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({
        error: "Le nom du client est obligatoire"
      });
    }

    const result = await db.query(`
      INSERT INTO clients (
        nom,
        telephone,
        email,
        adresse
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        nom,
        telephone,
        email,
        adresse,
        created_at
    `, [
      nom.trim(),
      telephone || null,
      email || null,
      adresse || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erreur create client :", error);
    res.status(500).json({
      error: "Erreur lors de la création du client"
    });
  }
};

// =========================
// MODIFIER CLIENT
// =========================

const update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nom,
      telephone,
      email,
      adresse
    } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({
        error: "Le nom du client est obligatoire"
      });
    }

    const result = await db.query(`
      UPDATE clients
      SET
        nom = $1,
        telephone = $2,
        email = $3,
        adresse = $4
      WHERE id = $5
      RETURNING
        id,
        nom,
        telephone,
        email,
        adresse,
        created_at
    `, [
      nom.trim(),
      telephone || null,
      email || null,
      adresse || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Client introuvable"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur update client :", error);
    res.status(500).json({
      error: "Erreur lors de la modification du client"
    });
  }
};

// =========================
// SUPPRIMER CLIENT
// =========================

const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM clients
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Client introuvable"
      });
    }

    res.json({
      success: true,
      message: "Client supprimé"
    });
  } catch (error) {
    console.error("Erreur delete client :", error);
    res.status(500).json({
      error: "Erreur lors de la suppression du client"
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteClient
};
