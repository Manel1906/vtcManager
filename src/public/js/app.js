/*
==================================================
 APPLICATION RÉSERVATION
==================================================

Fonctions :

- Chargement des informations entreprise
- Sauvegarde des informations entreprise
- Initialisation automatique des dates/heures
- Autocomplétion des adresses
- Récupération latitude / longitude
- Calcul distance routière avec OSRM
- Calcul automatique du prix
- Modification du tarif au km
- Création d'une réservation
- Modification d'une réservation
- Génération du PDF

==================================================
*/


// ==================================================
// ÉLÉMENTS PRINCIPAUX
// ==================================================

const message =
    document.getElementById("message");

const saveButton =
    document.getElementById("saveButton");

const pdfButton =
    document.getElementById("pdfButton");


// ==================================================
// ID DE LA DERNIÈRE RÉSERVATION
// ==================================================

let derniereReservationId = null;

let reservationEnModificationId = null;


// ==================================================
// ÉLÉMENTS TARIFICATION
// ==================================================

const departInput =
    document.getElementById("depart");

const destinationInput =
    document.getElementById("destination");

const tarifKmInput =
    document.getElementById("tarifKm");

const distanceKmInput =
    document.getElementById("distanceKm");

const prixInput =
    document.getElementById("prix");

const tarifMessage =
    document.getElementById("tarifMessage");


// ==================================================
// VARIABLES CALCUL
// ==================================================

let distanceCalculeeKm = null;

let calculRouteEnCours = false;


// ==================================================
// AFFICHER UN MESSAGE
// ==================================================

function afficherMessage(
    texte,
    couleur
) {
    if (!message) {
        return;
    }

    message.textContent =
        texte;

    message.style.color =
        couleur;
}


// ==================================================
// AFFICHER L'ÉTAT DE LA TARIFICATION
// ==================================================

function afficherEtatTarification(
    texte
) {
    if (!tarifMessage) {
        return;
    }

    tarifMessage.textContent =
        texte;
}


// ==================================================
// CHARGER LES INFORMATIONS DE L'ENTREPRISE
// ==================================================

async function chargerEntreprise() {

    try {

        const response =
            await fetch(
                "/api/entreprise",
                {
                    method: "GET",
                    credentials: "same-origin"
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            result.success === false
        ) {
            throw new Error(
                result.message ||
                "Impossible de charger les informations de l'entreprise."
            );
        }

        const entreprise =
            result.data ||
            result.entreprise ||
            null;

        if (!entreprise) {
            return;
        }


        const entrepriseNom =
            document.getElementById(
                "entrepriseNom"
            );

        const entrepriseSiret =
            document.getElementById(
                "entrepriseSiret"
            );

        const entrepriseRevtc =
            document.getElementById(
                "entrepriseRevtc"
            );

        const entrepriseTelephone =
            document.getElementById(
                "entrepriseTelephone"
            );

        const entrepriseEmail =
            document.getElementById(
                "entrepriseEmail"
            );

        const entrepriseChauffeur =
            document.getElementById(
                "entrepriseChauffeur"
            );

        const entrepriseAdresse =
            document.getElementById(
                "entrepriseAdresse"
            );


        if (entrepriseNom) {
            entrepriseNom.value =
                entreprise.nom || "";
        }

        if (entrepriseSiret) {
            entrepriseSiret.value =
                entreprise.siret || "";
        }

        if (entrepriseRevtc) {
            entrepriseRevtc.value =
                entreprise.revtc || "";
        }

        if (entrepriseTelephone) {
            entrepriseTelephone.value =
                entreprise.telephone || "";
        }

        if (entrepriseEmail) {
            entrepriseEmail.value =
                entreprise.email || "";
        }

        if (entrepriseChauffeur) {
            entrepriseChauffeur.value =
                entreprise.chauffeur || "";
        }

        if (entrepriseAdresse) {
            entrepriseAdresse.value =
                entreprise.adresse || "";
        }

    } catch (error) {

        console.error(
            "Erreur chargement entreprise :",
            error
        );

    }
}


// ==================================================
// SAUVEGARDER LES INFORMATIONS DE L'ENTREPRISE
// ==================================================

async function sauvegarderEntreprise(
    entreprise
) {

    const response =
        await fetch(
            "/api/entreprise",
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                credentials:
                    "same-origin",

                body:
                    JSON.stringify(
                        entreprise
                    )
            }
        );


    let result = null;


    try {

        result =
            await response.json();

    } catch (error) {

        throw new Error(
            "Le serveur a retourné une réponse invalide lors de la sauvegarde de l'entreprise."
        );

    }


    if (
        !response.ok ||
        result.success === false
    ) {

        throw new Error(
            result.message ||
            result.error ||
            "Impossible de sauvegarder les informations de l'entreprise."
        );

    }


    return (
        result.data ||
        result.entreprise ||
        entreprise
    );
}


