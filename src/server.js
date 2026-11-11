

const express = require("express");
const session = require("express-session");

// Initialise la base PostgreSQL
const db = require("./database");

const {
    PUBLIC_DIR
} = require("./config/paths");

// Routes API
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const clientsRoutes = require("./routes/clients.routes");
const entrepriseRoutes = require("./routes/entreprise.routes");
const reservationsRoutes = require("./routes/reservations.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

// Routes pages
const pagesRoutes = require("./routes/pages.routes");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;


// ============================================================
// MIDDLEWARES
// ============================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ============================================================
// SESSION
// ============================================================

app.use(
    session({
     
          secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);


// ============================================================
// DEBUG SESSION TEMPORAIRE
// ============================================================

app.use((req, res, next) => {

    console.log(
        `[SESSION] ${req.method} ${req.originalUrl} ->`,
        req.session && req.session.user
            ? req.session.user.email
            : "NON CONNECTE"
    );

    next();
});


// ============================================================
// FICHIERS STATIQUES
// ============================================================

app.use(
    express.static(PUBLIC_DIR)
);


// ============================================================
// API
// ============================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/users",
    usersRoutes
);

app.use(
    "/api/clients",
    clientsRoutes
);

app.use(
    "/api/entreprise",
    entrepriseRoutes
);

app.use(
    "/api/reservations",
    reservationsRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);


// ============================================================
// PAGES HTML
// ============================================================

app.use(
    "/",
    pagesRoutes
);


// ============================================================
// 404 API
// ============================================================

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({
            success: false,
            message: "Route API introuvable"
        });
    }
);


// ============================================================
// ERREUR GLOBALE
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Erreur serveur :",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Erreur serveur"
        });
    }
);


// ============================================================
// DEMARRAGE POSTGRESQL
// ============================================================

async function startServer() {

    try {

        // Initialisation des tables PostgreSQL
        await db.initDatabase();

        // Démarrage du serveur
        app.listen(
            PORT,
            () => {

                console.log("");
                console.log("=================================");
                console.log("      VTC MANAGER MVC");
                console.log("=================================");
                console.log(
                    `✓ Serveur : http://localhost:${PORT}`
                );
                console.log("✓ Base de données : PostgreSQL");
                console.log("=================================");
                console.log("");
            }
        );

    } catch (error) {

        console.error(
            "Erreur au démarrage du serveur :",
            error
        );

        process.exit(1);

    }
}

startServer();
