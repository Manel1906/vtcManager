
const db = require("../database");

exports.getStats = async (req, res) => {
  try {
    // 1. Utilisateur connecté et droits
    const userId = Number(req.session?.user?.id);
    const isAdmin =
      String(req.session?.user?.role || "").trim().toLowerCase() === "admin";

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise."
      });
    }

    // Un utilisateur normal reste toujours limité à son compte.
    let filterUserId = userId;

    if (isAdmin) {
      const requestedUserId = req.query.userId;

      if (requestedUserId !== undefined && requestedUserId !== "") {
        filterUserId = Number(requestedUserId);

        if (!Number.isInteger(filterUserId) || filterUserId <= 0) {
          return res.status(400).json({
            success: false,
            message: "Identifiant de compte invalide."
          });
        }

        const selectedUser = await db.query(
          "SELECT id FROM users WHERE id = $1",
          [filterUserId]
        );

        if (selectedUser.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Compte utilisateur introuvable."
          });
        }
      } else {
        // Admin sans filtre : tous les comptes.
        filterUserId = null;
      }
    }

    // 2. Filtre SQL commun
    const scopeSql = (column, parameterIndex) =>
      filterUserId === null
        ? ""
        : ` AND ${column} = $${parameterIndex}`;

    const scopeParams =
      filterUserId === null ? [] : [filterUserId];

    // 3. Date et heure de PostgreSQL
    const nowResult = await db.query(`
      SELECT
        TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS today,
        TO_CHAR(LOCALTIME, 'HH24:MI') AS current_time
    `);

    const { today, current_time: currentTime } = nowResult.rows[0];

    // Une heure vide est considérée comme 00:00.
    // Les formats ISO de tes dates et HH:MM de tes heures
    // permettent les comparaisons textuelles.

    // 4. Réservations du jour
    const todayResult = await db.query(`
      SELECT COUNT(*) AS total
      FROM reservations
      WHERE date_prise_en_charge = $1
      ${scopeSql("user_id", 2)}
    `, [today, ...scopeParams]);

    // 5. Réservations à venir
    const upcomingResult = await db.query(`
      SELECT COUNT(*) AS total
      FROM reservations
      WHERE date_prise_en_charge IS NOT NULL
        AND BTRIM(date_prise_en_charge) <> ''
        AND (
          date_prise_en_charge > $1
          OR (
            date_prise_en_charge = $1
            AND COALESCE(
              NULLIF(BTRIM(heure_prise_en_charge), ''),
              '00:00'
            ) >= $2
          )
        )
      ${scopeSql("user_id", 3)}
    `, [today, currentTime, ...scopeParams]);

    // 6. Réservations terminées
    const completedResult = await db.query(`
      SELECT COUNT(*) AS total
      FROM reservations
      WHERE date_prise_en_charge IS NOT NULL
        AND BTRIM(date_prise_en_charge) <> ''
        AND (
          date_prise_en_charge < $1
          OR (
            date_prise_en_charge = $1
            AND COALESCE(
              NULLIF(BTRIM(heure_prise_en_charge), ''),
              '00:00'
            ) < $2
          )
        )
      ${scopeSql("user_id", 3)}
    `, [today, currentTime, ...scopeParams]);

    // 7. Chiffre d'affaires du mois
    const monthlyRevenueResult = await db.query(`
      SELECT COALESCE(SUM(prix_ttc), 0) AS total
      FROM reservations
      WHERE LEFT(date_prise_en_charge, 7) =
            TO_CHAR(CURRENT_DATE, 'YYYY-MM')
      ${scopeSql("user_id", 1)}
    `, [...scopeParams]);

    // 8. Nombre de clients
    const clientsResult = await db.query(`
      SELECT COUNT(*) AS total
      FROM clients
      ${filterUserId === null ? "" : "WHERE user_id = $1"}
    `, [...scopeParams]);

    // 9. Nombre total de réservations
    const reservationsCountResult = await db.query(`
      SELECT COUNT(*) AS total
      FROM reservations
      WHERE 1 = 1
      ${scopeSql("user_id", 1)}
    `, [...scopeParams]);

    // 10. Chiffre d'affaires total
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(prix_ttc), 0) AS total
      FROM reservations
      WHERE 1 = 1
      ${scopeSql("user_id", 1)}
    `, [...scopeParams]);

    // 11. Liste des prochaines réservations.
    // Elle utilise exactement la même condition que le compteur.
    // ASC affiche la réservation la plus proche en premier.
    const reservationsResult = await db.query(`
      SELECT
        r.*,
        c.nom AS client_nom,
        c.telephone AS client_telephone,
        c.email AS client_email,
        c.adresse AS client_adresse,
        u.nom AS compte_nom,
        u.email AS compte_email
      FROM reservations r
      LEFT JOIN clients c
        ON c.id = r.client_id
        AND c.user_id = r.user_id
      LEFT JOIN users u
        ON u.id = r.user_id
      WHERE r.date_prise_en_charge IS NOT NULL
        AND BTRIM(r.date_prise_en_charge) <> ''
        AND (
          r.date_prise_en_charge > $1
          OR (
            r.date_prise_en_charge = $1
            AND COALESCE(
              NULLIF(BTRIM(r.heure_prise_en_charge), ''),
              '00:00'
            ) >= $2
          )
        )
      ${scopeSql("r.user_id", 3)}
      ORDER BY
        r.date_prise_en_charge ASC,
        COALESCE(
          NULLIF(BTRIM(r.heure_prise_en_charge), ''),
          '00:00'
        ) ASC,
        r.id ASC
    `, [today, currentTime, ...scopeParams]);

    // 12. Liste des comptes pour l'administrateur
    let users = [];

    if (isAdmin) {
      const usersResult = await db.query(`
        SELECT id, nom, email
        FROM users
        ORDER BY LOWER(nom) ASC
      `);

      users = usersResult.rows;
    }

    // 13. Réponse
    return res.json({
      success: true,
      data: {
        isAdmin,
        selectedUserId: filterUserId,
        users,
        stats: {
          today: Number(todayResult.rows[0].total) || 0,
          upcoming: Number(upcomingResult.rows[0].total) || 0,
          completed: Number(completedResult.rows[0].total) || 0,
          monthlyRevenue:
            Number(monthlyRevenueResult.rows[0].total) || 0,
          clients: Number(clientsResult.rows[0].total) || 0,
          reservations:
            Number(reservationsCountResult.rows[0].total) || 0,
          chiffreAffaires:
            Number(revenueResult.rows[0].total) || 0
        },
        reservations: reservationsResult.rows
      }
    });

  } catch (error) {
    console.error("Erreur statistiques dashboard :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les données du dashboard."
    });
  }
};
