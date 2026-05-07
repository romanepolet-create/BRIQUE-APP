let modeproforma = false;
let panierProforma = {};
let donneesProforma = []; // 👈 Va stocker ton nouveau JSON


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
                ✅ OK (Générer Excel)
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', uiHTML);
});


//===================================
// Basculer en mode Proforma
//===================================

window.toggleModeProforma = function() {
    modeProforma = !modeProforma;
    const btn = document.getElementById('btn-toggle-proforma');
    const panneau = document.getElementById('panneau-panier-proforma');
    const boutonsPlus = document.querySelectorAll('.btn-plus-proforma');

    if (modeProforma) {
        btn.style.backgroundColor = "#27ae60";
        btn.innerText = "❌ Quitter le mode Proforma";
        panneau.style.display = "block"; // Affiche le panneau
        boutonsPlus.forEach(b => b.style.display = "inline-block"); // Affiche les '+' bleus
    } else {
        btn.style.backgroundColor = "#e74c3c";
        btn.innerText = "📄 Créer une Proforma";
        panneau.style.display = "none"; // Cache le panneau
        boutonsPlus.forEach(b => b.style.display = "none"); // Cache les '+' bleus
    }
};

//===================================
// Manipuler le panier
//===================================

window.ajouterAuPanier = function(idBiere) {
    panierProforma[idBiere] = (panierProforma[idBiere] || 0) + 1;
    afficherPanier();
};

// 4. Quand on tape manuellement un nombre (ex: 60)
window.changerQtePanier = function(idBiere, qte) {
    const val = parseInt(qte);
    if (isNaN(val) || val <= 0) {
        delete panierProforma[idBiere]; // On supprime si 0
    } else {
        panierProforma[idBiere] = val;
    }
    afficherPanier();
};


//===================================
// Afficher le panier
//===================================


function afficherPanier() {
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
}

// ==========================================
// GÉNÉRATION DU FICHIER EXCEL PROFORMA
// ==========================================

