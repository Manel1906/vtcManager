
"use strict";

// ============================================================
// ÉLÉMENTS DU DOM
// ============================================================

const todayCount = document.getElementById("todayCount");
const upcomingCount = document.getElementById("upcomingCount");
const completedCount = document.getElementById("completedCount");
const monthlyRevenue = document.getElementById("monthlyRevenue");

const reservationsContainer =
    document.getElementById("reservationsContainer");

const refreshButton = document.getElementById("refreshButton");
const navUserName = document.getElementById("navUserName");
const navUserPhoto = document.getElementById("navUserPhoto");
const logoutButton = document.getElementById("logoutButton");
const comptesNavLink = document.getElementById("comptesNavLink");

const adminReservationFilters =
    document.getElementById("adminReservationFilters");

const reservationUserFilter =
    document.getElementById("reservationUserFilter");

// ============================================================
// ÉTAT
// ============================================================

let utilisateurConnecte = null;
let chargementEnCours = false;

// ============================================================
// UTILITAIRES
// ============================================================

function formaterDate(date) {
    if (!date) return "-";

    const valeur = String(date).trim();
    const correspondance = valeur.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (correspondance) {
        return `${correspondance[3]}/${correspondance[2]}/${correspondance[1]}`;
    }

    return valeur;
}

function formaterPrix(prix) {
    return (
        (Number(prix) || 0).toLocaleString("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " €"
    );
}

function echapperHTML(valeur) {
    return String(valeur ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function estAdministrateur(user) {
    return String(user?.role || "").trim().toLowerCase() === "admin";
}

// Les dates YYYY-MM-DD et heures HH:MM se trient directement
// dans l'ordre chronologique sous forme de chaînes.
function comparerReservations(a, b) {
    const dateA = String(a.date_prise_en_charge || "");
    const dateB = String(b.date_prise_en_charge || "");

    const comparaisonDate = dateA.localeCompare(dateB);

    if (comparaisonDate !== 0) {
        return comparaisonDate;
    }

    const heureA = String(a.heure_prise_en_charge || "00:00");
    const heureB = String(b.heure_prise_en_charge || "00:00");

    const comparaisonHeure = heureA.localeCompare(heureB);

    if (comparaisonHeure !== 0) {
        return comparaisonHeure;
    }

    return Number(a.id || 0) - Number(b.id || 0);
}

function afficherFiltreAdministrateur(isAdmin) {
    if (adminReservationFilters) {
        adminReservationFilters.style.display =
            isAdmin ? "flex" : "none";
    }

    if (comptesNavLink) {
        comptesNavLink.style.display =
            isAdmin ? "" : "none";
    }

    if (!isAdmin && reservationUserFilter) {
        reservationUserFilter.value = "";
    }
}

// ============================================================
// AFFICHAGE DES ERREURS
// ============================================================

function afficherErreur(message) {
    if (!reservationsContainer) return;

    const bloc = document.createElement("div");
    bloc.className = "dashboard-error";

    const paragraphe = document.createElement("p");
    paragraphe.textContent = message;

    bloc.appendChild(paragraphe);
    reservationsContainer.replaceChildren(bloc);
}

// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

async function chargerUtilisateurConnecte() {
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                Accept: "application/json"
            }
        });

        if (response.status === 401) {
            window.location.replace("/login");
            return null;
        }

        if (!response.ok) {
            throw new Error(
                "Impossible de vérifier l'utilisateur connecté."
            );
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error(
                "Réponse invalide du serveur d'authentification."
            );
        }

        const user = result.data;
        utilisateurConnecte = user;

        if (navUserName) {
            navUserName.textContent =
                user.nom || user.email || "Utilisateur";
        }

        if (navUserPhoto) {
            if (user.photo) {
                navUserPhoto.src = user.photo.startsWith("/")
                    ? user.photo
                    : `/uploads/profiles/${user.photo}`;

                navUserPhoto.style.display = "block";
            } else {
                navUserPhoto.style.display = "none";
            }
        }

        const isAdmin = estAdministrateur(user);

        afficherFiltreAdministrateur(isAdmin);

        console.log("Utilisateur connecté :", user);
        console.log("Rôle détecté :", user.role);
        console.log("Administrateur :", isAdmin);

        return user;

    } catch (error) {
        console.error(
            "Erreur de vérification de l'utilisateur :",
            error
        );

        afficherErreur(
            "Impossible de vérifier la session. Actualisez la page."
        );

        return null;
    }
}

