
let currentUser = null;
let users = [];

/* =========================================================
   INITIALISATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    try {
        setupEvents();

        await loadCurrentUser();

        if (!currentUser) {
            return;
        }

        await loadUsers();

    } catch (error) {
        console.error(
            "Erreur initialisation :",
            error
        );

        showGlobalError(
            error.message ||
            "Erreur lors du chargement."
        );
    }
});

/* =========================================================
   EVENEMENTS
========================================================= */

function setupEvents() {

    const createForm =
        document.getElementById("createUserForm");

    const passwordForm =
        document.getElementById("passwordForm");

    const logoutBtn =
        document.getElementById("logoutButton");

    const cancelPasswordBtn =
        document.getElementById("cancelPasswordBtn");

    const photoInput =
        document.getElementById("newUserPhoto");

    const removePhotoBtn =
        document.getElementById(
            "removeNewUserPhoto"
        );

    if (createForm) {
        createForm.addEventListener(
            "submit",
            createUser
        );
    }

    if (passwordForm) {
        passwordForm.addEventListener(
            "submit",
            changePassword
        );
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            logout
        );
    }

    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener(
            "click",
            closePasswordForm
        );
    }

    if (photoInput) {
        photoInput.addEventListener(
            "change",
            previewNewUserPhoto
        );
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener(
            "click",
            removeNewUserPhoto
        );
    }
}

/* =========================================================
   UTILISATEUR CONNECTE
========================================================= */

async function loadCurrentUser() {

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

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            throw new Error(
                "Impossible de vérifier la session."
            );
        }

        const data =
            await response.json();

        console.log(
            "Réponse /api/auth/me :",
            data
        );

        if (!data.success || !data.data) {
            window.location.href = "/login";
            return;
        }

        currentUser = data.data;

        if (currentUser.role !== "admin") {
            window.location.href = "/dashboard";
            return;
        }

        const usernameElement =
            document.getElementById(
                "currentUsername"
            );

        const emailElement =
            document.getElementById(
                "currentEmail"
            );

        const roleElement =
            document.getElementById(
                "currentRole"
            );

        const navUserName =
            document.getElementById(
                "navUserName"
            );

        if (usernameElement) {
            usernameElement.textContent =
                currentUser.nom ||
                "Utilisateur";
        }

        if (emailElement) {
            emailElement.textContent =
                currentUser.email ||
                "";
        }

        if (roleElement) {
            roleElement.textContent =
                "Administrateur";
        }

        if (navUserName) {
            navUserName.textContent =
                currentUser.nom ||
                "Utilisateur";
        }

        updateCurrentUserPhoto();
        updateNavigationUser();

    } catch (error) {

        console.error(
            "Erreur chargement utilisateur connecté :",
            error
        );

        window.location.href = "/login";
    }
}

/* =========================================================
   PHOTO UTILISATEUR CONNECTE
========================================================= */

function updateCurrentUserPhoto() {

    const avatar =
        document.getElementById(
            "profileAvatar"
        );

    if (!avatar) {
        return;
    }

    const nom =
        currentUser?.nom ||
        currentUser?.email ||
        "U";

    const initiales =
        getInitials(nom);

    if (currentUser?.photo) {

        avatar.innerHTML = `
            <img
                src="${getPhotoUrl(currentUser.photo)}"
                alt="Photo de profil"
                class="profile-photo"
            >
        `;

    } else {

        avatar.innerHTML = `
            <span id="profileInitials">
                ${escapeHtml(initiales)}
            </span>
        `;
    }
}

/* =========================================================
   PHOTO + INFOS NAVIGATION
========================================================= */

function updateNavigationUser() {

    const avatar =
        document.getElementById(
            "navUserPhoto"
        );

    if (!avatar || !currentUser) {
        return;
    }

    const nom =
        currentUser.nom ||
        currentUser.email ||
        "U";

    if (currentUser.photo) {

        avatar.src =
            getPhotoUrl(
                currentUser.photo
            );

        avatar.alt =
            `Photo de ${nom}`;

    } else {

        avatar.src =
            "/images/default-avatar.png";

        avatar.alt =
            "Profil";
    }
}

/* =========================================================
   URL PHOTO
========================================================= */

