

document.addEventListener("DOMContentLoaded", () => {
    // ==================================================
    // ÉLÉMENTS HTML
    // ==================================================

    const loginSection = document.getElementById("loginSection");
    const setupSection = document.getElementById("setupSection");

    const loginForm = document.getElementById("loginForm");
    const setupForm = document.getElementById("setupForm");

    const loginMessage = document.getElementById("loginMessage");
    const setupMessage = document.getElementById("setupMessage");

    const showSetupButton = document.getElementById("showSetupButton");
    const showLoginButton = document.getElementById("showLoginButton");

    const loginButton = document.getElementById("loginButton");
    const setupButton = document.getElementById("setupButton");

    const loginInput = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const togglePassword = document.getElementById("togglePassword");

    const setupPhoto = document.getElementById("setupPhoto");
    const setupPhotoPreviewContainer =
        document.getElementById("setupPhotoPreviewContainer");
    const setupPhotoPreview =
        document.getElementById("setupPhotoPreview");
    const removeSetupPhoto =
        document.getElementById("removeSetupPhoto");

    // ==================================================
    // VÉRIFIER SI L'UTILISATEUR EST DÉJÀ CONNECTÉ
    // ==================================================

    verifierConnexion();

    // ==================================================
    // AFFICHER / MASQUER LE MOT DE PASSE
    // ==================================================

    if (togglePassword && loginPassword) {
        togglePassword.addEventListener("click", () => {
            const visible = loginPassword.type === "text";

            loginPassword.type = visible ? "password" : "text";

            togglePassword.textContent = visible ? "👁️" : "🙈";

            togglePassword.setAttribute(
                "aria-label",
                visible
                    ? "Afficher le mot de passe"
                    : "Masquer le mot de passe"
            );

            togglePassword.setAttribute(
                "aria-pressed",
                String(!visible)
            );
        });
    }

    // ==================================================
    // NAVIGATION ENTRE LES FORMULAIRES
    // ==================================================

    if (showSetupButton) {
        showSetupButton.addEventListener("click", () => {
            loginSection.classList.add("hidden");
            setupSection.classList.remove("hidden");
            effacerMessages();
        });
    }

    if (showLoginButton) {
        showLoginButton.addEventListener("click", () => {
            setupSection.classList.add("hidden");
            loginSection.classList.remove("hidden");
            effacerMessages();
        });
    }

    // ==================================================
    // MESSAGES
    // ==================================================

    function afficherMessage(element, message, type = "error") {
        if (!element) return;

        element.textContent = message;
        element.classList.remove("error", "success");
        element.classList.add(type);
    }

    function effacerMessage(element) {
        if (!element) return;

        element.textContent = "";
        element.classList.remove("error", "success");
    }

    function effacerMessages() {
        effacerMessage(loginMessage);
        effacerMessage(setupMessage);
    }

    // ==================================================
    // PHOTO DE PROFIL : APERÇU
    // ==================================================

    function supprimerPhoto() {
        if (setupPhoto) setupPhoto.value = "";
        if (setupPhotoPreview) setupPhotoPreview.src = "";

        if (setupPhotoPreviewContainer) {
            setupPhotoPreviewContainer.classList.add("hidden");
        }
    }

    if (setupPhoto) {
        setupPhoto.addEventListener("change", () => {
            const file = setupPhoto.files[0];

            effacerMessage(setupMessage);

            if (!file) {
                supprimerPhoto();
                return;
            }

            const typesAutorises = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (!typesAutorises.includes(file.type)) {
                afficherMessage(
                    setupMessage,
                    "Format non autorisé. Utilisez JPG, PNG ou WEBP.",
                    "error"
                );

                supprimerPhoto();
                return;
            }

            const tailleMaximum = 5 * 1024 * 1024;

            if (file.size > tailleMaximum) {
                afficherMessage(
                    setupMessage,
                    "La photo ne doit pas dépasser 5 Mo.",
                    "error"
                );

                supprimerPhoto();
                return;
            }

            const reader = new FileReader();

            reader.onload = event => {
                if (setupPhotoPreview) {
                    setupPhotoPreview.src = event.target.result;
                }

                if (setupPhotoPreviewContainer) {
                    setupPhotoPreviewContainer.classList.remove("hidden");
                }
            };

            reader.readAsDataURL(file);
        });
    }

    if (removeSetupPhoto) {
        removeSetupPhoto.addEventListener("click", supprimerPhoto);
    }

    // ==================================================
    // CONNEXION : LOGIN OU EMAIL
    // ==================================================

    if (loginForm) {
        loginForm.addEventListener("submit", async event => {
            event.preventDefault();

            effacerMessage(loginMessage);

            const login = loginInput.value.trim();
            const password = loginPassword.value;

            // IMPORTANT :
            // Ne pas imposer un format email ici.
            // L'identifiant peut être un login OU un email.

            if (!login || !password) {
                afficherMessage(
                    loginMessage,
                    "Veuillez saisir votre login ou votre e-mail et votre mot de passe.",
                    "error"
                );
                return;
            }

            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = "Connexion...";
            }

            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        login,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Connexion impossible."
                    );
                }

                // Vérifier que la session est bien conservée
                const meResponse = await fetch("/api/auth/me", {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    credentials: "same-origin"
                });

                const meData = await meResponse.json();

                if (
                    !meResponse.ok ||
                    !meData.success ||
                    !meData.data
                ) {
                    throw new Error(
                        "Connexion effectuée, mais la session n'est pas conservée."
                    );
                }

                afficherMessage(
                    loginMessage,
                    "Connexion réussie. Redirection...",
                    "success"
                );

                window.location.replace("/dashboard");

            } catch (error) {
                console.error("Erreur connexion :", error);

                afficherMessage(
                    loginMessage,
                    error.message ||
                        "Une erreur est survenue lors de la connexion.",
                    "error"
                );

                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = "Se connecter";
                }
            }
        });
    }

    // ==================================================
    // PREMIÈRE INSTALLATION
    // ==================================================

    if (setupForm) {
        setupForm.addEventListener("submit", async event => {
            event.preventDefault();

            effacerMessage(setupMessage);

            const nom =
                document.getElementById("setupNom").value.trim();

            const email =
                document.getElementById("setupEmail").value.trim();

            const password =
                document.getElementById("setupPassword").value;

            const passwordConfirm =
                document.getElementById("setupPasswordConfirm").value;

            const photo =
                setupPhoto && setupPhoto.files.length > 0
                    ? setupPhoto.files[0]
                    : null;

            if (!nom || !email || !password || !passwordConfirm) {
                afficherMessage(
                    setupMessage,
                    "Veuillez remplir tous les champs obligatoires.",
                    "error"
                );
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                afficherMessage(
                    setupMessage,
                    "Veuillez saisir une adresse e-mail valide.",
                    "error"
                );
                return;
            }

            if (password.length < 8) {
                afficherMessage(
                    setupMessage,
                    "Le mot de passe doit contenir au moins 8 caractères.",
                    "error"
                );
                return;
            }

            if (password !== passwordConfirm) {
                afficherMessage(
                    setupMessage,
                    "Les mots de passe ne correspondent pas.",
                    "error"
                );
                return;
            }

            if (photo) {
                const typesAutorises = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (!typesAutorises.includes(photo.type)) {
                    afficherMessage(
                        setupMessage,
                        "Format de photo non autorisé. Utilisez JPG, PNG ou WEBP.",
                        "error"
                    );
                    return;
                }

                if (photo.size > 5 * 1024 * 1024) {
                    afficherMessage(
                        setupMessage,
                        "La photo ne doit pas dépasser 5 Mo.",
                        "error"
                    );
                    return;
                }
            }

            if (setupButton) {
                setupButton.disabled = true;
                setupButton.textContent = "Création du compte...";
            }

            try {
                const formData = new FormData();

                formData.append("nom", nom);
                formData.append("email", email);
                formData.append("password", password);

                if (photo) {
                    formData.append("photo", photo);
                }

                const response = await fetch("/api/auth/setup", {
                    method: "POST",
                    credentials: "same-origin",
                    body: formData
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                            "Impossible de créer le compte administrateur."
                    );
                }

                // Connexion automatique après création
                const loginResponse = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        login: email,
                        password
                    })
                });

                const loginData = await loginResponse.json();

                if (!loginResponse.ok || !loginData.success) {
                    throw new Error(
                        loginData.message ||
                            "Compte créé, mais connexion automatique impossible."
                    );
                }

                // Confirmer la session
                const meResponse = await fetch("/api/auth/me", {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                });

                const meData = await meResponse.json();

                if (
                    !meResponse.ok ||
                    !meData.success ||
                    !meData.data
                ) {
                    throw new Error(
                        "Le compte est créé, mais la session n'est pas conservée."
                    );
                }

                window.location.replace("/dashboard");

            } catch (error) {
                console.error("Erreur première installation :", error);

                afficherMessage(
                    setupMessage,
                    error.message ||
                        "Erreur lors de la création du compte.",
                    "error"
                );

                if (setupButton) {
                    setupButton.disabled = false;
                    setupButton.textContent =
                        "Créer le compte administrateur";
                }
            }
        });
    }

    // ==================================================
    // VÉRIFIER SI DÉJÀ CONNECTÉ
    // ==================================================

    async function verifierConnexion() {
        try {
            const response = await fetch("/api/auth/me", {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) return;

            const data = await response.json();

            if (data.success && data.data) {
                window.location.replace("/dashboard");
            }

        } catch (error) {
            console.error("Erreur vérification connexion :", error);
        }
    }
});
