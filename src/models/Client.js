
const db = require("../database");

class Client {

    // RÉCUPÉRER TOUS LES CLIENTS
    static async findAll(userId) {
        const result = await db.query(`
            SELECT *
            FROM clients
            WHERE user_id = $1
            ORDER BY nom ASC
        `, [userId]);

        return result.rows;
    }

    // RÉCUPÉRER UN CLIENT PAR ID
    static async findById(id, userId) {
        const result = await db.query(`
            SELECT *
            FROM clients
            WHERE id = $1
              AND user_id = $2
        `, [id, userId]);

        return result.rows[0] || null;
    }

    // RECHERCHER UN CLIENT PAR EMAIL
    static async findByEmail(email, userId) {
        if (!email) {
            return null;
        }

        const result = await db.query(`
            SELECT *
            FROM clients
            WHERE email = $1
              AND user_id = $2
            LIMIT 1
        `, [email, userId]);

        return result.rows[0] || null;
    }

    // CRÉER UN CLIENT
    static async create(data) {
        const userId = Number(data.user_id);

        if (!Number.isInteger(userId) || userId <= 0) {
            throw new Error(
                "Identifiant utilisateur obligatoire pour créer un client."
            );
        }

        const result = await db.query(`
            INSERT INTO clients (
                user_id,
                nom,
                telephone,
                email,
                adresse
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [
            userId,
            data.nom || "",
            data.telephone || "",
            data.email || "",
            data.adresse || ""
        ]);

        return this.findById(result.rows[0].id, userId);
    }

    // MODIFIER UN CLIENT
    static async update(id, data, userId) {
        const ownerId = Number(userId);

        if (!Number.isInteger(ownerId) || ownerId <= 0) {
            throw new Error("Identifiant utilisateur invalide.");
        }

        const result = await db.query(`
            UPDATE clients
            SET
                nom = $1,
                telephone = $2,
                email = $3,
                adresse = $4
            WHERE id = $5
              AND user_id = $6
            RETURNING id
        `, [
            data.nom || "",
            data.telephone || "",
            data.email || "",
            data.adresse || "",
            id,
            ownerId
        ]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.findById(id, ownerId);
    }
}

module.exports = Client;