function getPhotoUrl(photo) {

    if (!photo) {
        return "/images/default-avatar.png";
    }

    const value =
        String(photo).trim();

    if (!value) {
        return "/images/default-avatar.png";
    }

    /*
     * Le backend stocke déjà une URL complète
     * du type :
     *
     * /uploads/profiles/user-xxx.jpg
     *
     * Il ne faut donc PAS rajouter
     * /uploads/profiles/.
     */

    if (
        value.startsWith("/") ||
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        return value;
    }

    /*
     * Sécurité / compatibilité si jamais
     * une ancienne donnée contient seulement
     * le nom du fichier.
     */

    return `/uploads/profiles/${encodeURIComponent(
        value
    )}`;
}

/* =========================================================
   CHARGER LES COMPTES
========================================================= */

async function loadUsers() {

    const response =
        await fetch(
            "/api/users",
            {
                credentials: "same-origin"
            }
        );

    if (response.status === 401) {
        window.location.href = "/login";
        return;
    }

    if (response.status === 403) {
        showGlobalError(
            "Accès réservé aux administrateurs."
        );
        return;
    }

    if (!response.ok) {

        const data =
            await response
                .json()
                .catch(() => ({}));

        throw new Error(
            data.message ||
            data.error ||
            "Impossible de charger les comptes."
        );
    }

    const data =
        await response.json();

    users =
        Array.isArray(data.users)
            ? data.users
            : [];

    renderUsers();
}

/* =========================================================
   AFFICHER LES COMPTES
========================================================= */

function renderUsers() {

    const tbody =
        document.getElementById(
            "accountsTableBody"
        );

    if (!tbody) {
        return;
    }

    if (!users.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="loading"
                >
                    Aucun compte utilisateur.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        users
            .map((user) => {

                const nom =
                    user.nom ||
                    "Sans nom";

                const email =
                    user.email ||
                    "Sans email";

                const role =
                    user.role === "admin"
                        ? "Administrateur"
                        : "Utilisateur";

                const roleClass =
                    user.role === "admin"
                        ? "badge-admin"
                        : "badge-user";

                const actif =
                    Number(user.actif) === 1;

                const statusClass =
                    actif
                        ? "badge-active"
                        : "badge-inactive";

                const statusText =
                    actif
                        ? "Actif"
                        : "Désactivé";

                const date =
                    formatDate(
                        user.created_at
                    );

                const isCurrentUser =
                    currentUser &&
                    Number(user.id) ===
                        Number(currentUser.id);

                let avatarHtml;

                if (user.photo) {

                    avatarHtml = `
                        <img
                            src="${getPhotoUrl(user.photo)}"
                            alt="Photo de ${escapeHtml(nom)}"
                            class="account-avatar-image"
                            onerror="this.onerror=null;this.src='/images/default-avatar.png';"
                        >
                    `;

                } else {

                    avatarHtml = `
                        <div class="account-avatar">
                            ${escapeHtml(
                                getInitials(nom)
                            )}
                        </div>
                    `;
                }

                return `
                    <tr>

                        <td>

                            <div class="account-user-cell">

                                ${avatarHtml}

                                <div>

                                    <strong>
                                        ${escapeHtml(nom)}
                                    </strong>

                                    <br>

                                    <span class="account-email">
                                        ${escapeHtml(email)}
                                    </span>

                                    ${
                                        isCurrentUser
                                            ? `
                                                <span class="badge badge-admin">
                                                    Vous
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>

                        </td>

                        <td>

                            <span class="badge ${roleClass}">
                                ${role}
                            </span>

                        </td>

                        <td>

                            <span class="badge ${statusClass}">
                                ${statusText}
                            </span>

                        </td>

                        <td>
                            ${escapeHtml(date)}
                        </td>

                        <td>

                            <div class="table-actions">

                                <button
                                    type="button"
                                    class="table-button blue"
                                    onclick="openPasswordForm(${Number(
                                        user.id
                                    )})"
                                >
                                    Mot de passe
                                </button>

                                ${
                                    !isCurrentUser
                                        ? `
                                            <button
                                                type="button"
                                                class="table-button orange"
                                                onclick="toggleUser(${Number(
                                                    user.id
                                                )})"
                                            >
                                                ${
                                                    actif
                                                        ? "Désactiver"
                                                        : "Activer"
                                                }
                                            </button>
                                        `
                                        : ""
                                }

                                ${
                                    !isCurrentUser
                                        ? `
                                            <button
                                                type="button"
                                                class="table-button red"
                                                onclick="deleteUser(${Number(
                                                    user.id
                                                )})"
                                            >
                                                Supprimer
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                        </td>

                    </tr>
                `;
            })
            .join("");
}

