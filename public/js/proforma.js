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
  } else {
    btn.style.backgroundColor = "#e74c3c";
    btn.innerText = "📄 Créer une Proforma";
  }

  const titreActuel = document.querySelector('.mot-cle');
  if (titreActuel) {
    if (typeof idBiereActuelle !== 'undefined') afficher(idBiereActuelle);
  }
};


//===================================
// Manipuler le panier
//===================================

window.ajouterAuPanier = function(id) {
  panierProforma[id] = (panierProforma[id] || 0) + 1;
  document.getElementById(`qte-${id}`).value = panierProforma[id];
  console.log("Panier actuel :", panierProforma);
};

window.updateQteManuelle = function(id, valeur) {
  panierProforma[id] = parseInt(valeur) || 0;
  console.log("Quantité modifiée :", panierProforma);
};
