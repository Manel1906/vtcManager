
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const db = require("../database");
const { sanitizeUser } = require("../utils/users");

// ============================================================
// LOGIN : CONNEXION PAR EMAIL OU NOM
// ============================================================

exports.login = async (req, res) => {
    try {
        const body = req.body || {};

        const identifiant = String(
            body.login ?? body.email ?? ""
        ).trim();

        const password = body.password;

        if (!identifiant || !password) {
            return res.status(400).json({
                success: false,
                message: "Login ou adresse email et mot de passe obligatoires",
                data: null
            });
        }

        // Recherche par email ou nom
        const user = await User.getByLogin(identifiant);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Login/email ou mot de passe incorrect",
                data: null
            });
        }

        // Vérifier si le compte est actif
        if (!user.actif) {
            return res.status(403).json({
                success: false,
                message: "Ce compte est désactivé",
                data: null
            });
        }

        // Vérifier le mot de passe
        const passwordCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Login/email ou mot de passe incorrect",
                data: null
            });
        }

        // Créer la session
        const utilisateur = sanitizeUser(user);

        req.session.user = utilisateur;

        req.session.save((error) => {
            if (error) {
                console.error("Erreur sauvegarde session :", error);

                return res.status(500).json({
                    success: false,
                    message: "Impossible de sauvegarder la session",
                    data: null
                });
            }

            console.log(
                "Connexion réussie :",
                utilisateur.email
            );

            return res.json({
                success: true,
                message: "Connexion réussie",
                data: utilisateur
            });
        });

    } catch (error) {
        console.error("Erreur login :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            data: null
        });
    }
};

// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

exports.me = (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Utilisateur non authentifié",
            data: null
        });
    }

    return res.json({
        success: true,
        data: req.session.user
    });
};

// ============================================================
// LOGOUT
// ============================================================

exports.logout = (req, res) => {
    if (!req.session) {
        return res.json({
            success: true,
            message: "Déconnexion réussie",
            data: null
        });
    }

    req.session.destroy((error) => {
        if (error) {
            console.error("Erreur logout :", error);

            return res.status(500).json({
                success: false,
                message: "Erreur lors de la déconnexion",
                data: null
            });
        }

        res.clearCookie("connect.sid");

        return res.json({
            success: true,
            message: "Déconnexion réussie",
            data: null
        });
    });
};

// ============================================================
// PREMIÈRE CONFIGURATION : CRÉATION DU PREMIER ADMIN
// ============================================================

exports.setup = async (req, res) => {
    try {
        // Vérifier si un utilisateur existe déjà
        const nombreUsers = await db.query(`
            SELECT COUNT(*) AS total
            FROM users
        `);

        if (Number(nombreUsers.rows[0].total) > 0) {
            return res.status(403).json({
                success: false,
                message: "Le compte administrateur existe déjà",
                data: null
            });
        }

        const { nom, email, password } = req.body || {};

        if (
            typeof nom !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !nom.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Nom, email et mot de passe obligatoires",
                data: null
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Le mot de passe doit contenir au moins 6 caractères",
                data: null
            });
        }

        const emailNormalise = email.trim().toLowerCase();

        // Vérifier si l'email existe déjà
        const existingUser = await User.getByEmail(emailNormalise);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Cette adresse email existe déjà",
                data: null
            });
        }

        // Hacher le mot de passe
        const passwordHash = await bcrypt.hash(password, 12);

        let photo = null;

        if (req.file) {
            photo = `/uploads/profiles/${req.file.filename}`;
        }

        // Créer le premier administrateur
        const user = await User.create({
            nom: nom.trim(),
            email: emailNormalise,
            passwordHash,
            role: "admin",
            actif: 1,
            photo
        });

        const utilisateur = sanitizeUser(user);

        console.log(
            "Compte administrateur créé :",
            utilisateur.email
        );

        return res.status(201).json({
            success: true,
            message: "Compte administrateur créé",
            data: utilisateur
        });

    } catch (error) {
        console.error("Erreur setup :", error);

        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            data: null
        });
    }
};
