// ==========================================
// MOTEUR PROFORMA (FRONT-END) - VERSION PDF
// ==========================================

let modeProforma = false;
let panierProforma = {}; 

// 1. On injecte l'interface (Bouton rouge + Panneau)
document.addEventListener("DOMContentLoaded", () => {
    const uiHTML = `
        <button id="btn-toggle-proforma" onclick="toggleModeProforma()" style="position: fixed; bottom: 20px; left: 20px; background-color: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 1000;">
            📄 Créer une Proforma
        </button>

        <div id="panneau-panier-proforma" style="display: none; position: fixed; bottom: 80px; left: 20px; width: 300px; background: white; border: 2px solid #002ab6; border-radius: 10px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 1000; max-height: 60vh; overflow-y: auto;">
            <h3 style="margin-top: 0; color: #002ab6;">🛒 Vos références</h3>
            <div id="liste-panier-proforma">
                <p style="color: gray; font-size: 0.9em;">Appuyez sur les '+' bleus pour ajouter des bières.</p>
            </div>
            <button onclick="validerProforma()" style="width: 100%; margin-top: 15px; background-color: #27ae60; color: white; border: none; padding: 10px; border-radius: 5px; font-weight: bold; cursor: pointer;">
                ✅ OK (Générer PDF)
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', uiHTML);
});

// 2. Allumer/éteindre le mode
window.toggleModeProforma = function() {
    modeProforma = !modeProforma;
    const btn = document.getElementById('btn-toggle-proforma');
    const panneau = document.getElementById('panneau-panier-proforma');
    const boutonsPlus = document.querySelectorAll('.btn-plus-proforma');

    if (modeProforma) {
        btn.style.backgroundColor = "#27ae60";
        btn.innerText = "❌ Quitter le mode Proforma";
        panneau.style.display = "block";
        boutonsPlus.forEach(b => b.style.display = "inline-block");
    } else {
        btn.style.backgroundColor = "#e74c3c";
        btn.innerText = "📄 Créer une Proforma";
        panneau.style.display = "none";
        boutonsPlus.forEach(b => b.style.display = "none");
    }
};

// 3. Ajouter 1 au panier (Bouton '+')
window.ajouterAuPanier = function(idBiere) {
    panierProforma[idBiere] = (panierProforma[idBiere] || 0) + 1;
    afficherPanier();
};

// 4. Saisie manuelle de la quantité
window.changerQtePanier = function(idBiere, qte) {
    const val = parseInt(qte);
    if (isNaN(val) || val <= 0) {
        delete panierProforma[idBiere];
    } else {
        panierProforma[idBiere] = val;
    }
    afficherPanier();
};

// 5. Mettre à jour l'affichage du panneau
window.afficherPanier = function() {
    const conteneur = document.getElementById('liste-panier-proforma');
    
    if (Object.keys(panierProforma).length === 0) {
        conteneur.innerHTML = "<p style='color: gray; font-size: 0.9em;'>Le panier est vide.</p>";
        return;
    }

    let html = "";
    for (const [idBiere, qte] of Object.entries(panierProforma)) {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 8px 0;">
                <span style="font-size: 0.9em; flex: 1;">${idBiere}</span>
                <input type="number" value="${qte}" onchange="changerQtePanier('${idBiere}', this.value)" style="width: 50px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
            </div>
        `;
    }
    conteneur.innerHTML = html;
};

//=========================================
// GÉNÉRATION PDF
//=========================================

