// ==========================================
// MOTEUR PROFORMA (FRONT-END)
// ==========================================

// 🚨 CES DEUX LIGNES AVAIENT DISPARU : ELLES SONT INDISPENSABLES 🚨
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
                ✅ OK (Générer Excel)
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

// 6. GÉNÉRATION EXCEL (Le bouton OK)
window.validerProforma = async function() {
    if (Object.keys(panierProforma).length === 0) {
        alert("La proforma est vide !");
        return;
    }

    const btn = document.querySelector('#panneau-panier-proforma button');
    btn.innerText = "⏳ Génération...";

    try {
        const [resBieres, resProforma] = await Promise.all([
            fetch('/api/bieres'),
            fetch('/api/proforma') 
        ]);

        const bieresDB = await resBieres.json();
        const proformaDB = await resProforma.json();

        const donnees = [];
        
        // --- EN-TÊTE DU FICHIER ---
        donnees.push(["Commande Proforma n°", "", "", "", "", "", "", "", "BRIQUE HOUSE BREWERY"]);
        donnees.push([]);
        donnees.push(["ADRESSE DE LIVRAISON", "", "", "", "", "", "", "ADRESSE DE FACTURATION"]);
        donnees.push([]);
        donnees.push(["ADRESSE DU SIEGE SOCIAL"]);
        donnees.push([]);
        
        const dateAujourdhui = new Date().toLocaleDateString('fr-FR');
        const d = new Date(); d.setMonth(d.getMonth() + 1);
        const dateEcheance = d.toLocaleDateString('fr-FR');

        donnees.push(["N° de document", "", "", "", "", "Commande n°", ""]);
        donnees.push(["Date", dateAujourdhui, "", "", "", "Votre interlocuteur", ""]);
        donnees.push(["N° de client", "", "", "", "", "", ""]);
        donnees.push(["Mode de paiement", "", "", "", "", "Votre référence", ""]);
        donnees.push(["Date d'échéance", dateEcheance, "", "", "", "Mode de livraison", ""]);
        donnees.push(["Code magasin", "", "", "", "", "N° de TVA", ""]);
        donnees.push([]);

        donnees.push([
            "N°", "Désignation", "Qté", "Unité", "Qté UV", 
            "P.U. brut HT", "Montant brut HT", "TVA", "Degré alcool", 
            "Vol. unit", "Montant Accises", "Montant Ecotaxe", 
            "P.U. net HTVA", "Montant net HTVA"
        ]);

        let totalHT = 0;
        let totalAccises = 0;
        let totalEco = 0;
        let indexLigne = 1;

        for (const [idBiere, qteCartons] of Object.entries(panierProforma)) {
            const biere = bieresDB.find(b => b.id === idBiere);
            const finance = proformaDB.find(p => p.id === idBiere || p.designation === idBiere);

            if (biere && finance) {
                const qteUV = qteCartons * biere.nombre; 
                
                let volUnit = 0.33;
                if (idBiere.includes("75cl")) volUnit = 0.75;
                if (idBiere.includes("44cl")) volUnit = 0.44;

                const montantBrutHT = qteUV * finance.PUbrutHT;
                const montantAccises = qteUV * finance.accise; 
                const montantEco = qteUV * finance.eco;
                const montantNetHTVA = qteUV * finance.PUnetHTVA;

                totalHT += montantNetHTVA;
                totalAccises += montantAccises;
                totalEco += montantEco;

                donnees.push([
                    indexLigne,
                    finance.designation,
                    qteCartons,
                    "cartons",
                    qteUV,
                    finance.PUbrutHT,
                    montantBrutHT.toFixed(2),
                    "01", 
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

        donnees.push([]);
        donnees.push(["Toute commande passée à notre société est soumise à nos conditions générales de vente."]);
        donnees.push(["Réserve de propriété : en application des dispositions de la loi n°80.335 du 12 mai 1980..."]);

        const feuille = XLSX.utils.aoa_to_sheet(donnees);
        
        const colWidths = [
            { wch: 5 }, { wch: 35 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, 
            { wch: 12 }, { wch: 15 }, { wch: 5 }, { wch: 10 }, { wch: 10 }, 
            { wch: 15 },