// ============================================================
// FILTRE DES COMPTES — ADMIN UNIQUEMENT
// ============================================================

function remplirFiltreComptes(users) {
    if (!reservationUserFilter) return;

    const ancienneValeur = reservationUserFilter.value;

    reservationUserFilter.replaceChildren();

    const optionTous = document.createElement("option");
    optionTous.value = "";
    optionTous.textContent = "Tous les comptes";

    reservationUserFilter.appendChild(optionTous);

    users.forEach(user => {
        if (user.id === undefined || user.id === null) return;

        const option = document.createElement("option");

        option.value = String(user.id);
        option.textContent =
            `${user.nom || "Sans nom"} — ${user.email || ""}`;

        reservationUserFilter.appendChild(option);
    });

    const valeurExiste = Array.from(
        reservationUserFilter.options
    ).some(option => option.value === ancienneValeur);

    reservationUserFilter.value = valeurExiste
        ? ancienneValeur
        : "";
}

// ============================================================
// CHARGEMENT DU DASHBOARD
// ============================================================

async function chargerDashboard() {
    if (chargementEnCours) return;

    chargementEnCours = true;

    if (refreshButton) {
        refreshButton.disabled = true;
    }

    if (reservationUserFilter) {
        reservationUserFilter.disabled = true;
    }

    try {
        const params = new URLSearchParams();

        // Seul l'administrateur peut demander un autre compte.
        if (
            estAdministrateur(utilisateurConnecte) &&
            reservationUserFilter?.value
        ) {
            params.set("userId", reservationUserFilter.value);
        }

        const query = params.toString();

        const url = query
            ? `/api/dashboard?${query}`
            : "/api/dashboard";

        const response = await fetch(url, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                Accept: "application/json"
            }
        });

        if (response.status === 401) {
            window.location.replace("/login");
            return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Impossible de charger le tableau de bord."
            );
        }

        const data = result.data || {};
        const stats = data.stats || {};

        // Liste des comptes réservée à l'administrateur.
        if (
            estAdministrateur(utilisateurConnecte) &&
            Array.isArray(data.users)
        ) {
            remplirFiltreComptes(data.users);
        }

        // Statistiques.
        if (todayCount) {
            todayCount.textContent = Number(stats.today) || 0;
        }

        if (upcomingCount) {
            upcomingCount.textContent = Number(stats.upcoming) || 0;
        }

        if (completedCount) {
            completedCount.textContent = Number(stats.completed) || 0;
        }

        if (monthlyRevenue) {
            monthlyRevenue.textContent =
                formaterPrix(stats.monthlyRevenue);
        }

        // Le serveur renvoie uniquement les réservations à venir.
        const reservationsSource = Array.isArray(data.reservations)
            ? data.reservations
            : [];

        const reservationsAVenir = [...reservationsSource]
            .sort(comparerReservations);

        afficherReservations(
            reservationsAVenir,
            estAdministrateur(utilisateurConnecte)
        );

    } catch (error) {
        console.error("Erreur chargement dashboard :", error);

        afficherErreur(
            error.message || "Une erreur inconnue est survenue."
        );

    } finally {
        chargementEnCours = false;

        if (refreshButton) {
            refreshButton.disabled = false;
        }

        if (reservationUserFilter) {
            reservationUserFilter.disabled = false;
        }
    }
}

// ============================================================
// AFFICHAGE DES RÉSERVATIONS
// ============================================================