/* =========================================================
   APERCU PHOTO NOUVEL UTILISATEUR
========================================================= */

function previewNewUserPhoto(event) {

    const file =
        event.target.files[0];

    const previewContainer =
        document.getElementById(
            "newUserPhotoPreviewContainer"
        );

    const preview =
        document.getElementById(
            "newUserPhotoPreview"
        );

    if (!file) {

        if (previewContainer) {
            previewContainer.style.display =
                "none";
        }

        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        alert(
            "La photo doit être au format JPG, PNG ou WEBP."
        );

        event.target.value = "";

        if (previewContainer) {
            previewContainer.style.display =
                "none";
        }

        return;
    }

    if (file.size > 5 * 1024 * 1024) {

        alert(
            "La photo ne doit pas dépasser 5 Mo."
        );

        event.target.value = "";

        if (previewContainer) {
            previewContainer.style.display =
                "none";
        }

        return;
    }

    const reader =
        new FileReader();

    reader.onload = function () {

        if (preview) {
            preview.src =
                reader.result;
        }

        if (previewContainer) {
            previewContainer.style.display =
                "flex";
        }
    };

    reader.readAsDataURL(file);
}

/* =========================================================
   SUPPRIMER PHOTO SELECTIONNEE
========================================================= */

function removeNewUserPhoto() {

    const photoInput =
        document.getElementById(
            "newUserPhoto"
        );

    const previewContainer =
        document.getElementById(
            "newUserPhotoPreviewContainer"
        );

    const preview =
        document.getElementById(
            "newUserPhotoPreview"
        );

    if (photoInput) {
        photoInput.value = "";
    }

    if (preview) {
        preview.src = "";
    }

    if (previewContainer) {
        previewContainer.style.display =
            "none";
    }
}

/* =========================================================
   CREER UN UTILISATEUR
========================================================= */

