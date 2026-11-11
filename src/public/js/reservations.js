/*
==================================================
 APPLICATION RÉSERVATION
==================================================

Fonctions :

- Chargement des informations entreprise
- Initialisation automatique des dates/heures
- Autocomplétion des adresses
- Récupération latitude / longitude
- Calcul distance routière avec OSRM
- Calcul automatique du prix
- Modification du tarif au km
- Enregistrement de la réservation
- Génération du PDF

PAGE LISTE :

- Chargement des réservations
- Affichage sous forme de tableau
- Recherche
- Filtre par date
- Filtre par statut
- Actualisation
- Téléchargement PDF

==================================================
*/


// ==================================================
// ÉLÉMENTS PRINCIPAUX
// ==================================================

const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");
const pdfButton = document.getElementById("pdfButton");


// ==================================================
// ID DE LA DERNIÈRE RÉSERVATION
// ==================================================

let derniereReservationId = null;


// ==================================================
// ÉLÉMENTS TARIFICATION
// ==================================================

const departInput = document.getElementById("depart");
const destinationInput = document.getElementById("destination");
const tarifKmInput = document.getElementById("tarifKm");
const distanceKmInput = document.getElementById("distanceKm");
const prixInput = document.getElementById("prix");
const tarifMessage = document.getElementById("tarifMessage");


// ==================================================
// VARIABLES CALCUL
// ==================================================

let distanceCalculeeKm = null;
let calculRouteEnCours = false;


// ==================================================
// VARIABLES LISTE DES RÉSERVATIONS
// ==================================================

let toutesLesReservations = [];


// ==================================================
// AFFICHER UN MESSAGE
// ==================================================

function afficherMessage(texte, couleur = "black") {
    if (!message) {
        return;
    }

    message.textContent = texte;
    message.style.color = couleur;
}


// ==================================================
// AFFICHER L'ÉTAT DE LA TARIFICATION
// ==================================================

function afficherEtatTarification(texte) {
    if (!tarifMessage) {
        return;
    }

    tarifMessage.textContent = texte;
}


// ==================================================
// CHARGER LES INFORMATIONS DE L'ENTREPRISE
// ==================================================

async function chargerEntreprise() {
    try {
        const response = await fetch("/api/entreprise");

        if (!response.ok) {
            throw new Error(
                "Impossible de charger les informations de l'entreprise."
            );
        }

        const result = await response.json();

        const entreprise = result?.entreprise || result;

        if (!entreprise) {
            return;
        }

        const nom = document.getElementById("entrepriseNom");
        const siret = document.getElementById("entrepriseSiret");
        const revtc = document.getElementById("entrepriseRevtc");
        const adresse = document.getElementById("entrepriseAdresse");

        if (nom) {
            nom.value = entreprise.nom || "";
        }

        if (siret) {
            siret.value = entreprise.siret || "";
        }

        if (revtc) {
            revtc.value = entreprise.revtc || "";
        }

        if (adresse) {
            adresse.value = entreprise.adresse || "";
        }

    } catch (error) {
        console.error(
            "Erreur chargement entreprise :",
            error
        );
    }
}


// ==================================================
// FORMATER UNE DATE LOCALE
// ==================================================

function formaterDateLocale(date) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, "0");
    const jour = String(date.getDate()).padStart(2, "0");

    return `${annee}-${mois}-${jour}`;
}


// ==================================================
// FORMATER UNE HEURE LOCALE
// ==================================================

