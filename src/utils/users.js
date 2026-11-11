
function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role,
    actif: user.actif,
    photo: user.photo || null,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

module.exports = {
  sanitizeUser
};