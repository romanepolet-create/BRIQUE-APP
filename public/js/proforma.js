let modeproforma = false;
let panierProforma = {};

//===================================
// Basculer en mode Proforma
//===================================

window.toggleModeProforma = function () {
  modeProforma = !modeProforma;
  const btn = document.getElementById('btn-mode-proforma');

  if (modeProforma) {
    btn.style.background = "#27ae60";
    btn.innertext = "🛒 Mode Proforma Actif";
    zoneJaune.style.display = "flex"; // Affiche la zone jaune
  } else {
    btn.style.backgroundColor = "#e74c3c";
    btn.innerText = "📄 Créer une Proforma";
    zoneJaune.style.display = "none"; // Cache la zone jaune
  }

  const titreActuel = document.querySelector('.mot-cle');
  if (titreActuel) {
    if (typeof idBiereActuelle !== 'undefined') afficher(idBiereActuelle);
  }
};


//===================================
// Manipuler le panier
//===================================

window.ajouterAuPanier = function(idBiere) {
  panierProforma[idBiere] = (panierProforma[idBiere] || 0) + 1;
  document.getElementById(`qte-${idBiere}`).value = panierProforma[idBiere];
  console.log("Panier actuel :", panierProforma);
};

window.updateQteManuelle = function(idBiere, valeur) {
  const qte = parseInt(valeur);
    if (isNaN(qte) || qte < 0) {
        panierProforma[idBiere] = 0;
        document.getElementById(`qte-${idBiere}`).value = 0;
    } else {
        panierProforma[idBiere] = qte;
    }
    console.log("Panier mis à jour :", panierProforma);
};
