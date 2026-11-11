const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const { PUBLIC_DIR } = require("../config/paths");

// ============================================================
// DOSSIER PDF
// ============================================================

const PDF_DIRECTORY = path.join(PUBLIC_DIR, "pdf");

// ============================================================
// GÉNÉRATION DU PDF
// ============================================================

function genererPDF(
    reservation,
    client = {},
    entreprise = {},
    outputPath = null
) {
    return new Promise((resolve, reject) => {
        try {
            const data = reservation || {};

            client = client || {};
            entreprise = entreprise || {};

            // ========================================================
            // NORMALISATION DES DONNÉES SQLITE
            // ========================================================

            const dateReservation =
                data.dateReservation ??
                data.date_reservation ??
                "";

            const heureReservation =
                data.heureReservation ??
                data.heure_reservation ??
                "";

            const datePrise =
                data.datePrise ??
                data.date_prise_en_charge ??
                "";

            const heurePrise =
                data.heurePrise ??
                data.heure_prise_en_charge ??
                "";

            const depart =
                data.depart ?? "";

            const destination =
                data.destination ?? "";

            const passager =
                data.passager ?? "";

            const prix =
                data.prix ??
                data.prix_ttc ??
                0;

            const paiement =
                data.paiement ??
                data.mode_reglement ??
                "";

            // ========================================================
            // CRÉATION DU DOSSIER PDF
            // ========================================================

            if (!fs.existsSync(PDF_DIRECTORY)) {
                fs.mkdirSync(PDF_DIRECTORY, {
                    recursive: true
                });
            }

            // ========================================================
            // CHEMIN DU PDF
            // ========================================================

            let finalOutputPath = outputPath;

            if (
                !finalOutputPath ||
                typeof finalOutputPath !== "string"
            ) {
                const reservationId =
                    data.id ||
                    data.reservation_id ||
                    Date.now();

                finalOutputPath = path.join(
                    PDF_DIRECTORY,
                    `reservation-${reservationId}.pdf`
                );
            }

            const outputDirectory =
                path.dirname(finalOutputPath);

            if (!fs.existsSync(outputDirectory)) {
                fs.mkdirSync(outputDirectory, {
                    recursive: true
                });
            }

            console.log("========================================");
            console.log(">>> GÉNÉRATION DU PDF");
            console.log(
                ">>> Réservation ID :",
                data.id || "inconnu"
            );
            console.log(
                ">>> Dossier PDF :",
                PDF_DIRECTORY
            );
            console.log(
                ">>> Fichier PDF :",
                finalOutputPath
            );
            console.log("========================================");

            // ========================================================
            // DOCUMENT PDF
            // ========================================================

            const doc = new PDFDocument({
                size: "A4",
                margin: 30,
                info: {
                    Title: "Bon de réservation VTC",
                    Author:
                        entreprise.nom ||
                        "Entreprise VTC"
                }
            });

            const stream =
                fs.createWriteStream(finalOutputPath);

            stream.on("error", (error) => {
                console.error(
                    ">>> ERREUR ÉCRITURE PDF :",
                    error
                );

                reject(error);
            });

            stream.on("finish", () => {
                console.log(
                    ">>> PDF TERMINÉ :",
                    finalOutputPath
                );

                console.log(
                    ">>> FICHIER EXISTE :",
                    fs.existsSync(finalOutputPath)
                );

                resolve(finalOutputPath);
            });

            doc.pipe(stream);

            // ========================================================
            // COULEURS
            // ========================================================

            const BLEU = "#1F4E78";
            const BLEU_CLAIR = "#EAF2F8";
            const BLEU_TRES_CLAIR = "#F5F9FC";
            const GRIS = "#555555";
            const GRIS_CLAIR = "#D9E2E8";

            // ========================================================
            // EN-TÊTE
            // ========================================================

            doc
                .roundedRect(
                    30,
                    25,
                    535,
                    65,
                    6
                )
                .fill(BLEU);

            doc
                .font("Helvetica-Bold")
                .fontSize(17)
                .fillColor("#FFFFFF")
                .text(
                    "BON DE RÉSERVATION VTC",
                    40,
                    39,
                    {
                        width: 515,
                        align: "center"
                    }
                );

            doc
                .font("Helvetica")
                .fontSize(8)
                .fillColor("#EAF2F8")
                .text(
                    "Course effectuée sur réservation préalable uniquement",
                    40,
                    63,
                    {
                        width: 515,
                        align: "center"
                    }
                );

            doc.fillColor("#000000");
            doc.y = 105;

            // ========================================================
            // 1. INFORMATIONS GÉNÉRALES
            // ========================================================

            sectionTitle(
                doc,
                "1. INFORMATIONS GÉNÉRALES",
                BLEU
            );

            const infoY = doc.y;

            // ========================================================
            // BLOC ENTREPRISE
            // ========================================================

            doc
                .roundedRect(
                    30,
                    infoY,
                    260,
                    170,
                    5
                )
                .fillAndStroke(
                    BLEU_TRES_CLAIR,
                    GRIS_CLAIR
                );

            // ========================================================
            // BLOC CLIENT
            // ========================================================

            doc
                .roundedRect(
                    305,
                    infoY,
                    260,
                    170,
                    5
                )
                .fillAndStroke(
                    BLEU_TRES_CLAIR,
                    GRIS_CLAIR
                );

            // ========================================================
            // BANDEAU ENTREPRISE
            // ========================================================

            doc
                .roundedRect(
                    30,
                    infoY,
                    260,
                    29,
                    5
                )
                .fill(BLEU_CLAIR);

            // ========================================================
            // BANDEAU CLIENT
            // ========================================================

            doc
                .roundedRect(
                    305,
                    infoY,
                    260,
                    29,
                    5
                )
                .fill(BLEU_CLAIR);

            // ========================================================
            // TITRE ENTREPRISE
            // ========================================================

            doc
                .font("Helvetica-Bold")
                .fontSize(8)
                .fillColor(BLEU)
                .text(
                    "ENTREPRISE DE TRANSPORT (VTC)",
                    42,
                    infoY + 10,
                    {
                        width: 235
                    }
                );

            // ========================================================
            // TITRE CLIENT
            // ========================================================

            doc
                .font("Helvetica-Bold")
                .fontSize(8)
                .fillColor(BLEU)
                .text(
                    "CLIENT / PASSAGER",
                    317,
                    infoY + 10,
                    {
                        width: 235
                    }
                );

            // ========================================================
            // ENTREPRISE
            // ========================================================

          
drawField(
    doc,
    "Nom / Raison sociale",
    entreprise.nom,
    42,
    infoY + 43,
    235
);

drawField(
    doc,
    "Adresse",
    entreprise.adresse,
    42,
    infoY + 67,
    235
);

drawField(
    doc,
    "Conducteur",
    entreprise.chauffeur,
    42,
    infoY + 91,
    235
);

drawField(
    doc,
    "Téléphone",
    entreprise.telephone,
    42,
    infoY + 115,
    235
);

drawField(
    doc,
    "SIRET",
    entreprise.siret,
    42,
    infoY + 139,
    235
);


   // ========================================================
// CLIENT
// ========================================================

drawField(
    doc,
    "Nom & Prénom",
    client.nom,
    317,
    infoY + 43,
    235
);

drawField(
    doc,
    "Téléphone",
    client.telephone,
    317,
    infoY + 67,
    235
);

/* drawField(
    doc,
    "E-mail",
    client.email,
    317,
    infoY + 91,
    235
);*/

/*drawField(
    doc,
    "Adresse",
    client.adresse,
    317,
    infoY + 115,
    235
);*/
           /* drawField(
                doc,
                "Passager",
                passager,
                317,
                infoY + 115,
                235
            );
            */

            // ========================================================
            // ESPACE APRÈS LES BLOCS
            // ========================================================

            doc.y = infoY + 190;

            // ========================================================
            // 2. DÉTAILS DE LA PRESTATION
            // ========================================================

            sectionTitle(
                doc,
                "2. DÉTAILS DE LA PRESTATION",
                BLEU
            );

            const detailsY = doc.y;

            // ========================================================
            // DATE DE RÉSERVATION
            // ========================================================

            drawValue(
                doc,
                "Date de réservation",
                formatDate(dateReservation),
                30,
                detailsY,
                260
            );

            // ========================================================
            // HEURE DE RÉSERVATION
            // ========================================================

            drawValue(
                doc,
                "Heure de réservation",
                heureReservation,
                305,
                detailsY,
                260
            );

            // ========================================================
            // DATE DE PRISE EN CHARGE
            // ========================================================

            drawValue(
                doc,
                "Date de prise en charge",
                formatDate(datePrise),
                30,
                detailsY + 45,
                260
            );

            // ========================================================
            // HEURE DE PRISE EN CHARGE
            // ========================================================

            drawValue(
                doc,
                "Heure de prise en charge",
                heurePrise,
                305,
                detailsY + 45,
                260
            );

            doc.y = detailsY + 92;

            // ========================================================
            // DÉPART
            // ========================================================

            drawTransportField(
                doc,
                "LIEU DE PRISE EN CHARGE — DÉPART",
                depart,
                BLEU
            );

            doc.y += 9;

            // ========================================================
            // DESTINATION
            // ========================================================

            drawTransportField(
                doc,
                "LIEU DE DÉPOSE — DESTINATION",
                destination,
                BLEU
            );

            doc.y += 13;

            // ========================================================
            // 3. CONDITIONS FINANCIÈRES
            // ========================================================

            sectionTitle(
                doc,
                "3. CONDITIONS FINANCIÈRES & RÈGLEMENT",
                BLEU
            );

            const financeY = doc.y;

            // ========================================================
            // PRIX
            // ========================================================

            doc
                .roundedRect(
                    30,
                    financeY,
                    260,
                    72,
                    5
                )
                .fillAndStroke(
                    BLEU_TRES_CLAIR,
                    GRIS_CLAIR
                );

            doc
                .font("Helvetica-Bold")
                .fontSize(8)
                .fillColor(BLEU)
                .text(
                    "PRIX TOTAL DE LA COURSE",
                    44,
                    financeY + 11
                );

            const prixNumerique =
                Number(prix);

            const prixAffiche =
                Number.isFinite(prixNumerique)
                    ? prixNumerique.toFixed(2)
                    : "0.00";

            doc
                .font("Helvetica-Bold")
                .fontSize(19)
                .fillColor(BLEU)
                .text(
                    `${prixAffiche} € TTC`,
                    44,
                    financeY + 31
                );

            // ========================================================
            // MODE DE RÈGLEMENT
            // ========================================================

            doc
                .roundedRect(
                    305,
                    financeY,
                    260,
                    72,
                    5
                )
                .fillAndStroke(
                    BLEU_TRES_CLAIR,
                    GRIS_CLAIR
                );

            doc
                .font("Helvetica-Bold")
                .fontSize(8)
                .fillColor(BLEU)
                .text(
                    "MODE DE RÈGLEMENT",
                    319,
                    financeY + 11
                );

            const modes = [
                "Carte Bancaire",
                "Espèces",
                "Virement",
                "En ligne / App"
            ];

            modes.forEach((mode, index) => {
                const col = index % 2;
                const row = Math.floor(
                    index / 2
                );

                const x =
                    319 + col * 120;

                const y =
                    financeY +
                    31 +
                    row * 16;

                const coche =
                    paiement === mode
                        ? "[X]"
                        : "[ ]";

                doc
                    .font("Helvetica")
                    .fontSize(7.5)
                    .fillColor("#000000")
                    .text(
                        `${coche} ${mode}`,
                        x,
                        y,
                        {
                            width: 115
                        }
                    );
            });

            doc.y = financeY + 90;

            // ========================================================
            // MENTION
            // ========================================================

            doc
                .font("Helvetica")
                .fontSize(7.5)
                .fillColor(GRIS)
                .text(
                    "Le prix de la prestation est déterminé à l'avance lors de la réservation.",
                    30,
                    doc.y,
                    {
                        width: 535,
                        align: "center"
                    }
                );

            doc.fillColor("#000000");

            // ========================================================
            // AUCUN FOOTER
            // ========================================================
            // Le pied de page a été complètement supprimé.
            // ========================================================

            // ========================================================
            // TERMINER LE PDF
            // ========================================================

            doc.end();

        } catch (error) {
            console.error(
                "========================================"
            );

            console.error(
                ">>> ERREUR GÉNÉRATION PDF"
            );

            console.error(error);

            console.error(
                "========================================"
            );

            reject(error);
        }
    });
}

