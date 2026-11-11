const path = require("path");
const { VIEWS_DIR } = require("../config/paths");

function afficherPage(nomFichier) {
  return (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, nomFichier));
  };
}

exports.index = afficherPage("index.html");
exports.login = afficherPage("login.html");
exports.dashboard = afficherPage("dashboard.html");
exports.reservations = afficherPage("reservations.html");
exports.comptes = afficherPage("comptes.html");