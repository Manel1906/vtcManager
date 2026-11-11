
const db = require("../database");

const User = {
    // RÉCUPÉRER TOUS LES UTILISATEURS
    async getAll() {
        const result = await db.query(`
            SELECT
                id, nom, email, role, actif,
                photo, created_at, updated_at
            FROM users
            ORDER BY nom ASC
        `);

        return result.rows;
    },

    // RÉCUPÉRER UN UTILISATEUR PAR ID
    async getById(id) {
        const result = await db.query(`
            SELECT
                id, nom, email, role, actif,
                photo, created_at, updated_at
            FROM users
            WHERE id = $1
        `, [id]);

        return result.rows[0] || null;
    },

    // RECHERCHER PAR EMAIL
    async getByEmail(email) {
        if (!email) return null;

        const result = await db.query(`
            SELECT *
            FROM users
            WHERE LOWER(email) = LOWER($1)
            LIMIT 1
        `, [String(email).trim()]);

        return result.rows[0] || null;
    },

    // RECHERCHER PAR LOGIN OU EMAIL
    async getByLogin(login) {
        const identifiant = String(login || "").trim();

        if (!identifiant) return null;

        const userByEmail = await this.getByEmail(identifiant);

        if (userByEmail) return userByEmail;

        const result = await db.query(`
            SELECT *
            FROM users
            WHERE LOWER(nom) = LOWER($1)
            LIMIT 2
        `, [identifiant]);

        if (result.rows.length !== 1) return null;

        return result.rows[0];
    },

    // CRÉER UN UTILISATEUR
    async create({
        nom,
        email,
        passwordHash,
        role = "user",
        actif = 1,
        photo = null
    }) {
        const result = await db.query(`
            INSERT INTO users (
                nom, email, password_hash,
                role, actif, photo
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            nom,
            String(email).trim().toLowerCase(),
            passwordHash,
            role,
            actif,
            photo
        ]);

        return this.getById(result.rows[0].id);
    },

    // MODIFIER UN UTILISATEUR
    async update(id, { nom, email, role, actif }) {
        await db.query(`
            UPDATE users
            SET
                nom = $1,
                email = $2,
                role = $3,
                actif = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [
            nom,
            String(email).trim().toLowerCase(),
            role,
            actif,
            id
        ]);

        return this.getById(id);
    },

    // MODIFIER LE MOT DE PASSE
    async updatePassword(id, passwordHash) {
        await db.query(`
            UPDATE users
            SET
                password_hash = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [passwordHash, id]);

        return this.getById(id);
    },

    // MODIFIER LA PHOTO
    async updatePhoto(id, photo) {
        await db.query(`
            UPDATE users
            SET
                photo = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [photo, id]);

        return this.getById(id);
    },

    // SUPPRIMER UN UTILISATEUR
    async delete(id) {
        return db.query(`
            DELETE FROM users
            WHERE id = $1
        `, [id]);
    }
};

module.exports = User;
