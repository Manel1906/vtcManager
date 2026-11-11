
const Reservation = require("../models/Reservation");
const Client = require("../models/Client");
const Entreprise = require("../models/Entreprise");

function value(val) {
    return val === undefined || val === null ? "" : val;
}

// Vérifie l'identifiant de l'utilisateur.
function validateUserId(userId) {
    const id = Number(userId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Identifiant utilisateur invalide.");
    }

    return id;
}

// Recherche ou crée un client.
async function getOrCreateClient(clientData, userId) {
    let client = null;

    if (clientData.email) {
        client = await Client.findByEmail(
            clientData.email,
            userId
        );
    }

    if (client) {
        return await Client.update(
            client.id,
            clientData,
            userId
        );
    }

    return await Client.create({
        ...clientData,
        user_id: userId
    });
}

// ==================================================
// CRÉATION D'UNE RÉSERVATION
// ==================================================

async function create(data = {}, userId) {
    userId = validateUserId(userId);

    // Récupérer l'entreprise.
    const entreprise = await Entreprise.get(userId);

    if (!entreprise) {
        throw new Error(
            "Les informations de votre entreprise ne sont pas renseignées."
        );
    }

    // Récupérer ou créer le client.
    const client = await getOrCreateClient({
        nom: value(data.client?.nom),
        telephone: value(data.client?.telephone),
        email: value(data.client?.email),
        adresse: value(data.client?.adresse)
    }, userId);

    if (!client || !client.id) {
        throw new Error(
            "Impossible de récupérer ou créer le client."
        );
    }

    console.log("CLIENT ASSOCIÉ À LA RÉSERVATION :", client);

    // Créer la réservation avec le bon client_id.
    return await Reservation.create({
        user_id: userId,
        client_id: client.id,

        date_reservation: value(data.dateReservation),
        heure_reservation: value(data.heureReservation),

        date_prise_en_charge: value(data.datePrise),
        heure_prise_en_charge: value(data.heurePrise),

        depart: value(data.depart),
        destination: value(data.destination),
        passager: value(data.passager),

        tarif_km: Number(data.tarifKm) || 0,
        distance_km: Number(data.distanceKm) || 0,
        prix_ttc: Number(data.prix) || 0,

        mode_reglement: value(data.paiement),

        // Informations de l'entreprise.
        entreprise_nom: entreprise.nom || "",
        entreprise_siret: entreprise.siret || "",
        entreprise_revtc: entreprise.revtc || "",
        entreprise_telephone: entreprise.telephone || "",
        entreprise_email: entreprise.email || "",
        entreprise_adresse: entreprise.adresse || "",
        entreprise_chauffeur: entreprise.chauffeur || ""
    });
}

// ==================================================
// MODIFICATION D'UNE RÉSERVATION
// ==================================================

async function update(id, data = {}, userId) {
    userId = validateUserId(userId);

    // Récupérer la réservation existante.
    const existingReservation = await Reservation.findById(
        id,
        userId
    );

    if (!existingReservation) {
        throw new Error("Réservation introuvable.");
    }

    let clientId = existingReservation.client_id;

    const clientData = {
        nom: value(data.client?.nom),
        telephone: value(data.client?.telephone),
        email: value(data.client?.email),
        adresse: value(data.client?.adresse)
    };

    if (clientId) {
        const clientExistant = await Client.findById(
            clientId,
            userId
        );

        if (!clientExistant) {
            throw new Error("Client introuvable.");
        }

        const clientModifie = await Client.update(
            clientId,
            clientData,
            userId
        );

        if (!clientModifie) {
            throw new Error("Impossible de modifier le client.");
        }

    } else {
        const client = await getOrCreateClient(
            clientData,
            userId
        );

        if (!client || !client.id) {
            throw new Error("Impossible de récupérer le client.");
        }

        clientId = client.id;
    }

    return await Reservation.update(id, {
        client_id: clientId,

        date_reservation: value(data.dateReservation),
        heure_reservation: value(data.heureReservation),

        date_prise_en_charge: value(data.datePrise),
        heure_prise_en_charge: value(data.heurePrise),

        depart: value(data.depart),
        destination: value(data.destination),
        passager: value(data.passager),

        tarif_km: Number(data.tarifKm) || 0,
        distance_km: Number(data.distanceKm) || 0,
        prix_ttc: Number(data.prix) || 0,

        mode_reglement: value(data.paiement)
    }, userId);
}

module.exports = {
    create,
    update
};
