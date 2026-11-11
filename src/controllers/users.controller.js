
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { sanitizeUser } = require("../utils/users");

exports.getAll = async (req, res) => {
  try {
    const users = await User.getAll();

    return res.json({
      success: true,
      users: users.map(sanitizeUser)
    });
  } catch (error) {
    console.error("Erreur utilisateurs :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.getById(Number(req.params.id));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Erreur utilisateur :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      nom,
      email,
      password,
      role = "user",
      actif = 1
    } = req.body || {};

    if (!nom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nom, email et mot de passe obligatoires"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères"
      });
    }

    const emailNormalise = email.trim().toLowerCase();

    const existingUser = await User.getByEmail(emailNormalise);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cette adresse email existe déjà"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const photo = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    const user = await User.create({
      nom: nom.trim(),
      email: emailNormalise,
      passwordHash,
      role: role === "admin" ? "admin" : "user",
      actif: actif ? 1 : 0,
      photo
    });

    return res.status(201).json({
      success: true,
      message: "Utilisateur créé",
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Erreur création utilisateur :", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Cette adresse email existe déjà"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant utilisateur invalide"
      });
    }

    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    const { nom, email, role, actif } = req.body || {};

    if (!nom || !email) {
      return res.status(400).json({
        success: false,
        message: "Nom et email obligatoires"
      });
    }

    const emailNormalise = email.trim().toLowerCase();

    const existingUser = await User.getByEmail(emailNormalise);

    if (existingUser && Number(existingUser.id) !== id) {
      return res.status(409).json({
        success: false,
        message: "Cette adresse email est déjà utilisée"
      });
    }

    const updatedUser = await User.update(id, {
      nom: nom.trim(),
      email: emailNormalise,
      role: role === "admin" ? "admin" : "user",
      actif: actif ? 1 : 0
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    if (
      req.session.user &&
      Number(req.session.user.id) === id
    ) {
      req.session.user = sanitizeUser(updatedUser);
    }

    return res.json({
      success: true,
      message: "Utilisateur modifié",
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error("Erreur modification utilisateur :", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Cette adresse email est déjà utilisée"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant utilisateur invalide"
      });
    }

    if (
      req.session.user &&
      Number(req.session.user.id) === id
    ) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte"
      });
    }

    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    await User.delete(id);

    return res.json({
      success: true,
      message: "Utilisateur supprimé"
    });
  } catch (error) {
    console.error("Erreur suppression utilisateur :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant utilisateur invalide"
      });
    }

    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    const { password, newPassword } = req.body || {};
    const finalPassword = newPassword || password;

    if (!finalPassword) {
      return res.status(400).json({
        success: false,
        message: "Nouveau mot de passe obligatoire"
      });
    }

    if (finalPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères"
      });
    }

    const passwordHash = await bcrypt.hash(finalPassword, 12);

    await User.updatePassword(id, passwordHash);

    return res.json({
      success: true,
      message: "Mot de passe modifié"
    });
  } catch (error) {
    console.error("Erreur mot de passe :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucune photo reçue"
      });
    }

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant utilisateur invalide"
      });
    }

    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    const photo = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await User.updatePhoto(id, photo);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Impossible de mettre à jour la photo"
      });
    }

    if (
      req.session.user &&
      Number(req.session.user.id) === id
    ) {
      req.session.user = sanitizeUser(updatedUser);
    }

    return res.json({
      success: true,
      message: "Photo mise à jour",
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error("Erreur photo :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant utilisateur invalide"
      });
    }

    const user = await User.getById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    const updatedUser = await User.updatePhoto(id, null);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Impossible de supprimer la photo"
      });
    }

    if (
      req.session.user &&
      Number(req.session.user.id) === id
    ) {
      req.session.user = sanitizeUser(updatedUser);
    }

    return res.json({
      success: true,
      message: "Photo supprimée",
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error("Erreur suppression photo :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};
