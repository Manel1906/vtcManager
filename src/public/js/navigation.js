

console.log("=== navigation.js CHARGÉ ===");

let navigationInitialisee = false;


// ============================================================
// INITIALISATION NAVIGATION
// ============================================================

async function initialiserNavigation() {

    console.log("=== initialiserNavigation() ===");

    if (navigationInitialisee) {
        return;
    }

    navigationInitialisee = true;

    const comptesNavLink =
        document.getElementById("comptesNavLink");

    const navUserName =
        document.getElementById("navUserName");

    const navUserPhoto =
        document.getElementById("navUserPhoto");

    const logoutButton =
        document.getElementById("logoutButton");


    try {

        const response = await fetch(
            "/api/auth/me",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


        console.log(
            "Navigation /api/auth/me :",
            response.status
        );


        // ====================================================
        // PAS AUTHENTIFIÉ
        // ====================================================

        if (response.status === 401) {

            console.warn(
                "Navigation : utilisateur non authentifié."
            );

            /*
             * IMPORTANT :
             * On ne redirige pas automatiquement ici.
             *
             * La page elle-même décide quoi faire.
             */
            return;
        }


        // ====================================================
        // AUTRE ERREUR
        // ====================================================

        if (!response.ok) {

            console.error(
                "Erreur /api/auth/me :",
                response.status
            );

            return;
        }


        const result =
            await response.json();


        console.log(
            "Utilisateur navigation :",
            result
        );


        // ====================================================
        // FORMAT API STANDARD
        //
        // {
        //     success: true,
        //     data: {
        //         id,
        //         nom,
        //         email,
        //         role,
        //         photo
        //     }
        // }
        // ====================================================

        if (
            !result.success ||
            !result.data
        ) {

            console.error(
                "Réponse authentification invalide :",
                result
            );

            return;
        }


        const user =
            result.data;


        // ====================================================
        // NOM
        // ====================================================

        if (navUserName) {

            navUserName.textContent =
                user.nom ||
                user.email ||
                "Utilisateur";
        }


        // ====================================================
        // PHOTO
        // ====================================================

        if (navUserPhoto) {

            if (user.photo) {

                navUserPhoto.src =
                    user.photo.startsWith("/")
                        ? user.photo
                        : `/uploads/profiles/${user.photo}`;

                navUserPhoto.style.display =
                    "block";

            } else {

                navUserPhoto.src =
                    "/images/default-avatar.png";

                navUserPhoto.style.display =
                    "block";
            }


            navUserPhoto.alt =
                user.nom ||
                "Profil";
        }


        // ====================================================
        // ADMIN
        // ====================================================

        if (comptesNavLink) {

            comptesNavLink.style.display =
                user.role === "admin"
                    ? ""
                    : "none";
        }


        // ====================================================
        // DÉCONNEXION
        // ====================================================

        if (logoutButton) {

            logoutButton.onclick =
                async () => {

                    await deconnecter();
                };
        }


        console.log(
            "✓ Navigation initialisée pour :",
            user.email
        );


    } catch (error) {

        console.error(
            "Erreur navigation :",
            error
        );

        /*
         * Pas de redirection ici.
         *
         * Une erreur réseau n'est pas une
         * preuve que la session est absente.
         */
    }
}


// ============================================================
// DÉCONNEXION
// ============================================================

async function deconnecter() {

    try {

        const response =
            await fetch(
                "/api/auth/logout",
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        const result =
            await response.json();


        console.log(
            "Réponse logout :",
            result
        );


    } catch (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );

    } finally {

        window.location.replace(
            "/login"
        );
    }
}


// ============================================================
// DOM READY
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiserNavigation,
        { once: true }
    );

} else {

    initialiserNavigation();
}
document.addEventListener("DOMContentLoaded", () => {

    const navUserPhoto = document.getElementById("navUserPhoto");
    const modal = document.getElementById("profilePhotoModal");
    const fullPhoto = document.getElementById("profilePhotoFull");
    const closeButton = document.getElementById("closeProfilePhoto");

    if (!navUserPhoto || !modal || !fullPhoto) {
        return;
    }

    // Ouvrir la photo en grand
    navUserPhoto.addEventListener("click", () => {

        fullPhoto.src = navUserPhoto.src;

        modal.classList.add("active");

        document.body.style.overflow = "hidden";
    });


    // Fermer avec le bouton X
    if (closeButton) {

        closeButton.addEventListener("click", (event) => {

            event.stopPropagation();

            modal.classList.remove("active");

            document.body.style.overflow = "";
        });

    }


    // Fermer en cliquant sur le fond
    modal.addEventListener("click", (event) => {

        if (event.target === modal) {

            modal.classList.remove("active");

            document.body.style.overflow = "";
        }

    });


    // Fermer avec la touche Échap
    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            modal.classList.remove("active");

            document.body.style.overflow = "";
        }

    });

});