function formaterHeureLocale(date) {
    const heures = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${heures}:${minutes}`;
}


// ==================================================
// INITIALISER LES DATES ET HEURES
// ==================================================

function initialiserDates() {
    const maintenant = new Date();

    const dateReservation = new Date(maintenant);

    dateReservation.setHours(
        dateReservation.getHours() - 3
    );

    const dateReservationInput =
        document.getElementById("dateReservation");

    const heureReservationInput =
        document.getElementById("heureReservation");

    if (dateReservationInput) {
        dateReservationInput.value =
            formaterDateLocale(dateReservation);
    }

    if (heureReservationInput) {
        heureReservationInput.value =
            formaterHeureLocale(dateReservation);
    }

    const datePriseInput =
        document.getElementById("datePrise");

    const heurePriseInput =
        document.getElementById("heurePrise");

    if (datePriseInput) {
        datePriseInput.value =
            formaterDateLocale(maintenant);
    }

    if (heurePriseInput) {
        heurePriseInput.value =
            formaterHeureLocale(maintenant);
    }
}


// ==================================================
// CALCULER LE PRIX
// ==================================================

function mettreAJourPrix() {
    const tarifKm = parseFloat(tarifKmInput?.value);

    if (
        distanceCalculeeKm === null ||
        !Number.isFinite(tarifKm) ||
        tarifKm < 0
    ) {
        if (prixInput) {
            prixInput.value = "";
        }

        return;
    }

    const prix =
        distanceCalculeeKm * tarifKm;

    if (prixInput) {
        prixInput.value =
            prix.toFixed(2);
    }
}


// ==================================================
// CALCULER L'ITINÉRAIRE ET LE PRIX
// ==================================================

async function calculerItineraireEtPrix() {
    if (!departInput || !destinationInput) {
        return;
    }

    const departLat =
        parseFloat(departInput.dataset.latitude);

    const departLon =
        parseFloat(departInput.dataset.longitude);

    const destinationLat =
        parseFloat(destinationInput.dataset.latitude);

    const destinationLon =
        parseFloat(destinationInput.dataset.longitude);

    if (
        !Number.isFinite(departLat) ||
        !Number.isFinite(departLon) ||
        !Number.isFinite(destinationLat) ||
        !Number.isFinite(destinationLon)
    ) {
        distanceCalculeeKm = null;

        if (distanceKmInput) {
            distanceKmInput.value = "";
        }

        if (prixInput) {
            prixInput.value = "";
        }

        afficherEtatTarification(
            "Sélectionnez le départ et la destination dans les suggestions."
        );

        return;
    }

    if (calculRouteEnCours) {
        return;
    }

    calculRouteEnCours = true;

    if (distanceKmInput) {
        distanceKmInput.value = "Calcul...";
    }

    if (prixInput) {
        prixInput.value = "";
    }

    afficherEtatTarification(
        "Calcul de l'itinéraire en cours..."
    );

    try {
        const url =
            "https://router.project-osrm.org/route/v1/driving/" +
            `${departLon},${departLat};${destinationLon},${destinationLat}` +
            "?overview=false";

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Impossible de calculer l'itinéraire."
            );
        }

        const data =
            await response.json();

        if (
            data.code !== "Ok" ||
            !Array.isArray(data.routes) ||
            !data.routes.length
        ) {
            throw new Error(
                "Aucun itinéraire trouvé."
            );
        }

        distanceCalculeeKm =
            data.routes[0].distance / 1000;

        if (distanceKmInput) {
            distanceKmInput.value =
                distanceCalculeeKm.toFixed(2);
        }

        mettreAJourPrix();

        const tarifKm =
            parseFloat(tarifKmInput?.value);

        if (
            Number.isFinite(tarifKm) &&
            tarifKm >= 0
        ) {
            const prix =
                distanceCalculeeKm * tarifKm;

            afficherEtatTarification(
                `Distance : ${distanceCalculeeKm.toFixed(2)} km — tarif : ${tarifKm.toFixed(2)} €/km — prix : ${prix.toFixed(2)} €`
            );
        } else {
            afficherEtatTarification(
                `Distance calculée : ${distanceCalculeeKm.toFixed(2)} km — indiquez le tarif au km.`
            );
        }

    } catch (error) {
        console.error(
            "Erreur calcul itinéraire :",
            error
        );

        distanceCalculeeKm = null;

        if (distanceKmInput) {
            distanceKmInput.value = "";
        }

        if (prixInput) {
            prixInput.value = "";
        }

        afficherEtatTarification(
            "Impossible de calculer l'itinéraire. Vérifiez les deux adresses."
        );

    } finally {
        calculRouteEnCours = false;
    }
}


// ==================================================
// MODIFICATION DU TARIF AU KM
// ==================================================

if (tarifKmInput) {
    tarifKmInput.addEventListener(
        "input",
        () => {
            mettreAJourPrix();

            if (distanceCalculeeKm !== null) {
                const tarifKm =
                    parseFloat(tarifKmInput.value);

                if (
                    Number.isFinite(tarifKm) &&
                    tarifKm >= 0
                ) {
                    const prix =
                        distanceCalculeeKm * tarifKm;

                    afficherEtatTarification(
                        `Distance : ${distanceCalculeeKm.toFixed(2)} km — tarif : ${tarifKm.toFixed(2)} €/km — prix : ${prix.toFixed(2)} €`
                    );
                }
            }
        }
    );
}


// ==================================================
// CONSTRUIRE LES DONNÉES DE LA RÉSERVATION
// ==================================================

function recupererDonneesReservation() {
    const paiement =
        document.querySelector(
            'input[name="paiement"]:checked'
        );

    const entrepriseNom =
        document.getElementById("entrepriseNom");

    const entrepriseSiret =
        document.getElementById("entrepriseSiret");

    const entrepriseRevtc =
        document.getElementById("entrepriseRevtc");

    const entrepriseAdresse =
        document.getElementById("entrepriseAdresse");

    const clientNom =
        document.getElementById("clientNom");

    const clientTelephone =
        document.getElementById("clientTelephone");

    const clientEmail =
        document.getElementById("clientEmail");

    const clientAdresse =
        document.getElementById("clientAdresse");

    const passager =
        document.getElementById("passager");

    const dateReservation =
        document.getElementById("dateReservation");

    const heureReservation =
        document.getElementById("heureReservation");

    const datePrise =
        document.getElementById("datePrise");

    const heurePrise =
        document.getElementById("heurePrise");

    const depart =
        document.getElementById("depart");

    const destination =
        document.getElementById("destination");

    const tarifKm =
        tarifKmInput
            ? parseFloat(tarifKmInput.value)
            : null;

    const distanceKm =
        distanceCalculeeKm;

    const prix =
        prixInput
            ? parseFloat(prixInput.value)
            : null;

    return {
        entreprise: {
            nom: entrepriseNom
                ? entrepriseNom.value.trim()
                : "",

            siret: entrepriseSiret
                ? entrepriseSiret.value.trim()
                : "",

            revtc: entrepriseRevtc
                ? entrepriseRevtc.value.trim()
                : "",

            adresse: entrepriseAdresse
                ? entrepriseAdresse.value.trim()
                : ""
        },

        client: {
            nom: clientNom
                ? clientNom.value.trim()
                : "",

            telephone: clientTelephone
                ? clientTelephone.value.trim()
                : "",

            email: clientEmail
                ? clientEmail.value.trim()
                : "",

            adresse: clientAdresse
                ? clientAdresse.value.trim()
                : ""
        },

        passager: passager
            ? passager.value.trim()
            : "",

        dateReservation: dateReservation
            ? dateReservation.value
            : "",

        heureReservation: heureReservation
            ? heureReservation.value
            : "",

        datePrise: datePrise
            ? datePrise.value
            : "",

        heurePrise: heurePrise
            ? heurePrise.value
            : "",

        depart: depart
            ? depart.value.trim()
            : "",

        destination: destination
            ? destination.value.trim()
            : "",

        tarifKm:
            Number.isFinite(tarifKm)
                ? tarifKm
                : null,

        distanceKm:
            Number.isFinite(distanceKm)
                ? distanceKm
                : null,

        prix:
            Number.isFinite(prix)
                ? prix
                : null,

        paiement:
            paiement
                ? paiement.value
                : ""
    };
}


// ==================================================
// ENREGISTRER / MODIFIER LA RÉSERVATION
// ==================================================

if (saveButton) {
    saveButton.addEventListener(
        "click",
        async () => {

            saveButton.disabled = true;

            const data =
                recupererDonneesReservation();

            if (!data.client.nom) {
                afficherMessage(
                    "Veuillez renseigner le nom du client.",
                    "red"
                );

                saveButton.disabled = false;
                return;
            }

            if (!data.depart) {
                afficherMessage(
                    "Veuillez renseigner l'adresse de départ.",
                    "red"
                );

                saveButton.disabled = false;
                return;
            }

            if (!data.destination) {
                afficherMessage(
                    "Veuillez renseigner l'adresse de destination.",
                    "red"
                );

                saveButton.disabled = false;
                return;
            }

            if (!Number.isFinite(data.distanceKm)) {
                afficherMessage(
                    "Veuillez sélectionner le départ et la destination dans les suggestions afin de calculer la distance.",
                    "red"
                );

                saveButton.disabled = false;
                return;
            }

            if (!Number.isFinite(data.prix)) {
                afficherMessage(
                    "Veuillez renseigner le tarif au kilomètre afin de calculer le prix.",
                    "red"
                );

                saveButton.disabled = false;
                return;
            }

            try {

                const estModification =
                    derniereReservationId !== null;

                afficherMessage(
                    estModification
                        ? "Modification de la réservation..."
                        : "Enregistrement de la réservation...",
                    "black"
                );

                const urlReservation =
                    estModification
                        ? `/api/reservations/${encodeURIComponent(
                            derniereReservationId
                        )}`
                        : "/api/reservations";

                const methodeReservation =
                    estModification
                        ? "PUT"
                        : "POST";

                const response =
                    await fetch(
                        urlReservation,
                        {
                            method: methodeReservation,
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            credentials: "same-origin",
                            body:
                                JSON.stringify(data)
                        }
                    );

                let result = null;

                try {
                    result =
                        await response.json();

                } catch (jsonError) {

                    throw new Error(
                        `Le serveur a retourné une réponse invalide (HTTP ${response.status}).`
                    );
                }

                if (!response.ok) {

                    throw new Error(
                        result?.error ||
                        result?.message ||
                        "Erreur lors de l'enregistrement."
                    );
                }

                const reservationId =
                    result?.reservationId ??
                    result?.reservation?.id ??
                    result?.id ??
                    derniereReservationId;

                if (
                    reservationId === undefined ||
                    reservationId === null ||
                    reservationId === ""
                ) {

                    console.error(
                        "Réponse serveur reçue :",
                        result
                    );

                    throw new Error(
                        "Le serveur n'a pas retourné l'identifiant de la réservation."
                    );
                }

                derniereReservationId =
                    Number(reservationId);

                if (
                    !Number.isInteger(
                        derniereReservationId
                    ) ||
                    derniereReservationId <= 0
                ) {

                    throw new Error(
                        "L'identifiant de la réservation retourné par le serveur est invalide."
                    );
                }

                console.log(
                    estModification
                        ? "Réservation modifiée :"
                        : "Réservation enregistrée :",
                    derniereReservationId
                );

                if (pdfButton) {
                    pdfButton.disabled = false;
                }

                afficherMessage(
                    estModification
                        ? `Réservation n°${derniereReservationId} modifiée avec succès. Vous pouvez maintenant générer le PDF.`
                        : `Réservation n°${derniereReservationId} enregistrée avec succès. Vous pouvez maintenant générer le PDF.`,
                    "green"
                );

            } catch (error) {

                console.error(
                    "Erreur réservation :",
                    error
                );

                afficherMessage(
                    "Erreur : " + error.message,
                    "red"
                );

            } finally {

                saveButton.disabled = false;
            }
        }
    );
}


// ==================================================
// GÉNÉRER LE PDF
// ==================================================

if (pdfButton) {
    pdfButton.addEventListener(
        "click",
        async () => {

            if (!derniereReservationId) {
                afficherMessage(
                    "Veuillez d'abord enregistrer une réservation.",
                    "red"
                );

                return;
            }

            pdfButton.disabled = true;

            try {

                afficherMessage(
                    "Génération du PDF en cours...",
                    "black"
                );

                const response =
                    await fetch(
                        `/api/reservations/${encodeURIComponent(
                            derniereReservationId
                        )}/pdf`,
                        {
                            credentials: "same-origin"
                        }
                    );

                if (!response.ok) {

                    let erreur =
                        "Erreur lors de la génération du PDF.";

                    try {

                        const result =
                            await response.json();

                        erreur =
                            result?.error ||
                            result?.message ||
                            erreur;

                    } catch (e) {
                        // Réponse non JSON
                    }

                    throw new Error(erreur);
                }

                const blob =
                    await response.blob();

                if (
                    !blob ||
                    blob.size === 0
                ) {
                    throw new Error(
                        "Le serveur a retourné un PDF vide."
                    );
                }

                const url =
                    window.URL.createObjectURL(blob);

                const lien =
                    document.createElement("a");

                lien.href = url;

                lien.download =
                    `reservation-${derniereReservationId}.pdf`;

                document.body.appendChild(lien);

                lien.click();

                lien.remove();

                setTimeout(
                    () => {
                        window.URL.revokeObjectURL(url);
                    },
                    1000
                );

                afficherMessage(
                    "PDF généré et téléchargé avec succès.",
                    "green"
                );

            } catch (error) {

                console.error(
                    "Erreur génération PDF :",
                    error
                );

                afficherMessage(
                    "Erreur PDF : " + error.message,
                    "red"
                );

            } finally {

                pdfButton.disabled = false;
            }
        }
    );
}


// ==================================================
// AUTOCOMPLÉTION DES ADRESSES
// ==================================================

function initialiserAutocompletionAdresse(
    inputId,
    suggestionsId
) {
    const input =
        document.getElementById(inputId);

    const suggestions =
        document.getElementById(suggestionsId);

    if (!input || !suggestions) {
        return;
    }

    let timeout = null;

    input.addEventListener(
        "input",
        () => {

            delete input.dataset.latitude;
            delete input.dataset.longitude;
            delete input.dataset.label;
            delete input.dataset.postcode;
            delete input.dataset.city;

            if (
                input.id === "depart" ||
                input.id === "destination"
            ) {

                distanceCalculeeKm = null;

                if (distanceKmInput) {
                    distanceKmInput.value = "";
                }

                if (prixInput) {
                    prixInput.value = "";
                }
            }

            const query =
                input.value.trim();

            clearTimeout(timeout);

            if (query.length < 3) {

                suggestions.innerHTML = "";
                suggestions.style.display = "none";

                return;
            }

            timeout =
                setTimeout(
                    () => {
                        rechercherAdresse(
                            query,
                            input,
                            suggestions
                        );
                    },
                    250
                );
        }
    );

    input.addEventListener(
        "keydown",
        (event) => {

            const items =
                suggestions.querySelectorAll(
                    ".address-suggestion"
                );

            if (!items.length) {
                return;
            }

            let activeIndex = -1;

            items.forEach(
                (item, index) => {

                    if (
                        item.classList.contains(
                            "active"
                        )
                    ) {
                        activeIndex = index;
                    }
                }
            );

            if (event.key === "ArrowDown") {

                event.preventDefault();

                activeIndex++;

                if (
                    activeIndex >= items.length
                ) {
                    activeIndex = 0;
                }

                activerSuggestion(
                    items,
                    activeIndex
                );
            }

            if (event.key === "ArrowUp") {

                event.preventDefault();

                activeIndex--;

                if (activeIndex < 0) {
                    activeIndex =
                        items.length - 1;
                }

                activerSuggestion(
                    items,
                    activeIndex
                );
            }

            if (event.key === "Enter") {

                if (activeIndex >= 0) {

                    event.preventDefault();

                    items[
                        activeIndex
                    ].click();
                }
            }

            if (event.key === "Escape") {

                suggestions.innerHTML = "";
                suggestions.style.display = "none";
            }
        }
    );

    document.addEventListener(
        "click",
        (event) => {

            if (
                !input.contains(event.target) &&
                !suggestions.contains(event.target)
            ) {

                suggestions.innerHTML = "";
                suggestions.style.display = "none";
            }
        }
    );
}


// ==================================================
// RECHERCHER UNE ADRESSE
// ==================================================

async function rechercherAdresse(
    query,
    input,
    suggestions
) {
    try {

        const url =
            "https://api-adresse.data.gouv.fr/search/" +
            "?q=" +
            encodeURIComponent(query) +
            "&limit=6" +
            "&autocomplete=1";

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Erreur API adresse"
            );
        }

        const data =
            await response.json();

        afficherSuggestionsAdresse(
            data.features || [],
            input,
            suggestions
        );

    } catch (error) {

        console.error(
            "Erreur autocomplétion adresse :",
            error
        );

        suggestions.innerHTML = "";
        suggestions.style.display = "none";
    }
}


// ==================================================
// AFFICHER LES SUGGESTIONS
// ==================================================

function afficherSuggestionsAdresse(
    features,
    input,
    suggestions
) {
    suggestions.innerHTML = "";

    if (!features.length) {
        suggestions.style.display = "none";
        return;
    }

    features.forEach(
        (feature) => {

            const properties =
                feature.properties || {};

            const label =
                properties.label || "";

            const postcode =
                properties.postcode || "";

            const city =
                properties.city || "";

            const div =
                document.createElement("div");

            div.className =
                "address-suggestion";

            const strong =
                document.createElement("strong");

            strong.textContent =
                label;

            const small =
                document.createElement("small");

            if (postcode || city) {

                small.textContent =
                    `${postcode} ${city}`.trim();
            }

            div.appendChild(strong);

            if (postcode || city) {
                div.appendChild(small);
            }

            div.addEventListener(
                "click",
                () => {

                    input.value = label;

                    input.dataset.label =
                        label;

                    input.dataset.postcode =
                        postcode;

                    input.dataset.city =
                        city;

                    const coordinates =
                        feature.geometry?.coordinates;

                    if (
                        coordinates &&
                        coordinates.length >= 2
                    ) {

                        input.dataset.longitude =
                            coordinates[0];

                        input.dataset.latitude =
                            coordinates[1];
                    }

                    suggestions.innerHTML = "";

                    suggestions.style.display =
                        "none";

                    if (
                        input.id === "depart" ||
                        input.id === "destination"
                    ) {

                        calculerItineraireEtPrix();
                    }
                }
            );

            suggestions.appendChild(div);
        }
    );

    suggestions.style.display = "block";
}


// ==================================================
// ACTIVER UNE SUGGESTION
// ==================================================

function activerSuggestion(
    items,
    index
) {
    items.forEach(
        (item) => {
            item.classList.remove(
                "active"
            );
        }
    );

    if (items[index]) {

        items[index].classList.add(
            "active"
        );

        items[index].scrollIntoView({
            block: "nearest"
        });
    }
}


// ==================================================
// INITIALISATION PAGE CRÉATION / MODIFICATION
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        initialiserDates();

        initialiserAutocompletionAdresse(
            "entrepriseAdresse",
            "entrepriseAdresseSuggestions"
        );

        initialiserAutocompletionAdresse(
            "clientAdresse",
            "clientAdresseSuggestions"
        );

        initialiserAutocompletionAdresse(
            "depart",
            "departSuggestions"
        );

        initialiserAutocompletionAdresse(
            "destination",
            "destinationSuggestions"
        );

        if (
            document.getElementById("entrepriseNom") ||
            document.getElementById("entrepriseSiret")
        ) {

            await chargerEntreprise();
        }

        // ------------------------------------------
        // MODE MODIFICATION
        // ------------------------------------------

        const params =
            new URLSearchParams(
                window.location.search
            );

        const reservationId =
            params.get("reservationId");

        if (reservationId) {

            await chargerReservationPourModification();
        }
    }
);


// ==================================================
// BOUTON PDF DÉSACTIVÉ AU DÉPART
// ==================================================

if (pdfButton) {
    pdfButton.disabled = true;
}


// ==================================================
// ==================================================
//              LISTE DES RÉSERVATIONS
// ==================================================
// ==================================================


// ==================================================
// CHARGER LES RÉSERVATIONS
// ==================================================

async function chargerListeReservations() {

    const container =
        document.getElementById(
            "reservationsContainer"
        );

    const resultsCount =
        document.getElementById(
            "resultsCount"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading">
            Chargement des réservations...
        </div>
    `;

    try {

        console.log(
            "GET /api/reservations"
        );

        const response =
            await fetch(
                "/api/reservations",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        let result = null;

        try {

            result =
                await response.json();

        } catch (error) {

            throw new Error(
                `Réponse serveur invalide (HTTP ${response.status}).`
            );
        }

        console.log(
            "Réponse /api/reservations :",
            result
        );

        if (!response.ok) {

            throw new Error(
                result?.message ||
                `Erreur HTTP ${response.status}`
            );
        }

        if (!result.success) {

            throw new Error(
                result?.message ||
                "Impossible de charger les réservations."
            );
        }

        toutesLesReservations =
            Array.isArray(result.reservations)
                ? result.reservations
                : [];

        console.log(
            `${toutesLesReservations.length} réservation(s) chargée(s).`
        );

        appliquerFiltresReservations();

    } catch (error) {

        console.error(
            "Erreur chargement réservations :",
            error
        );

        container.innerHTML = `
            <div class="empty">

                <div class="empty-icon">
                    ⚠️
                </div>

                <strong>
                    Impossible de charger les réservations
                </strong>

                <p>
                    ${escapeHtmlReservation(
                        error.message
                    )}
                </p>

            </div>
        `;

        if (resultsCount) {
            resultsCount.textContent =
                "0 réservation";
        }
    }
}


// ==================================================
// AFFICHER LA LISTE
// ==================================================

function afficherListeReservations(
    reservations
) {

    const container =
        document.getElementById(
            "reservationsContainer"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(reservations) ||
        reservations.length === 0
    ) {

        container.innerHTML = `
            <div class="empty">

                <div class="empty-icon">
                    📋
                </div>

                <strong>
                    Aucune réservation
                </strong>

                <p>
                    Aucune réservation ne correspond aux critères sélectionnés.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="reservation-table">

            <div class="list-header">

                <div class="header-date">
                    Date
                </div>

                <div>
                    Client
                </div>

                <div>
                    Passager
                </div>

                <div>
                    Trajet
                </div>

                <div>
                    Prix
                </div>

                <div class="header-actions">
                    Actions
                </div>

            </div>

            <div class="reservations-list-scroll">

                ${reservations
                    .map(
                        reservation =>
                            creerReservationHTML(
                                reservation
                            )
                    )
                    .join("")}

            </div>

        </div>
    `;
}


// ==================================================
// CRÉER UNE LIGNE DE RÉSERVATION
// ==================================================

function creerReservationHTML(
    reservation
) {

    const id =
        reservation.id ?? "";

    const client =
        reservation.client_nom ||
        "Client non renseigné";

    const telephone =
        reservation.client_telephone ||
        "";

    const date =
        reservation.date_prise_en_charge ||
        "";

    const heure =
        reservation.heure_prise_en_charge ||
        "";

    const depart =
        reservation.depart ||
        "Départ non renseigné";

    const destination =
        reservation.destination ||
        "Destination non renseignée";

    const passager =
        reservation.passager ||
        "—";

    const prix =
        Number(reservation.prix_ttc);

    const prixAffiche =
        Number.isFinite(prix)
            ? `${prix.toFixed(2)} €`
            : "—";

    const dateReservation =
        construireDateReservation(
            reservation
        );

    const maintenant =
        new Date();

    let statutHTML = "";

    if (dateReservation) {

        if (dateReservation >= maintenant) {

            statutHTML = `
                <span class="status status-avenir">
                    À venir
                </span>
            `;

        } else {

            statutHTML = `
                <span class="status status-termine">
                    Terminée
                </span>
            `;
        }
    }

    return `
        <div class="reservation-row">

            <div class="reservation-date">

                <strong>
                    ${escapeHtmlReservation(
                        formaterDateAffichage(
                            date
                        )
                    )}
                </strong>

                <span>
                    ${escapeHtmlReservation(
                        heure || "—"
                    )}
                </span>

                ${statutHTML}

            </div>


            <div class="client">

                <span class="client-name">
                    ${escapeHtmlReservation(
                        client
                    )}
                </span>

                ${
                    telephone
                        ? `
                            <span class="client-phone">
                                ${escapeHtmlReservation(
                                    telephone
                                )}
                            </span>
                          `
                        : ""
                }

            </div>


            <div class="passenger">
                ${escapeHtmlReservation(
                    passager
                )}
            </div>


            <div class="route">

                <span class="route-point">
                    ${escapeHtmlReservation(
                        depart
                    )}
                </span>

                <span class="route-arrow">
                    →
                </span>

                <span class="route-point">
                    ${escapeHtmlReservation(
                        destination
                    )}
                </span>

            </div>


            <div class="price">
                ${escapeHtmlReservation(
                    prixAffiche
                )}
            </div>


            <div class="actions">

                <button
                    type="button"
                    class="action-button edit-button"
                    data-reservation-id="${escapeHtmlReservation(
                        id
                    )}"
                    onclick="modifierReservation(${Number(id) || 0})"
                >
                    Modifier
                </button>

                <a
                    href="/api/reservations/${encodeURIComponent(
                        id
                    )}/pdf"
                    target="_blank"
                    rel="noopener"
                    class="action-button pdf-button"
                >
                    PDF
                </a>

            </div>

        </div>
    `;
}


// ==================================================
// FORMATER DATE POUR AFFICHAGE
// ==================================================

function formaterDateAffichage(
    date
) {

    if (!date) {
        return "Date inconnue";
    }

    const match =
        String(date).match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

    if (!match) {
        return date;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
}


// ==================================================
// FILTRER LES RÉSERVATIONS
// ==================================================

function appliquerFiltresReservations() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const dateFilter =
        document.getElementById(
            "dateFilter"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const resultsCount =
        document.getElementById(
            "resultsCount"
        );

    const recherche =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const dateRecherche =
        dateFilter
            ? dateFilter.value
            : "";

    const statut =
        statusFilter
            ? statusFilter.value
            : "toutes";

    let reservations =
        [...toutesLesReservations];


    // ==================================================
    // RECHERCHE
    // ==================================================

    if (recherche) {

        reservations =
            reservations.filter(
                reservation => {

                    const texte = [

                        reservation.id,
                        reservation.client_nom,
                        reservation.client_telephone,
                        reservation.client_email,
                        reservation.client_adresse,
                        reservation.depart,
                        reservation.destination,
                        reservation.passager,
                        reservation.mode_reglement

                    ]
                        .filter(
                            valeur =>
                                valeur !== null &&
                                valeur !== undefined
                        )
                        .join(" ")
                        .toLowerCase();

                    return texte.includes(
                        recherche
                    );
                }
            );
    }


    // ==================================================
    // FILTRE DATE
    // ==================================================

    if (dateRecherche) {

        reservations =
            reservations.filter(
                reservation =>
                    reservation.date_prise_en_charge ===
                    dateRecherche
            );
    }


    // ==================================================
    // FILTRE STATUT
    // ==================================================

    if (
        statut === "avenir" ||
        statut === "terminees"
    ) {

        const maintenant =
            new Date();

        reservations =
            reservations.filter(
                reservation => {

                    const dateReservation =
                        construireDateReservation(
                            reservation
                        );

                    if (!dateReservation) {
                        return false;
                    }

                    if (statut === "avenir") {

                        return (
                            dateReservation >=
                            maintenant
                        );
                    }

                    return (
                        dateReservation <
                        maintenant
                    );
                }
            );
    }


    // ==================================================
    // AFFICHAGE
    // ==================================================

    afficherListeReservations(
        reservations
    );


    // ==================================================
    // COMPTEUR
    // ==================================================

    if (resultsCount) {

        resultsCount.textContent =
            `${reservations.length} réservation` +
            (
                reservations.length > 1
                    ? "s"
                    : ""
            );
    }
}


// ==================================================
// COMPATIBILITÉ
// ==================================================

function filtrerListeReservations() {
    appliquerFiltresReservations();
}


// ==================================================
// CONSTRUIRE LA DATE D'UNE RÉSERVATION
// ==================================================

function construireDateReservation(
    reservation
) {

    if (
        !reservation ||
        !reservation.date_prise_en_charge
    ) {
        return null;
    }

    const heure =
        reservation.heure_prise_en_charge ||
        "00:00";

    const date =
        new Date(
            `${reservation.date_prise_en_charge}T${heure}`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}


// ==================================================
// SÉCURISER L'AFFICHAGE HTML
// ==================================================

function escapeHtmlReservation(
    valeur
) {

    return String(
        valeur ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ==================================================
// MODIFIER UNE RÉSERVATION
// ==================================================

function modifierReservation(id) {

    if (!id) {

        console.error(
            "ID de réservation invalide."
        );

        return;
    }

    console.log(
        "Modification réservation :",
        id
    );

    window.location.href =
        `/?reservationId=${encodeURIComponent(id)}`;
}


// ==================================================
// CHARGER UNE RÉSERVATION POUR MODIFICATION
// ==================================================

async function chargerReservationPourModification() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const reservationId =
        params.get("reservationId");

    // Aucune réservation à modifier
    if (!reservationId) {
        return false;
    }

    console.log(
        "Chargement de la réservation à modifier :",
        reservationId
    );

    try {

        afficherMessage(
            "Chargement de la réservation...",
            "black"
        );

        const response =
            await fetch(
                `/api/reservations/${encodeURIComponent(
                    reservationId
                )}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        let result = null;

        try {

            result =
                await response.json();

        } catch (error) {

            throw new Error(
                `Réponse serveur invalide (HTTP ${response.status}).`
            );
        }

        if (!response.ok) {

            throw new Error(
                result?.message ||
                "Impossible de charger la réservation."
            );
        }

        if (
            !result.success ||
            !result.reservation
        ) {

            throw new Error(
                result?.message ||
                "Réservation introuvable."
            );
        }

        const reservation =
            result.reservation;


        // ------------------------------------------
        // ID DE LA RÉSERVATION
        // ------------------------------------------

        derniereReservationId =
            Number(
                reservation.id ||
                reservationId
            );

        if (
            !Number.isInteger(
                derniereReservationId
            ) ||
            derniereReservationId <= 0
        ) {

            throw new Error(
                "Identifiant de réservation invalide."
            );
        }


        // ------------------------------------------
        // CLIENT
        // ------------------------------------------

        const clientNom =
            document.getElementById(
                "clientNom"
            );

        const clientTelephone =
            document.getElementById(
                "clientTelephone"
            );

        const clientEmail =
            document.getElementById(
                "clientEmail"
            );

        const clientAdresse =
            document.getElementById(
                "clientAdresse"
            );

        if (clientNom) {

            clientNom.value =
                reservation.client_nom || "";
        }

        if (clientTelephone) {

            clientTelephone.value =
                reservation.client_telephone || "";
        }

        if (clientEmail) {

            clientEmail.value =
                reservation.client_email || "";
        }

        if (clientAdresse) {

            clientAdresse.value =
                reservation.client_adresse || "";
        }


        // ------------------------------------------
        // PASSAGER
        // ------------------------------------------

        const passager =
            document.getElementById(
                "passager"
            );

        if (passager) {

            passager.value =
                reservation.passager || "";
        }


        // ------------------------------------------
        // DATES
        // ------------------------------------------

        const dateReservation =
            document.getElementById(
                "dateReservation"
            );

        const heureReservation =
            document.getElementById(
                "heureReservation"
            );

        const datePrise =
            document.getElementById(
                "datePrise"
            );

        const heurePrise =
            document.getElementById(
                "heurePrise"
            );

        if (dateReservation) {

            dateReservation.value =
                reservation.date_reservation || "";
        }

        if (heureReservation) {

            heureReservation.value =
                reservation.heure_reservation || "";
        }

        if (datePrise) {

            datePrise.value =
                reservation.date_prise_en_charge || "";
        }

        if (heurePrise) {

            heurePrise.value =
                reservation.heure_prise_en_charge || "";
        }


        // ------------------------------------------
        // TRAJET
        // ------------------------------------------

        if (departInput) {

            departInput.value =
                reservation.depart || "";

            /*
            On ne met pas de coordonnées ici car
            la réservation existante ne les stocke pas.
            La distance existante est conservée.
            */
        }

        if (destinationInput) {

            destinationInput.value =
                reservation.destination || "";
        }


        // ------------------------------------------
        // TARIFICATION
        // ------------------------------------------

        if (tarifKmInput) {

            tarifKmInput.value =
                reservation.tarif_km ?? "";
        }

        if (distanceKmInput) {

            distanceKmInput.value =
                reservation.distance_km ?? "";
        }

        if (prixInput) {

            prixInput.value =
                reservation.prix_ttc ?? "";
        }

        distanceCalculeeKm =
            Number(
                reservation.distance_km
            );

        if (
            !Number.isFinite(
                distanceCalculeeKm
            )
        ) {

            distanceCalculeeKm = null;
        }


        // ------------------------------------------
        // ÉTAT TARIFICATION
        // ------------------------------------------

        if (
            distanceCalculeeKm !== null
        ) {

            const tarifKm =
                parseFloat(
                    reservation.tarif_km
                );

            if (
                Number.isFinite(tarifKm)
            ) {

                afficherEtatTarification(
                    `Distance : ${distanceCalculeeKm.toFixed(2)} km — tarif : ${tarifKm.toFixed(2)} €/km — prix : ${Number(reservation.prix_ttc || 0).toFixed(2)} €`
                );
            }
        }


        // ------------------------------------------
        // MODE DE RÈGLEMENT
        // ------------------------------------------

        const paiement =
            document.querySelectorAll(
                'input[name="paiement"]'
            );

        paiement.forEach(
            input => {

                input.checked =
                    String(input.value) ===
                    String(
                        reservation.mode_reglement || ""
                    );
            }
        );


        // ------------------------------------------
        // BOUTON ENREGISTRER
        // ------------------------------------------

        if (saveButton) {

            saveButton.textContent =
                "Modifier la réservation";
        }


        // ------------------------------------------
        // BOUTON PDF
        // ------------------------------------------

        if (pdfButton) {

            pdfButton.disabled = false;
        }


        afficherMessage(
            `Modification de la réservation n°${derniereReservationId}.`,
            "black"
        );

        console.log(
            "Réservation chargée pour modification :",
            reservation
        );

        return true;

    } catch (error) {

        console.error(
            "Erreur chargement réservation :",
            error
        );

        afficherMessage(
            "Erreur : " + error.message,
            "red"
        );

        return false;
    }
}


// ==================================================
// INITIALISATION DE LA LISTE
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const container =
            document.getElementById(
                "reservationsContainer"
            );

        /*
        Si reservationsContainer n'existe pas,
        nous sommes sur la page création /
        modification.
        */

        if (!container) {
            return;
        }


        // ==================================================
        // CHARGEMENT INITIAL
        // ==================================================

        chargerListeReservations();


        // ==================================================
        // RECHERCHE
        // ==================================================

        const searchInput =
            document.getElementById(
                "searchInput"
            );

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                appliquerFiltresReservations
            );
        }


        // ==================================================
        // FILTRE DATE
        // ==================================================

        const dateFilter =
            document.getElementById(
                "dateFilter"
            );

        if (dateFilter) {

            dateFilter.addEventListener(
                "change",
                appliquerFiltresReservations
            );
        }


        // ==================================================
        // FILTRE STATUT
        // ==================================================

        const statusFilter =
            document.getElementById(
                "statusFilter"
            );

        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                appliquerFiltresReservations
            );
        }


        // ==================================================
        // RÉINITIALISER
        // ==================================================

        const resetFilters =
            document.getElementById(
                "resetFilters"
            );

        if (resetFilters) {

            resetFilters.addEventListener(
                "click",
                () => {

                    if (searchInput) {
                        searchInput.value = "";
                    }

                    if (dateFilter) {
                        dateFilter.value = "";
                    }

                    if (statusFilter) {

                        statusFilter.value =
                            "toutes";
                    }

                    appliquerFiltresReservations();
                }
            );
        }


        // ==================================================
        // ACTUALISER
        // ==================================================

        const refreshButton =
            document.getElementById(
                "refreshButton"
            );

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                async () => {

                    refreshButton.disabled =
                        true;

                    try {

                        await chargerListeReservations();

                    } finally {

                        refreshButton.disabled =
                            false;
                    }
                }
            );
        }
    }
);