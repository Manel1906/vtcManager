
const db = require("../database");

const Entreprise = {

    // RÉCUPÉRER L'ENTREPRISE D'UN UTILISATEUR
    async get(userId) {
        if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
            throw new Error("Identifiant utilisateur invalide.");
        }

        const result = await db.query(`
            SELECT *
            FROM entreprise
            WHERE user_id = $1
            LIMIT 1
        `, [Number(userId)]);

        return result.rows[0] || null;
    },

    // ENREGISTRER OU MODIFIER L'ENTREPRISE
    async save(data, userId) {
        if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
            throw new Error("Identifiant utilisateur invalide.");
        }

        const id = Number(userId);

        const valeurs = [
            data.nom || "",
            data.siret || "",
            data.revtc || "",
            data.telephone || "",
            data.email || "",
            data.adresse || "",
            data.chauffeur || ""
        ];

        const result = await db.query(`
            INSERT INTO entreprise (
                user_id,
                nom,
                siret,
                revtc,
                telephone,
                email,
                adresse,
                chauffeur
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id)
            DO UPDATE SET
                nom = EXCLUDED.nom,
                siret = EXCLUDED.siret,
                revtc = EXCLUDED.revtc,
                telephone = EXCLUDED.telephone,
                email = EXCLUDED.email,
                adresse = EXCLUDED.adresse,
                chauffeur = EXCLUDED.chauffeur
            RETURNING *
        `, [id, ...valeurs]);

        return result.rows[0] || null;
    }
};

module.exports = Entreprise;