window.validerProforma = async function() {
    if (Object.keys(panierProforma).length === 0) {
        alert("La proforma est vide !");
        return;
    }

    // On change le texte du bouton pour faire patienter
    const btn = document.querySelector('#panneau-panier-proforma button');
    btn.innerText = "⏳ Génération de l'Excel...";

    try {
        // 1. On va chercher les deux bases de données (Bières + Finance Proforma)
        const [resBieres, resProforma] = await Promise.all([
            fetch('/api/bieres'),
            fetch('/api/proforma') // Modifie cette route si ton proforma.json est ailleurs
        ]);

        const bieresDB = await resBieres.json();
        const proformaDB = await resProforma.json();

        // 2. On prépare le tableau de données pour l'Excel (comme tu l'as fait dans gms.js)
        const donnees = [];
        
        // --- EN-TÊTE DU FICHIER ---
        donnees.push(["Commande Proforma n°", "", "", "", "", "", "", "", "BRIQUE HOUSE BREWERY"]);
        donnees.push([]);
        donnees.push(["ADRESSE DE LIVRAISON", "", "", "", "", "", "", "ADRESSE DE FACTURATION"]);
        donnees.push([]);
        donnees.push(["ADRESSE DU SIEGE SOCIAL"]);
        donnees.push([]);
        
        const dateAujourdhui = new Date().toLocaleDateString('fr-FR');
        // Date dans 1 mois
        const d = new Date(); d.setMonth(d.getMonth() + 1);
        const dateEcheance = d.toLocaleDateString('fr-FR');

        donnees.push(["N° de document", "", "", "", "", "Commande n°", ""]);
        donnees.push(["Date", dateAujourdhui, "", "", "", "Votre interlocuteur", ""]);
        donnees.push(["N° de client", "", "", "", "", "", ""]);
        donnees.push(["Mode de paiement", "", "", "", "", "Votre référence", ""]);
        donnees.push(["Date d'échéance", dateEcheance, "", "", "", "Mode de livraison", ""]);
        donnees.push(["Code magasin", "", "", "", "", "N° de TVA", ""]);
        donnees.push([]);

        // --- EN-TÊTE DU TABLEAU DES ARTICLES ---
        donnees.push([
            "N°", "Désignation", "Qté", "Unité", "Qté UV", 
            "P.U. brut HT", "Montant brut HT", "TVA", "Degré alcool", 
            "Vol. unit", "Montant Accises", "Montant Ecotaxe", 
            "P.U. net HTVA", "Montant net HTVA"
        ]);

        // --- VARIABLES POUR LES TOTAUX ---
        let totalHT = 0;
        let totalAccises = 0;
        let totalEco = 0;
        let indexLigne = 1;

        // --- BOUCLE SUR LE PANIER ---
        for (const [idBiere, qteCartons] of Object.entries(panierProforma)) {
            // On cherche la bière dans la DB
            const biere = bieresDB.find(b => b.id === idBiere);
            // On cherche la data finance correspondante (on suppose que l'id est le même, ou la désignation)
            const finance = proformaDB.find(p => p.id === idBiere || p.designation === idBiere);

            if (biere && finance) {
                const qteUV = qteCartons * biere.nombre; // ex: 2 cartons * 24 = 48 UV
                
                // Déduction du volume unitaire (0.33, 0.44 ou 0.75)
                let volUnit = 0.33;
                if (idBiere.includes("75cl")) volUnit = 0.75;
                if (idBiere.includes("44cl")) volUnit = 0.44;

                // Calculs financiers
                const montantBrutHT = qteUV * finance.PUbrutHT;
                const montantAccises = qteUV * finance.accise; // ou qteUV * volUnit * taux selon ta vraie formule
                const montantEco = qteUV * finance.eco;
                const montantNetHTVA = qteUV * finance.PUnetHTVA;

                // Ajout aux totaux
                totalHT += montantNetHTVA;
                totalAccises += montantAccises;
                totalEco += montantEco;

                // Ajout de la ligne au tableau Excel
                donnees.push([
                    indexLigne,
                    finance.designation,
                    qteCartons,
                    "cartons",
                    qteUV,
                    finance.PUbrutHT,
                    montantBrutHT.toFixed(2),
                    "01", // Code TVA 20%
                    biere.degre + "°",
                    volUnit,
                    montantAccises.toFixed(2),
                    montantEco.toFixed(2),
                    finance.PUnetHTVA,
                    montantNetHTVA.toFixed(2)
                ]);
                indexLigne++;
            }
        }

        // --- PIED DE PAGE (TOTAUX) ---
        donnees.push([]);
        donnees.push(["TOTAL", "", "", "", "", "", "", "", "", "", totalAccises.toFixed(2), totalEco.toFixed(2), "", totalHT.toFixed(2)]);
        donnees.push([]);
        
        const montantTVA = totalHT * 0.20;
        const totalTTC = totalHT + montantTVA;

        donnees.push(["TVA", "", "", "", "", "", "Autres Taxes"]);
        donnees.push(["BASE", "Taux", "", "Montant", "", "", "Taxes Accises", "", totalAccises.toFixed(2), "", "", "Total HT EUR", "", totalHT.toFixed(2)]);
        donnees.push([totalHT.toFixed(2), "01", "20%", montantTVA.toFixed(2), "", "", "Eco-Taxes", "", totalEco.toFixed(2), "", "", "TVA", "", montantTVA.toFixed(2)]);
        donnees.push(["", "", "", "", "", "", "", "", "", "", "", "Total TTC EUR", "", totalTTC.toFixed(2)]);
        
        donnees.push([]);
        donnees.push(["", "", "", "", "", "", "", "", "", "", "", "PAIEMENT"]);
        donnees.push(["", "", "", "", "", "", "", "", "", "", "", "IBAN", "..........................................."]);
        donnees.push(["", "", "", "", "", "", "", "", "", "", "", "BIC", "..........................................."]);
        donnees.push([totalHT.toFixed(2), "", "", montantTVA.toFixed(2), "", "", "", "", "Date d'échéance", "", dateEcheance]);

        // Conditions générales
        donnees.push([]);
        donnees.push(["Toute commande passée à notre société est soumise à nos conditions générales de vente."]);
        donnees.push(["Réserve de propriété : en application des dispositions de la loi n°80.335 du 12 mai 1980..."]);

        // --- CRÉATION ET TÉLÉCHARGEMENT ---
        const feuille = XLSX.utils.aoa_to_sheet(donnees);
        
        // Ajustement de la largeur des colonnes
        const colWidths = [
            { wch: 5 },  // N°
            { wch: 35 }, // Désignation
            { wch: 8 },  // Qté
            { wch: 10 }, // Unité
            { wch: 8 },  // Qté UV
            { wch: 12 }, // P.U brut
            { wch: 15 }, // Montant Brut
            { wch: 5 },  // TVA
            { wch: 10 }, // Degré
            { wch: 10 }, // Vol
            { wch: 15 }, // Accises
            { wch: 15 }, // Ecotaxe
            { wch: 12 }, // P.U net
            { wch: 15 }  // Montant net
        ];
        feuille['!cols'] = colWidths;

        const classeur = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(classeur, feuille, "Proforma");
        
        // On génère le fichier !
        XLSX.writeFile(classeur, `Proforma_BriqueHouse_${Date.now()}.xlsx`);

        // On remet le bouton à la normale
        btn.innerText = "✅ OK (Générer Excel)";

    } catch (erreur) {
        console.error("Erreur lors de la génération de l'Excel :", erreur);
        alert("Oups, impossible de générer le fichier. Vérifiez que la base de données est accessible.");
        btn.innerText = "✅ OK (Générer Excel)";
    }
};