function afficherReservations(reservations, isAdmin = false) {
    if (!reservationsContainer) return;

    if (!Array.isArray(reservations) || reservations.length === 0) {
        const bloc = document.createElement("div");
        bloc.className = "no-reservations";

        const texte = document.createElement("p");
        texte.textContent =
            "Aucune réservation à venir pour ce filtre.";

        bloc.appendChild(texte);
        reservationsContainer.replaceChildren(bloc);
        return;
    }

    const enteteCompte = isAdmin
        ? "<div>Compte utilisateur</div>"
        : "";

    const lignes = reservations.map(reservation => {
        const compte = isAdmin
            ? `
                <div class="dashboard-reservation-account">
                    <strong>${echapperHTML(
                        reservation.compte_nom || "Compte inconnu"
                    )}</strong>
                    <small>${echapperHTML(
                        reservation.compte_email || ""
                    )}</small>
                </div>
              `
            : "";

        const id = Number(reservation.id);

        const boutonPdf =
            Number.isInteger(id) && id > 0
                ? `
                    <div class="dashboard-reservation-action">
                        <a
                            href="/api/reservations/${id}/pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="pdf-button"
                        >PDF</a>
                    </div>
                  `
                : `
                    <div class="dashboard-reservation-action">-</div>
                  `;

        return `
            <div class="dashboard-reservation-row ${
                isAdmin ? "admin-reservation-row" : ""
            }">
                ${compte}

                <div class="dashboard-reservation-date">
                    <strong>${echapperHTML(
                        formaterDate(reservation.date_prise_en_charge)
                    )}</strong>
                    <small>${echapperHTML(
                        reservation.heure_prise_en_charge || "-"
                    )}</small>
                </div>

                <div class="dashboard-reservation-client">
                    ${echapperHTML(
                        reservation.client_nom || "Client non renseigné"
                    )}
                </div>

                <div class="dashboard-reservation-address">
                    ${echapperHTML(reservation.depart || "-")}
                </div>

                <div class="dashboard-reservation-address">
                    ${echapperHTML(reservation.destination || "-")}
                </div>

                <div class="dashboard-reservation-passenger">
                    ${echapperHTML(reservation.passager || "-")}
                </div>

                <div class="dashboard-reservation-price">
                    ${echapperHTML(formaterPrix(reservation.prix_ttc))}
                </div>

                ${boutonPdf}
            </div>
        `;
    }).join("");

    reservationsContainer.innerHTML = `
        <div class="dashboard-reservations-table ${
            isAdmin ? "admin-dashboard-table" : ""
        }">
            <div class="dashboard-reservations-header">
                ${enteteCompte}
                <div>Date</div>
                <div>Client</div>
                <div>Départ</div>
                <div>Destination</div>
                <div>Passager</div>
                <div>Prix</div>
                <div>PDF</div>
            </div>

            <div class="dashboard-reservations-body">
                ${lignes}
            </div>
        </div>

        <p class="reservations-total">
            ${reservations.length} réservation(s) à venir affichée(s)
        </p>
    `;
}

// ============================================================
// DÉCONNEXION
// ============================================================

async function deconnecter() {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            console.error(
                "Le serveur n'a pas confirmé la déconnexion."
            );
        }

    } catch (error) {
        console.error("Erreur déconnexion :", error);

    } finally {
        window.location.replace("/login");
    }
}

// ============================================================
// ÉVÉNEMENTS
// ============================================================

if (refreshButton) {
    refreshButton.addEventListener("click", chargerDashboard);
}

if (reservationUserFilter) {
    reservationUserFilter.addEventListener(
        "change",
        chargerDashboard
    );
}

if (logoutButton) {
    logoutButton.addEventListener("click", deconnecter);
}

// ============================================================
// INITIALISATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    afficherFiltreAdministrateur(false);

    const user = await chargerUtilisateurConnecte();

    if (!user) return;

    await chargerDashboard();
});