async function createUser(event) {

    event.preventDefault();

    const message =
        document.getElementById(
            "createMessage"
        );

    const nomElement =
        document.getElementById(
            "newUserName"
        );

    const emailElement =
        document.getElementById(
            "newUserEmail"
        );

    const passwordElement =
        document.getElementById(
            "newUserPassword"
        );

    const roleElement =
        document.getElementById(
            "newUserRole"
        );

    const photoInput =
        document.getElementById(
            "newUserPhoto"
        );

    const nom =
        nomElement
            ? nomElement.value.trim()
            : "";

    const email =
        emailElement
            ? emailElement.value.trim()
            : "";

    const password =
        passwordElement
            ? passwordElement.value
            : "";

    const role =
        roleElement
            ? roleElement.value
            : "user";

    const photo =
        photoInput &&
        photoInput.files.length > 0
            ? photoInput.files[0]
            : null;

    if (message) {

        message.className =
            "message";

        message.textContent =
            "Création du compte en cours...";
    }

    if (!nom) {

        showMessage(
            message,
            "Veuillez saisir le nom de l'utilisateur.",
            "error"
        );

        return;
    }

    if (!email) {

        showMessage(
            message,
            "Veuillez saisir une adresse email.",
            "error"
        );

        return;
    }

    if (!isValidEmail(email)) {

        showMessage(
            message,
            "Veuillez saisir une adresse email valide.",
            "error"
        );

        return;
    }

    if (
        !password ||
        password.length < 8
    ) {

        showMessage(
            message,
            "Le mot de passe doit contenir au moins 8 caractères.",
            "error"
        );

        return;
    }

    if (
        !["user", "admin"].includes(role)
    ) {

        showMessage(
            message,
            "Type de compte invalide.",
            "error"
        );

        return;
    }

    if (photo) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (
            !allowedTypes.includes(
                photo.type
            )
        ) {

            showMessage(
                message,
                "La photo doit être au format JPG, PNG ou WEBP.",
                "error"
            );

            return;
        }

        if (
            photo.size >
            5 * 1024 * 1024
        ) {

            showMessage(
                message,
                "La photo ne doit pas dépasser 5 Mo.",
                "error"
            );

            return;
        }
    }

    try {

        const formData =
            new FormData();

        formData.append(
            "nom",
            nom
        );

        formData.append(
            "email",
            email
        );

        formData.append(
            "password",
            password
        );

        formData.append(
            "role",
            role
        );

        if (photo) {

            formData.append(
                "photo",
                photo
            );
        }

        const response =
            await fetch(
                "/api/users",
                {
                    method: "POST",
                    credentials: "same-origin",
                    body: formData
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (response.status === 401) {

            window.location.href =
                "/login";

            return;
        }

        if (response.status === 403) {

            throw new Error(
                "Accès réservé aux administrateurs."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Impossible de créer le compte."
            );
        }

        showMessage(
            message,
            photo
                ? "Le compte et la photo ont été créés avec succès."
                : "Le compte a été créé avec succès.",
            "success"
        );

        const form =
            document.getElementById(
                "createUserForm"
            );

        if (form) {
            form.reset();
        }

        removeNewUserPhoto();

        await loadUsers();

    } catch (error) {

        console.error(
            "Erreur création utilisateur :",
            error
        );

        showMessage(
            message,
            error.message ||
            "Une erreur est survenue lors de la création du compte.",
            "error"
        );
    }
}

/* =========================================================
   ACTIVER / DESACTIVER
========================================================= */

async function toggleUser(userId) {

    const user =
        users.find(
            (item) =>
                Number(item.id) ===
                Number(userId)
        );

    if (!user) {
        return;
    }

    const actif =
        Number(user.actif) === 1;

    const action =
        actif
            ? "désactiver"
            : "activer";

    const nom =
        user.nom ||
        user.email ||
        "cet utilisateur";

    const confirmed =
        confirm(
            `Voulez-vous ${action} le compte "${nom}" ?`
        );

    if (!confirmed) {
        return;
    }

    try {

        /*
         * Le backend update() attend actuellement
         * également le nom et l'email.
         *
         * On envoie donc les informations complètes.
         */

        const response =
            await fetch(
                `/api/users/${encodeURIComponent(
                    userId
                )}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "same-origin",

                    body: JSON.stringify({
                        nom: user.nom,
                        email: user.email,
                        role: user.role,
                        actif:
                            actif
                                ? 0
                                : 1
                    })
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Impossible de modifier le compte."
            );
        }

        await loadUsers();

    } catch (error) {

        console.error(
            "Erreur activation/désactivation :",
            error
        );

        alert(
            error.message ||
            "Une erreur est survenue."
        );
    }
}

/* =========================================================
   SUPPRIMER
========================================================= */

async function deleteUser(userId) {

    const user =
        users.find(
            (item) =>
                Number(item.id) ===
                Number(userId)
        );

    if (!user) {
        return;
    }

    const nom =
        user.nom ||
        user.email ||
        "cet utilisateur";

    const confirmed =
        confirm(
            `Voulez-vous vraiment supprimer le compte "${nom}" ?\n\nCette action est définitive.`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/users/${encodeURIComponent(
                    userId
                )}`,
                {
                    method: "DELETE",
                    credentials:
                        "same-origin"
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Impossible de supprimer le compte."
            );
        }

        await loadUsers();

    } catch (error) {

        console.error(
            "Erreur suppression :",
            error
        );

        alert(
            error.message ||
            "Une erreur est survenue."
        );
    }
}

/* =========================================================
   OUVRIR MOT DE PASSE
========================================================= */

function openPasswordForm(userId) {

    const user =
        users.find(
            (item) =>
                Number(item.id) ===
                Number(userId)
        );

    if (!user) {
        return;
    }

    const section =
        document.getElementById(
            "passwordSection"
        );

    const userIdInput =
        document.getElementById(
            "passwordUserId"
        );

    const username =
        document.getElementById(
            "passwordUsername"
        );

    const password =
        document.getElementById(
            "newPassword"
        );

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        );

    const message =
        document.getElementById(
            "passwordMessage"
        );

    if (section) {
        section.style.display =
            "block";
    }

    if (userIdInput) {
        userIdInput.value =
            user.id;
    }

    if (username) {
        username.textContent =
            user.nom ||
            user.email ||
            "-";
    }

    if (password) {
        password.value = "";
    }

    if (confirmPassword) {
        confirmPassword.value = "";
    }

    if (message) {
        message.className =
            "message";

        message.textContent = "";
    }

    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* =========================================================
   FERMER MOT DE PASSE
========================================================= */

function closePasswordForm() {

    const section =
        document.getElementById(
            "passwordSection"
        );

    if (section) {
        section.style.display =
            "none";
    }

    const form =
        document.getElementById(
            "passwordForm"
        );

    if (form) {
        form.reset();
    }

    const message =
        document.getElementById(
            "passwordMessage"
        );

    if (message) {

        message.className =
            "message";

        message.textContent = "";
    }
}

/* =========================================================
   CHANGER MOT DE PASSE
========================================================= */

async function changePassword(event) {

    event.preventDefault();

    const userId =
        document.getElementById(
            "passwordUserId"
        )?.value;

    const password =
        document.getElementById(
            "newPassword"
        )?.value || "";

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        )?.value || "";

    const message =
        document.getElementById(
            "passwordMessage"
        );

    if (!userId) {

        showMessage(
            message,
            "Utilisateur invalide.",
            "error"
        );

        return;
    }

    if (password.length < 8) {

        showMessage(
            message,
            "Le mot de passe doit contenir au moins 8 caractères.",
            "error"
        );

        return;
    }

    if (
        password !==
        confirmPassword
    ) {

        showMessage(
            message,
            "Les deux mots de passe sont différents.",
            "error"
        );

        return;
    }

    try {

        /*
         * La route backend est :
         * PUT /api/users/:id/password
         */

        const response =
            await fetch(
                `/api/users/${encodeURIComponent(
                    userId
                )}/password`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "same-origin",

                    body: JSON.stringify({
                        newPassword:
                            password
                    })
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (
            response.status === 401
        ) {

            window.location.href =
                "/login";

            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Impossible de modifier le mot de passe."
            );
        }

        showMessage(
            message,
            "Mot de passe modifié avec succès.",
            "success"
        );

        const form =
            document.getElementById(
                "passwordForm"
            );

        if (form) {
            form.reset();
        }

        setTimeout(() => {
            closePasswordForm();
        }, 1200);

    } catch (error) {

        console.error(
            "Erreur modification mot de passe :",
            error
        );

        showMessage(
            message,
            error.message ||
            "Une erreur est survenue.",
            "error"
        );
    }
}

