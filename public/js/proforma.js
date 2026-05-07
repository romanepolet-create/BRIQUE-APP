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


//===================================
// Validation
//===================================



window.validerProforma = function() {
    if (Object.keys(panierProforma).length === 0) {
        alert("La proforma est vide !");
        return;
    }
    console.log("Données prêtes pour l'Excel :", panierProforma);
    alert("Prêt à générer l'Excel avec : \n" + JSON.stringify(panierProforma, null, 2));
    // Ici on mettra la fonction Excel plus tard !
};
