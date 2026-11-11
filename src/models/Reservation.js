
const db = require("../database");

class Reservation {

    // RÉCUPÉRER TOUTES LES RÉSERVATIONS D'UN UTILISATEUR
    static async findAll(userId) {
        const result = await db.query(`
            SELECT
                r.*,
                c.nom AS client_nom,
                c.telephone AS client_telephone,
                c.email AS client_email,
                c.adresse AS client_adresse
            FROM reservations r
            LEFT JOIN clients c
                ON c.id = r.client_id
                AND c.user_id = r.user_id
            WHERE r.user_id = $1
            ORDER BY
                r.date_prise_en_charge DESC,
                r.heure_prise_en_charge DESC
        `, [userId]);

        return result.rows;
    }

    // RÉCUPÉRER UNE RÉSERVATION
    static async findById(id, userId) {
        const result = await db.query(`
            SELECT
                r.*,
                c.nom AS client_nom,
                c.telephone AS client_telephone,
                c.email AS client_email,
                c.adresse AS client_adresse
            FROM reservations r
            LEFT JOIN clients c
                ON c.id = r.client_id
                AND c.user_id = r.user_id
            WHERE r.id = $1
              AND r.user_id = $2
        `, [id, userId]);

        return result.rows[0] || null;
    }

    // CRÉER UNE RÉSERVATION
    static async create(data) {
        if (!data.user_id) {
            throw new Error(
                "L'identifiant de l'utilisateur est obligatoire."
            );
        }

        const result = await db.query(`
            INSERT INTO reservations (
                user_id,
                client_id,
                date_reservation,
                heure_reservation,
                date_prise_en_charge,
                heure_prise_en_charge,
                depart,
                destination,
                passager,
                tarif_km,
                distance_km,
                prix_ttc,
                mode_reglement,
                entreprise_nom,
                entreprise_siret,
                entreprise_revtc,
                entreprise_telephone,
                entreprise_email,
                entreprise_adresse,
                entreprise_chauffeur
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            RETURNING id
        `, [
            data.user_id,
            data.client_id ?? null,
            data.date_reservation ?? "",
            data.heure_reservation ?? "",
            data.date_prise_en_charge ?? "",
            data.heure_prise_en_charge ?? "",
            data.depart ?? "",
            data.destination ?? "",
            data.passager ?? "",
            Number(data.tarif_km) || 0,
            Number(data.distance_km) || 0,
            Number(data.prix_ttc) || 0,
            data.mode_reglement ?? "",
            data.entreprise_nom ?? "",
            data.entreprise_siret ?? "",
            data.entreprise_revtc ?? "",
            data.entreprise_telephone ?? "",
            data.entreprise_email ?? "",
            data.entreprise_adresse ?? "",
            data.entreprise_chauffeur ?? ""
        ]);

        return this.findById(
            result.rows[0].id,
            data.user_id
        );
    }

    // MODIFIER UNE RÉSERVATION
    static async update(id, data, userId) {
        const result = await db.query(`
            UPDATE reservations
            SET
                client_id = $1,
                date_reservation = $2,
                heure_reservation = $3,
                date_prise_en_charge = $4,
                heure_prise_en_charge = $5,
                depart = $6,
                destination = $7,
                passager = $8,
                tarif_km = $9,
                distance_km = $10,
                prix_ttc = $11,
                mode_reglement = $12
            WHERE id = $13
              AND user_id = $14
            RETURNING id
        `, [
            data.client_id ?? null,
            data.date_reservation ?? "",
            data.heure_reservation ?? "",
            data.date_prise_en_charge ?? "",
            data.heure_prise_en_charge ?? "",
            data.depart ?? "",
            data.destination ?? "",
            data.passager ?? "",
            Number(data.tarif_km) || 0,
            Number(data.distance_km) || 0,
            Number(data.prix_ttc) || 0,
            data.mode_reglement ?? "",
            id,
            userId
        ]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.findById(id, userId);
    }

    // SUPPRIMER UNE RÉSERVATION
    static async delete(id, userId) {
        return db.query(`
            DELETE FROM reservations
            WHERE id = $1
              AND user_id = $2
        `, [id, userId]);
    }

    // METTRE À JOUR LE CHEMIN DU PDF
    static async updatePdf(id, pdf, userId) {
        return db.query(`
            UPDATE reservations
            SET pdf = $1
            WHERE id = $2
              AND user_id = $3
        `, [pdf, id, userId]);
    }
}

module.exports = Reservation;
