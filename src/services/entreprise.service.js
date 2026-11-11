

const Entreprise = require("../models/Entreprise");

class EntrepriseService {
    static get(userId) {
        return Entreprise.get(Number(userId));
    }

    static save(data = {}, userId) {
        return Entreprise.save({
            nom: data.nom || "",
            siret: data.siret || "",
            revtc: data.revtc || "",
            telephone: data.telephone || "",
            email: data.email || "",
            adresse: data.adresse || "",
            chauffeur: data.chauffeur || ""
        }, Number(userId));
    }
}

module.exports = EntrepriseService;