window.validerProforma = async function() {
    if (Object.keys(panierProforma).length === 0) {
        alert("La proforma est vide !");
        return;
    }

    const btn = document.querySelector('#panneau-panier-proforma button');
    btn.innerText = "⏳ Génération du PDF...";

    try {
        const [resBieres, resProforma] = await Promise.all([
            fetch('/api/bieres'),
            fetch('/api/proforma') 
        ]);
        const bieresDB = await resBieres.json();
        const proformaDB = await resProforma.json();

        // --- 1. PREPARATION DES DONNEES ---
        const dateAujourdhui = new Date().toLocaleDateString('fr-FR');
        const d = new Date(); d.setMonth(d.getMonth() + 1);
        const dateEcheance = d.toLocaleDateString('fr-FR');

        let totalHT = 0;
        let totalAccises = 0;
        let totalEco = 0;
        let lignesProduitsHTML = "";

        let indexLigne = 1;
        for (const [id, qte] of Object.entries(panierProforma)) {
            const biere = bieresDB.find(b => b.id === id);
            const finance = proformaDB.find(p => p.id === id || p.designation === id);

            if (biere && finance) {
                const qteUV = qte * biere.nombre;
                const vol = id.includes("75cl") ? 0.75 : (id.includes("44cl") ? 0.44 : 0.33);
                const mntBrut = qteUV * finance.PUbrutHT;
                const mntAccise = qteUV * finance.accise;
                const mntEco = qteUV * finance.eco;
                const mntNet = qteUV * finance.PUnetHTVA;

                totalHT += mntNet;
                totalAccises += mntAccise;
                totalEco += mntEco;

                lignesProduitsHTML += `
                    <tr>
                        <td style="padding: 5px; border-right: 1px solid #000; border-left: 1px solid #000;">${indexLigne}</td>
                        <td style="padding: 5px; border-right: 1px solid #000; text-align: left;">${finance.designation}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${qte}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">cartons</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${qteUV}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${finance.PUbrutHT.toFixed(2)}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${mntBrut.toFixed(2)}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">01</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${biere.degre}°</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${vol}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${mntAccise.toFixed(2)}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${mntEco.toFixed(2)}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${finance.PUnetHTVA.toFixed(2)}</td>
                        <td style="padding: 5px; border-right: 1px solid #000;">${mntNet.toFixed(2)}</td>
                    </tr>
                `;
                indexLigne++;
            }
        }

        const vingtPcent = totalHT * 0.20;
        const unVvingt = totalHT * 1.20;

        // --- 2. CONSTRUCTION DU MODELE HTML ---
        const elementFacture = document.createElement('div');
        elementFacture.style.padding = "0px";
        elementFacture.style.fontFamily = "'Lexend Deca', sans-serif";
        elementFacture.style.fontSize = "10px";
        elementFacture.style.color = "#000";
        elementFacture.style.width = "180mm"; 
        //elementFacture.style.minHeight = "280mm";
        elementFacture.style.boxSizing = "border-box";

        elementFacture.innerHTML =  `
            <table style="width: 100%; margin-bottom: 20px; border: none;">
                <tr>
                    <td style="width: 50%; text-align: left; vertical-align: top;">
                        <b>Commande Proforma n°</b> ..................................
                    </td>
                    <td style="width: 50%; text-align: right; vertical-align: top;">
                        <h2 style="margin:0; font-size: 16px;">BRIQUE HOUSE BREWERY</h2>
                    </td>
                </tr>
            </table>

            <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
                <tr>
                    <td style="width: 31%; border: 1px solid #000; padding: 10px; vertical-align: top;">
                        <b>ADRESSE DE LIVRAISON</b><br><br><br>
                    </td>
                    <td style="width: 3.5%;"></td>
                    <td style="width: 31%; border: 1px solid #000; padding: 10px; vertical-align: top;">
                        <b>ADRESSE DU SIEGE SOCIAL</b><br><br><br>
                    </td>
                    <td style="width: 3.5%;"></td>
                    <td style="width: 31%; border: 1px solid #000; padding: 10px; vertical-align: top;">
                        <b>ADRESSE DE FACTURATION</b><br><br><br>
                    </td>
                </tr>
            </table>

            <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse; border: 1px solid #000;">
                <tr>
                    <td style="width: 50%; padding: 10px; vertical-align: top;">
                        <table style="width: 100%; font-size: 10px;">
                            <tr><td>N° de document</td><td style="text-align:right;">........................</td></tr>
                            <tr><td>Date</td><td style="text-align:right;">${dateAujourdhui}</td></tr>
                            <tr><td>N° de client</td><td style="text-align:right;">........................</td></tr>
                            <tr><td>Mode de paiement</td><td style="text-align:right;">........................</td></tr>
                            <tr><td>Date d'échéance</td><td style="text-align:right;">${dateEcheance}</td></tr>
                            <tr><td>Code Magasin</td><td style="text-align:right;">........................</td></tr>
                        </table>
                    </td>
                    <td style="width: 50%; padding: 10px; vertical-align: top;">
                        <table style="width: 100%; font-size: 10px;">
                            <tr><td>Commande n°</td><td style="text-align:right;">........................</td></tr>
                            <tr><td>Votre Interlocuteur</td><td style="text-align:right;">........................</td></tr>
                            <tr><td>Votre référence</td><td style="text-align:right;">........................</td></tr>
                            <tr><td>Mode de livraison</td><td style="text-align:right;">........................</td></tr>
                            <tr><td>N° de TVA</td><td style="text-align:right;">........................</td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: right; border: 1px solid #000; font-size: 9px;">
                <tr style="background-color: #002AB6; color: white; text-align: center;">
                    <th style="padding: 5px; border: 1px solid #000;">N°</th>
                    <th style="padding: 5px; border: 1px solid #000; text-align: left;">Désignation</th>
                    <th style="padding: 5px; border: 1px solid #000;">Qté</th>
                    <th style="padding: 5px; border: 1px solid #000;">Unité</th>
                    <th style="padding: 5px; border: 1px solid #000;">Qté UV</th>
                    <th style="padding: 5px; border: 1px solid #000;">P.U. brut HT</th>
                    <th style="padding: 5px; border: 1px solid #000;">Montant brut HT</th>
                    <th style="padding: 5px; border: 1px solid #000;">TVA</th>
                    <th style="padding: 5px; border: 1px solid #000;">Degré</th>
                    <th style="padding: 5px; border: 1px solid #000;">Vol. unité</th>
                    <th style="padding: 5px; border: 1px solid #000;">Accises</th>
                    <th style="padding: 5px; border: 1px solid #000;">Ecotaxe</th>
                    <th style="padding: 5px; border: 1px solid #000;">P.U. net</th>
                    <th style="padding: 5px; border: 1px solid #000;">Total HT</th>
                </tr>
                ${lignesProduitsHTML.replace(/padding: 5px;/g, "padding: 3px 2px;")}
                <tr style="font-weight: bold; border-top: 1px solid #000;">
                    <td colspan="2" style="text-align: left; padding: 5px; border-left: 1px solid #000;">TOTAL</td>
                    <td colspan="8"></td>
                    <td style="padding: 5px;">${totalAccises.toFixed(2)}</td>
                    <td style="padding: 5px;">${totalEco.toFixed(2)}</td>
                    <td></td>
                    <td style="padding: 5px; border-right: 1px solid #000;">${totalHT.toFixed(2)}</td>
                </tr>
            </table>

            <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
                <tr>
                    <td style="width: 31%; vertical-align: top;">
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; text-align: right;">
                            <tr style="background-color: #002AB6; color: white; text-align: center;"><th colspan="3" style="padding: 3px;">TVA</th></tr>
                            <tr style="font-weight: bold;"><td>BASE</td><td style="text-align:center;">Taux</td><td>Montant</td></tr>
                            <tr><td>${totalHT.toFixed(2)}</td><td style="text-align:center;">01 (20%)</td><td>${vingtPcent.toFixed(2)}</td></tr>
                            <tr style="font-weight: bold; border-top: 1px solid #000;"><td>${totalHT.toFixed(2)}</td><td></td><td>${vingtPcent.toFixed(2)}</td></tr>
                        </table>
                    </td>
                    <td style="width: 3.5%;"></td>
                    <td style="width: 31%; vertical-align: top;">
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                            <tr style="background-color: #002AB6; color: white; text-align: center;"><th colspan="2" style="padding: 3px;">Autres Taxes</th></tr>
                            <tr><td>Taxes Accises</td><td style="text-align: right;">${totalAccises.toFixed(2)}</td></tr>
                            <tr><td>Eco-Taxes</td><td style="text-align: right;">${totalEco.toFixed(2)}</td></tr>
                        </table>
                    </td>
                    <td style="width: 3.5%;"></td>
                    <td style="width: 31%; vertical-align: top;">
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                            <tr><td>Total HT EUR</td><td style="text-align: right;">${totalHT.toFixed(2)}</td></tr>
                            <tr><td>TVA</td><td style="text-align: right;">${vingtPcent.toFixed(2)}</td></tr>
                            <tr style="font-weight: bold; background-color: #eee;"><td>Total TTC EUR</td><td style="text-align: right;">${unVvingt.toFixed(2)}</td></tr>
                            <tr style="background-color: #002AB6; color: white; text-align: center;"><th colspan="2" style="padding: 3px;">PAIEMENT</th></tr>
                            <tr><td>IBAN</td><td style="text-align: right;">........................</td></tr>
                            <tr><td>BIC</td><td style="text-align: right;">........................</td></tr>
                            <tr><td>Date d'échéance</td><td style="text-align: right;">${dateEcheance}</td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <div style="font-size: 8px; text-align: left; margin-bottom: 20px;">
                Toute commande passée à notre société est soumise à nos conditions générales de vente.<br>
                Réserve de propriété : en application des dispositions de la loi n°80.335 du 12 mai 1980, les biens vendus demeurent la propriété du vendeur jusqu'à complet paiement.<br>
                Aucun escompte ne sera accordé en cas de paiement anticipé.<br>
                Une indemnité pour frais de recouvrement de 40 EUR et des intérêts de retard (3 fois le taux d'intérêt légal) sont décomptés dès le lendemain de l'échéance de la facture.
            </div>

            <div style="text-align: center; font-size: 9px;">
                BRIQUE HOUSE BREWERY - 91 Rue de la Croix Waresquel - 59273 FRETIN - tel : 06 30 90 97 05<br>
                SIRET : 85055928700014 - N° TVA : FR 44 850 559 287 - ACTIVITE (NAF / APE) : 1105Z - Fabrication de bière
            </div>
        `;


        // --- 3. GENERATION DU PDF ---
        const opt = {
            margin:       [2, 10, 2, 10], 
            filename:     `Proforma_BriqueHouse_${dateAujourdhui.replace(/\//g,'-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2,
                            scrollY: 0,
                            windowHeight: 1500,
                            y: 0
                          }, 
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } 
        };

        await html2pdf().set(opt).from(elementFacture).save();

        btn.innerText = "✅ OK (Générer PDF)";

    } catch (e) {
        console.error("Erreur PDF :", e);
        alert("Erreur lors de la génération. Vérifiez la console.");
        btn.innerText = "✅ OK (Générer PDF)";
    }
};