// ==================================================
// FORMATER UNE DATE LOCALE
// ==================================================

function formaterDateLocale(
    date
) {

    const annee =
        date.getFullYear();

    const mois =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const jour =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${annee}-${mois}-${jour}`;
}


// ==================================================
// FORMATER UNE HEURE LOCALE
// ==================================================

function formaterHeureLocale(
    date
) {

    const heures =
        String(
            date.getHours()
        ).padStart(2, "0");

    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return `${heures}:${minutes}`;
}


// ==================================================
// INITIALISER LES DATES ET HEURES
// ==================================================

function initialiserDates() {

    const maintenant =
        new Date();


    const dateReservation =
        new Date(
            maintenant
        );


    dateReservation.setHours(
        dateReservation.getHours() - 3
    );


    const dateReservationInput =
        document.getElementById(
            "dateReservation"
        );

    const heureReservationInput =
        document.getElementById(
            "heureReservation"
        );


    if (dateReservationInput) {

        dateReservationInput.value =
            formaterDateLocale(
                dateReservation
            );

    }


    if (heureReservationInput) {

        heureReservationInput.value =
            formaterHeureLocale(
                dateReservation
            );

    }


    const datePriseInput =
        document.getElementById(
            "datePrise"
        );

    const heurePriseInput =
        document.getElementById(
            "heurePrise"
        );


    if (datePriseInput) {

        datePriseInput.value =
            formaterDateLocale(
                maintenant
            );

    }


    if (heurePriseInput) {

        heurePriseInput.value =
            formaterHeureLocale(
                maintenant
            );

    }
}


// ==================================================
// CALCULER LE PRIX
// ==================================================

function mettreAJourPrix() {
    const tarifKm = parseFloat(tarifKmInput?.value);

    // Sans distance calculée automatiquement,
    // on conserve le prix éventuellement saisi manuellement.
    if (distanceCalculeeKm === null) {
        return;
    }

    if (
        !Number.isFinite(tarifKm) ||
        tarifKm < 0
    ) {
        if (prixInput) {
            prixInput.value = "";
        }
        return;
    }

    const prix = distanceCalculeeKm * tarifKm;

    if (prixInput) {
        prixInput.value = prix.toFixed(2);
    }
}


// ==================================================
// CALCULER L'ITINÉRAIRE ET LE PRIX
// ==================================================

async function calculerItineraireEtPrix() {

    if (
        !departInput ||
        !destinationInput
    ) {
        return;
    }


    const departLat =
        parseFloat(
            departInput.dataset.latitude
        );

    const departLon =
        parseFloat(
            departInput.dataset.longitude
        );


    const destinationLat =
        parseFloat(
            destinationInput.dataset.latitude
        );

    const destinationLon =
        parseFloat(
            destinationInput.dataset.longitude
        );


    if (
        !Number.isFinite(departLat) ||
        !Number.isFinite(departLon) ||
        !Number.isFinite(destinationLat) ||
        !Number.isFinite(destinationLon)
    ) {

        distanceCalculeeKm =
            null;


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


    calculRouteEnCours =
        true;


    if (distanceKmInput) {

        distanceKmInput.value =
            "Calcul...";

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
            !data.routes ||
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
            parseFloat(
                tarifKmInput?.value
            );


        if (
            Number.isFinite(tarifKm) &&
            tarifKm >= 0
        ) {

            const prix =
                distanceCalculeeKm *
                tarifKm;


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


        distanceCalculeeKm =
            null;


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

        calculRouteEnCours =
            false;

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


            if (
                distanceCalculeeKm !== null
            ) {

                const tarifKm =
                    parseFloat(
                        tarifKmInput.value
                    );


                if (
                    Number.isFinite(
                        tarifKm
                    ) &&
                    tarifKm >= 0
                ) {

                    const prix =
                        distanceCalculeeKm *
                        tarifKm;


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
        document.getElementById(
            "entrepriseNom"
        );

    const entrepriseSiret =
        document.getElementById(
            "entrepriseSiret"
        );

    const entrepriseRevtc =
        document.getElementById(
            "entrepriseRevtc"
        );

    const entrepriseTelephone =
        document.getElementById(
            "entrepriseTelephone"
        );

    const entrepriseEmail =
        document.getElementById(
            "entrepriseEmail"
        );

    const entrepriseChauffeur =
        document.getElementById(
            "entrepriseChauffeur"
        );

    const entrepriseAdresse =
        document.getElementById(
            "entrepriseAdresse"
        );


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


    const passager =
        document.getElementById(
            "passager"
        );


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


    const depart =
        document.getElementById(
            "depart"
        );

    const destination =
        document.getElementById(
            "destination"
        );


    const tarifKm =
        tarifKmInput
            ? parseFloat(
                tarifKmInput.value
            )
            : null;


   const distanceKm =
    distanceKmInput &&
    distanceKmInput.value.trim() !== ""
        ? parseFloat(distanceKmInput.value)
        : null;

const prix =
    prixInput &&
    prixInput.value.trim() !== ""
        ? parseFloat(prixInput.value)
        : null;


    return {

        entreprise: {

            nom:
                entrepriseNom
                    ? entrepriseNom.value.trim()
                    : "",

            siret:
                entrepriseSiret
                    ? entrepriseSiret.value.trim()
                    : "",

            revtc:
                entrepriseRevtc
                    ? entrepriseRevtc.value.trim()
                    : "",

            telephone:
                entrepriseTelephone
                    ? entrepriseTelephone.value.trim()
                    : "",

            email:
                entrepriseEmail
                    ? entrepriseEmail.value.trim()
                    : "",

            adresse:
                entrepriseAdresse
                    ? entrepriseAdresse.value.trim()
                    : "",

            chauffeur:
                entrepriseChauffeur
                    ? entrepriseChauffeur.value.trim()
                    : ""

        },


        client: {

            nom:
                clientNom
                    ? clientNom.value.trim()
                    : "",

            telephone:
                clientTelephone
                    ? clientTelephone.value.trim()
                    : "",

            email:
                clientEmail
                    ? clientEmail.value.trim()
                    : "",

            adresse:
                clientAdresse
                    ? clientAdresse.value.trim()
                    : ""

        },


        passager:
            passager
                ? passager.value.trim()
                : "",


        dateReservation:
            dateReservation
                ? dateReservation.value
                : "",


        heureReservation:
            heureReservation
                ? heureReservation.value
                : "",


        datePrise:
            datePrise
                ? datePrise.value
                : "",


        heurePrise:
            heurePrise
                ? heurePrise.value
                : "",


        depart:
            depart
                ? depart.value.trim()
                : "",


        destination:
            destination
                ? destination.value.trim()
                : "",


        tarifKm:
            Number.isFinite(
                tarifKm
            )
                ? tarifKm
                : null,


        distanceKm:
            Number.isFinite(
                distanceKm
            )
                ? distanceKm
                : null,


        prix:
            Number.isFinite(
                prix
            )
                ? prix
                : null,


        paiement:
            paiement
                ? paiement.value
                : ""

    };
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
        params.get(
            "reservationId"
        );


    // --------------------------------------------------
    // PAS DE reservationId = MODE CRÉATION
    // --------------------------------------------------

    if (!reservationId) {

        reservationEnModificationId =
            null;

        return false;
    }


    const id =
        Number(
            reservationId
        );


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        console.error(
            "Identifiant de réservation invalide :",
            reservationId
        );

        return false;
    }


    try {

        afficherMessage(
            "Chargement de la réservation...",
            "black"
        );


        const response =
            await fetch(
                `/api/reservations/${encodeURIComponent(id)}`,
                {
                    method: "GET",
                    credentials: "same-origin"
                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch (error) {

            throw new Error(
                "Le serveur a retourné une réponse invalide."
            );

        }


        if (
            !response.ok ||
            result.success === false ||
            !result.reservation
        ) {

            throw new Error(
                result.message ||
                "Impossible de charger la réservation."
            );

        }


        const reservation =
            result.reservation;


        console.log(
            "Réservation chargée pour modification :",
            reservation
        );


        reservationEnModificationId =
            id;


        derniereReservationId =
            id;


        // ==================================================
        // CLIENT
        // ==================================================

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
                reservation.client_nom ||
                "";

        }


        if (clientTelephone) {

            clientTelephone.value =
                reservation.client_telephone ||
                "";

        }


        if (clientEmail) {

            clientEmail.value =
                reservation.client_email ||
                "";

        }


        if (clientAdresse) {

            clientAdresse.value =
                reservation.client_adresse ||
                "";

        }


        // ==================================================
        // DATE / HEURE
        // ==================================================

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
                reservation.date_reservation ||
                "";

        }


        if (heureReservation) {

            heureReservation.value =
                String(
                    reservation.heure_reservation ||
                    ""
                ).substring(
                    0,
                    5
                );

        }


        if (datePrise) {

            datePrise.value =
                reservation.date_prise_en_charge ||
                "";

        }


        if (heurePrise) {

            heurePrise.value =
                String(
                    reservation.heure_prise_en_charge ||
                    ""
                ).substring(
                    0,
                    5
                );

        }


        // ==================================================
        // AUTRES INFORMATIONS
        // ==================================================

        const passager =
            document.getElementById(
                "passager"
            );

        const depart =
            document.getElementById(
                "depart"
            );

        const destination =
            document.getElementById(
                "destination"
            );


        if (passager) {

            passager.value =
                reservation.passager ||
                "";

        }


        if (depart) {

            depart.value =
                reservation.depart ||
                "";

        }


        if (destination) {

            destination.value =
                reservation.destination ||
                "";

        }


        // ==================================================
        // TARIFICATION
        // ==================================================

        const tarifKm =
            document.getElementById(
                "tarifKm"
            );

        const distanceKm =
            document.getElementById(
                "distanceKm"
            );

        const prix =
            document.getElementById(
                "prix"
            );


        if (tarifKm) {

            tarifKm.value =
                reservation.tarif_km ??
                "";

        }


        if (distanceKm) {

            distanceKm.value =
                reservation.distance_km ??
                "";

        }


        if (prix) {

            prix.value =
                reservation.prix_ttc ??
                "";

        }


        const distance =
            Number(
                reservation.distance_km
            );


        if (
            Number.isFinite(
                distance
            )
        ) {

            distanceCalculeeKm =
                distance;

        } else {

            distanceCalculeeKm =
                null;

        }


        // ==================================================
        // MODE DE RÈGLEMENT
        // ==================================================

        const paiements =
            document.querySelectorAll(
                'input[name="paiement"]'
            );


        paiements.forEach(
            (input) => {

                input.checked =
                    String(
                        input.value
                    ) ===
                    String(
                        reservation.mode_reglement ||
                        ""
                    );

            }
        );


        // ==================================================
        // MODE MODIFICATION
        // ==================================================

        if (saveButton) {

            saveButton.textContent =
                "Modifier la réservation";

        }


        if (pdfButton) {

            pdfButton.disabled =
                false;

        }


        if (
            Number.isFinite(
                distanceCalculeeKm
            )
        ) {

            afficherEtatTarification(
                `Distance : ${distanceCalculeeKm.toFixed(2)} km`
            );

        }


        afficherMessage(
            `Réservation n°${id} chargée pour modification.`,
            "green"
        );


        return true;


    } catch (error) {

        console.error(
            "Erreur chargement réservation :",
            error
        );


        afficherMessage(
            "Erreur : " +
            error.message,
            "red"
        );


        return false;
    }
}


// ==================================================
// ENREGISTRER / MODIFIER LA RÉSERVATION
// ==================================================

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async () => {

            saveButton.disabled =
                true;


            const data =
                recupererDonneesReservation();


            // ==================================================
            // VALIDATIONS
            // ==================================================

            if (!data.client.nom) {

                afficherMessage(
                    "Veuillez renseigner le nom du client.",
                    "red"
                );

                saveButton.disabled =
                    false;

                return;
            }


            if (!data.depart) {

                afficherMessage(
                    "Veuillez renseigner l'adresse de départ.",
                    "red"
                );

                saveButton.disabled =
                    false;

                return;
            }


            if (!data.destination) {

                afficherMessage(
                    "Veuillez renseigner l'adresse de destination.",
                    "red"
                );

                saveButton.disabled =
                    false;

                return;
            }


            if (
                !Number.isFinite(
                    data.distanceKm
                )
            ) {

                afficherMessage(
                    "Veuillez sélectionner le départ et la destination dans les suggestions afin de calculer la distance.",
                    "red"
                );

                saveButton.disabled =
                    false;

                return;
            }


            if (
                !Number.isFinite(
                    data.prix
                )
            ) {

                afficherMessage(
                    "Veuillez renseigner le tarif au kilomètre afin de calculer le prix.",
                    "red"
                );

                saveButton.disabled =
                    false;

                return;
            }


            try {

                // ==================================================
                // SAUVEGARDE ENTREPRISE
                // ==================================================

                afficherMessage(
                    "Sauvegarde des informations de l'entreprise...",
                    "black"
                );


                await sauvegarderEntreprise(
                    data.entreprise
                );


                // ==================================================
                // DÉTERMINER CRÉATION OU MODIFICATION
                // ==================================================

                const estModification =
                    reservationEnModificationId !== null;


                const urlReservation =
                    estModification
                        ? `/api/reservations/${encodeURIComponent(
                            reservationEnModificationId
                        )}`
                        : "/api/reservations";


                const methodeReservation =
                    estModification
                        ? "PUT"
                        : "POST";


                afficherMessage(
                    estModification
                        ? "Modification de la réservation..."
                        : "Enregistrement de la réservation...",
                    "black"
                );


                // ==================================================
                // ENVOYER LA RÉSERVATION
                // ==================================================

                const response =
                    await fetch(
                        urlReservation,
                        {
                            method:
                                methodeReservation,

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body:
                                JSON.stringify(
                                    data
                                )
                        }
                    );


                // ==================================================
                // LIRE LA RÉPONSE
                // ==================================================

                let result = null;


                try {

                    result =
                        await response.json();

                } catch (jsonError) {

                    throw new Error(
                        "Le serveur a retourné une réponse invalide."
                    );

                }


                // ==================================================
                // VÉRIFIER LA RÉPONSE
                // ==================================================

                if (
                    !response.ok ||
                    result.success === false
                ) {

                    throw new Error(
                        result.message ||
                        result.error ||
                        "Erreur lors de l'enregistrement."
                    );

                }


                // ==================================================
                // RÉCUPÉRER L'ID
                // ==================================================

                const reservationId =
                    estModification
                        ? reservationEnModificationId
                        : Number(
                            result.reservationId ||
                            result.id ||
                            result.reservation?.id
                        );


                if (
                    !Number.isInteger(
                        reservationId
                    ) ||
                    reservationId <= 0
                ) {

                    console.error(
                        "Réponse serveur inattendue :",
                        result
                    );


                    throw new Error(
                        "Le serveur n'a pas retourné l'identifiant de la réservation."
                    );

                }


                derniereReservationId =
                    reservationId;


                console.log(
                    estModification
                        ? "Réservation modifiée :"
                        : "Réservation enregistrée :",
                    derniereReservationId
                );


                // ==================================================
                // ACTIVER PDF
                // ==================================================

                if (pdfButton) {

                    pdfButton.disabled =
                        false;

                }


                // ==================================================
                // MESSAGE SUCCÈS
                // ==================================================

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
                    "Erreur : " +
                    error.message,
                    "red"
                );


            } finally {

                saveButton.disabled =
                    false;

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

            if (
                !derniereReservationId
            ) {

                afficherMessage(
                    "Veuillez d'abord enregistrer une réservation.",
                    "red"
                );

                return;
            }


            pdfButton.disabled =
                true;


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
                            method: "GET",
                            credentials:
                                "same-origin"
                        }
                    );


                if (!response.ok) {

                    let erreur =
                        "Erreur lors de la génération du PDF.";


                    try {

                        const result =
                            await response.json();


                        erreur =
                            result.message ||
                            result.error ||
                            erreur;

                    } catch (e) {
                        // Réponse non JSON
                    }


                    throw new Error(
                        erreur
                    );
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
                    window.URL.createObjectURL(
                        blob
                    );


                const lien =
                    document.createElement(
                        "a"
                    );


                lien.href =
                    url;


                lien.download =
                    `reservation-${derniereReservationId}.pdf`;


                document.body.appendChild(
                    lien
                );


                lien.click();


                lien.remove();


                setTimeout(
                    () => {

                        window.URL.revokeObjectURL(
                            url
                        );

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
                    "Erreur PDF : " +
                    error.message,
                    "red"
                );


            } finally {

                pdfButton.disabled =
                    false;

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
        document.getElementById(
            inputId
        );


    const suggestions =
        document.getElementById(
            suggestionsId
        );


    if (
        !input ||
        !suggestions
    ) {
        return;
    }


    let timeout =
        null;


    // ==================================================
    // SAISIE
    // ==================================================

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

                distanceCalculeeKm =
                    null;


                if (distanceKmInput) {

                    distanceKmInput.value =
                        "";

                }


                if (prixInput) {

                    prixInput.value =
                        "";

                }

            }


            const query =
                input.value.trim();


            clearTimeout(
                timeout
            );


            if (
                query.length < 3
            ) {

                suggestions.innerHTML =
                    "";

                suggestions.style.display =
                    "none";

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


    // ==================================================
    // CLAVIER
    // ==================================================

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


            let activeIndex =
                -1;


            items.forEach(
                (item, index) => {

                    if (
                        item.classList.contains(
                            "active"
                        )
                    ) {

                        activeIndex =
                            index;

                    }

                }
            );


            if (
                event.key ===
                "ArrowDown"
            ) {

                event.preventDefault();


                activeIndex++;


                if (
                    activeIndex >=
                    items.length
                ) {

                    activeIndex =
                        0;

                }


                activerSuggestion(
                    items,
                    activeIndex
                );

            }


            if (
                event.key ===
                "ArrowUp"
            ) {

                event.preventDefault();


                activeIndex--;


                if (
                    activeIndex < 0
                ) {

                    activeIndex =
                        items.length - 1;

                }


                activerSuggestion(
                    items,
                    activeIndex
                );

            }


            if (
                event.key ===
                "Enter"
            ) {

                if (
                    activeIndex >= 0
                ) {

                    event.preventDefault();


                    items[
                        activeIndex
                    ].click();

                }

            }


            if (
                event.key ===
                "Escape"
            ) {

                suggestions.innerHTML =
                    "";

                suggestions.style.display =
                    "none";

            }

        }
    );


    // ==================================================
    // CLIC EN DEHORS
    // ==================================================

    document.addEventListener(
        "click",
        (event) => {

            if (
                !input.contains(
                    event.target
                ) &&
                !suggestions.contains(
                    event.target
                )
            ) {

                suggestions.innerHTML =
                    "";

                suggestions.style.display =
                    "none";

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
            encodeURIComponent(
                query
            ) +
            "&limit=6" +
            "&autocomplete=1";


        const response =
            await fetch(
                url
            );


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


        suggestions.innerHTML =
            "";

        suggestions.style.display =
            "none";

    }

}


// ==================================================
// AFFICHER LES SUGGESTIONS D'ADRESSES
// ==================================================

function afficherSuggestionsAdresse(
    features,
    input,
    suggestions
) {

    suggestions.innerHTML =
        "";


    if (
        !features.length
    ) {

        suggestions.style.display =
            "none";

        return;

    }


    features.forEach(
        (feature) => {

            const properties =
                feature.properties ||
                {};


            const label =
                properties.label ||
                "";


            const postcode =
                properties.postcode ||
                "";


            const city =
                properties.city ||
                "";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "address-suggestion";


            const strong =
                document.createElement(
                    "strong"
                );


            strong.textContent =
                label;


            const small =
                document.createElement(
                    "small"
                );


            if (
                postcode ||
                city
            ) {

                small.textContent =
                    `${postcode} ${city}`.trim();

            }


            div.appendChild(
                strong
            );


            if (
                postcode ||
                city
            ) {

                div.appendChild(
                    small
                );

            }


            div.addEventListener(
                "click",
                () => {

                    input.value =
                        label;


                    input.dataset.label =
                        label;


                    input.dataset.postcode =
                        postcode;


                    input.dataset.city =
                        city;


                    const coordinates =
                        feature.geometry
                            ?.coordinates;


                    if (
                        coordinates &&
                        coordinates.length >= 2
                    ) {

                        input.dataset.longitude =
                            coordinates[0];


                        input.dataset.latitude =
                            coordinates[1];

                    }


                    suggestions.innerHTML =
                        "";


                    suggestions.style.display =
                        "none";


                    if (
                        input.id ===
                            "depart" ||
                        input.id ===
                            "destination"
                    ) {

                        calculerItineraireEtPrix();

                    }

                }
            );


            suggestions.appendChild(
                div
            );

        }
    );


    suggestions.style.display =
        "block";
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


    if (
        items[index]
    ) {

        items[index].classList.add(
            "active"
        );


        items[index].scrollIntoView({
            block: "nearest"
        });

    }

}


// ==================================================
// INITIALISATION GÉNÉRALE
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        // --------------------------------------------------
        // DATES PAR DÉFAUT
        // --------------------------------------------------

        initialiserDates();


        // --------------------------------------------------
        // AUTOCOMPLÉTION
        // --------------------------------------------------

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


        // --------------------------------------------------
        // ENTREPRISE
        // --------------------------------------------------

        await chargerEntreprise();


        // --------------------------------------------------
        // MODIFICATION SI reservationId PRÉSENT
        // --------------------------------------------------

        await chargerReservationPourModification();

    }
);


// ==================================================
// BOUTON PDF DÉSACTIVÉ AU DÉPART
// ==================================================

if (pdfButton) {

    pdfButton.disabled =
        true;

}