// ============================================================
// TITRE DE SECTION
// ============================================================

function sectionTitle(
    doc,
    text,
    color
) {
    const y = doc.y;

    doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(color)
        .text(
            text,
            30,
            y
        );

    doc
        .moveTo(
            30,
            y + 16
        )
        .lineTo(
            565,
            y + 16
        )
        .lineWidth(0.8)
        .strokeColor(color)
        .stroke();

    doc.fillColor("#000000");

    doc.y = y + 27;
}

// ============================================================
// CHAMP ENTREPRISE / CLIENT
// ============================================================

function drawField(
    doc,
    label,
    value,
    x,
    y,
    width
) {
    doc
        .font("Helvetica-Bold")
        .fontSize(6.8)
        .fillColor("#555555")
        .text(
            label,
            x,
            y,
            {
                width
            }
        );

    doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#000000")
        .text(
            value || "—",
            x,
            y + 9,
            {
                width,
                height: 13,
                ellipsis: true
            }
        );
}

// ============================================================
// DATE / HEURE
// ============================================================

function drawValue(
    doc,
    label,
    value,
    x,
    y,
    width
) {
    doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#555555")
        .text(
            label,
            x,
            y,
            {
                width
            }
        );

    doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#000000")
        .text(
            value || "—",
            x,
            y + 11,
            {
                width
            }
        );
}

// ============================================================
// DÉPART / DESTINATION
// ============================================================

function drawTransportField(
    doc,
    label,
    value,
    color
) {
    const y = doc.y;

    doc
        .roundedRect(
            30,
            y + 1,
            4,
            25,
            2
        )
        .fill(color);

    doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(color)
        .text(
            label,
            43,
            y,
            {
                width: 515
            }
        );

    doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#000000")
        .text(
            value || "—",
            43,
            y + 11,
            {
                width: 510,
                height: 16,
                ellipsis: true
            }
        );

    doc.y = y + 30;
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date) {
    if (!date) {
        return "";
    }

    const value = String(date);

    const parts = value.split("-");

    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return value;
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    genererPDF
};