/* =========================================================
   DECONNEXION
========================================================= */

async function logout() {

    try {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST",
                credentials:
                    "same-origin"
            }
        );

    } catch (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );

    } finally {

        window.location.href =
            "/login";
    }
}

/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    element,
    message,
    type
) {

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `message ${type}`;
}

/* =========================================================
   ERREUR GENERALE
========================================================= */

function showGlobalError(message) {

    const tbody =
        document.getElementById(
            "accountsTableBody"
        );

    if (tbody) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="loading"
                >
                    ${escapeHtml(
                        message ||
                        "Une erreur est survenue."
                    )}
                </td>
            </tr>
        `;
    }
}

/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            String(value).replace(
                " ",
                "T"
            )
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}

/* =========================================================
   INITIALES
========================================================= */

function getInitials(value) {

    const text =
        String(
            value || ""
        ).trim();

    if (!text) {
        return "U";
    }

    const parts =
        text
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0].charAt(0) +
        parts[
            parts.length - 1
        ].charAt(0)
    ).toUpperCase();
}

/* =========================================================
   VALIDATION EMAIL
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

/* =========================================================
   SECURITE AFFICHAGE
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

/* =========================================================
   EXPORT POUR LES BOUTONS HTML
========================================================= */

window.openPasswordForm =
    openPasswordForm;

window.toggleUser =
    toggleUser;

window.deleteUser =
    deleteUser;