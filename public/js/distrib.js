let geojsonLayer;
let maData = [];
let modeEdition = false; 
let bieresDistribActuel = []; 
let toutesLesBieres = []; // 👈 On la déclare vide pour l'instant

const map = L.map('map').setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors, © CARTO'
  }).addTo(map);

async function initialiserDonnees() {
  try {
    // On va chercher ton fichier JSON
    const [resDistrib, resGeo, resRegion] = await Promise.all([
      fetch('/api/distrib'),
      fetch('/api/geo'),
      fetch('/api/region'),
    ]);
    
    maData = await resDistrib.json();
    const donneesGeo = await resGeo.json();
    const donneesRegion = await resRegion.json();

const select = document.getElementById('distribSelect');
maData.forEach(d => {
  let option = document.createElement('option');
  option.value = d.id;
  option.text = d.nom;
  select.appendChild(option);
});

  geojsonLayer = L.geoJSON(donneesGeo, {
    style: {
      fillColor: '#3388ff',
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.5
    },
    onEachFeature: function(feature, layer) {
      layer.on('click', onDeptClick);
    }
  }).addTo(map);

  map.fitBounds(geojsonLayer.getBounds());

 L.geoJSON(donneesRegion, {
    style: {
      fillColor: 'transparent',
      weight: 3,
      opacity: 0.5,
      color: "#C7C3C2",
      interactive: false
    }
  }).addTo(map);


  console.log("Carte et données chargées avec succès !");


} catch (error) {
console.error("Erreur de chargement des données :", error);
  }
}

// 3. ON LANCE LE CHARGEMENT
initialiserDonnees();

function handleSelectChange() {
  const selectHTML = document.getElementById('distribSelect');
  const selectedId = selectHTML.value;
  const nomDistrib = selectHTML.options[selectHTML.selectedIndex].text;

  console.log("ID sélectionné :", selectedId);

  if(!selectedId) {
    document.getElementById('panneau-distrib').style.display = 'none';

    geojsonLayer.eachLayer(layer => {
      layer.setStyle({fillColor: '#3388ff', fillOpacity:0.2});
    });
    
    map.setView([46.603354, 1.888334], 5);
    return;

  }

    const selectedDistrib = maData.find(d => String(d.id) === String(selectedId));
    console.log("Distributeur trouvé:", selectedDistrib);

  if(selectedDistrib && geojsonLayer) {
    document.getElementById('panneau-distrib').style.display = 'flex';
    document.getElementById('panneau-titre').innerText = nomDistrib;

    // On éteint le mode édition à chaque fois qu'on change de distributeur
    modeEdition = false; 
    // On charge les bières du distributeur (S'il n'en a pas, on met un tableau vide [])
    bieresDistribActuel = selectedDistrib.bieres || [];
    // On lance le pinceau !
    mettreAJourAffichageBieres();
    // --------------------

    map.setView([46.603354, 1.888334], 5);
    
    geojsonLayer.eachLayer(function (layer) {
      const deptCode = String(layer.feature.properties.code);
      const isSelected = selectedDistrib.dpt.map(String).includes(deptCode);

      layer.setStyle({
        fillColor: isSelected ? 'red' : '#3388ff',
        fillOpacity: isSelected ? 0.7 : 0.2
      });
    });
  }
}

document.getElementById('distribSelect').addEventListener('change', handleSelectChange);

function onDeptClick(e) {
  const deptCode = String(e.target.feature.properties.code);
  const list = maData.filter(d => d.dpt.map(String).includes(deptCode));
  let textePopup = `<b> Département ${deptCode}</b><br>`;
  if(list.length > 0) {
    textePopup += "Distributeurs : <ul>";
    list.forEach(d => {textePopup += `<li>${d.nom}</li>`;});
    textePopup += "</ul>";
  } else {
    textePopup += "<br>Aucun distributeur.";
  }

  L.popup()
    .setLatLng(e.latlng)
    .setContent(textePopup)
    .openOn(map);
}

// ==========================================
// MOTEUR DE RECHERCHE INTELLIGENT (Fuzzy)
// ==========================================

// 1. Fonction pour retirer les majuscules et les accents (é = e)
const normaliserTexte = (texte) => {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// 2. On écoute chaque lettre tapée dans la barre de recherche
document.getElementById('rechercheInput').addEventListener('input', function(e) {
  const texteSaisi = normaliserTexte(e.target.value);

// Si on efface tout le texte, on réinitialise la carte
if (texteSaisi === "") {
  document.getElementById('distribSelect').value = "";
  handleSelectChange(); // Remet la carte en bleu
  return;
}

 // On prépare une copie de nos données avec les noms sans accents
const dataPourRecherche = maData.map(d => ({
  id: d.id,
  nomFacile: normaliserTexte(d.nom)
}));

// On configure Fuse.js (Tolérance aux fautes de frappe)
const optionsFuse = {
  
  includeScore: true,
  threshold: 0.4, // 0 = strict, 1 = accepte tout. 0.4 est parfait pour les fautes !
  keys: ['nomFacile']
};

// On lance la recherche
  const fuse = new Fuse(dataPourRecherche, optionsFuse);
  const resultats = fuse.search(texteSaisi);

  // Si on a trouvé au moins un distributeur qui ressemble
  if (resultats.length > 0) {
    // On récupère l'ID du meilleur résultat (le plus proche)
    const meilleurChoixId = resultats[0].item.id;

    // On change le menu déroulant pour afficher ce distributeur
    document.getElementById('distribSelect').value = meilleurChoixId;

    // On déclenche manuellement la mise à jour de la carte en rouge !
    handleSelectChange();
  }
});


// ==========================================
//  AFFICHAGE DES RÉFÉRENCES CHEZ DISTRIB
// ==========================================
// --- CHARGEMENT DES BIÈRES (DEPUIS DESC.JSON) ---

async function chargerBieresDepuisDesc() {
  try {
  // 1. On va chercher les données sur ton API (la route qui lit desc.json)
    const response = await fetch('/api/lexique');
    const baseDeDonneesDesc = await response.json();

    // 2. On extrait juste les noms ! 
    // ⚠️ IMPORTANT : Si dans ton desc.json la clé s'appelle "id" au lieu de "nom", remplace b.nom par b.id ci-dessous :
    toutesLesBieres = baseDeDonneesDesc.map(b => b.nom); 
                              
    // Petite sécurité pour enlever les doublons s'il y en a
    toutesLesBieres = [...new Set(toutesLesBieres)];
                                          
  } catch (erreur) {
       console.error("Erreur lors du chargement des bières:", erreur);
  }
}

// 3. On lance le chargement dès l'ouverture de la page !
chargerBieresDepuisDesc();

// ==========================================
// CRAYON MODIFICATION
// ==========================================


function mettreAJourAffichageBieres() {
  const listeHTML = document.getElementById('liste-bieres-ref');
  const zoneAjout = document.getElementById('zone-ajout-biere');
  const btnSauvegarde = document.getElementById('btn-sauvegarder-bieres');

  // 1. Afficher/Cacher les outils d'édition selon le mode
  zoneAjout.style.display = modeEdition ? 'flex' : 'none';
  btnSauvegarde.style.display = modeEdition ? 'block' : 'none';

  // 2. Dessiner la liste des bières actuelles
  if (bieresDistribActuel.length === 0 && !modeEdition) {
    listeHTML.innerHTML = "<p style='color:#666; font-style:italic;'>Aucune bière référencée pour l'instant.</p>";
  } else {
    // Si on est en mode édition, on rajoute le bouton [-], sinon on ne met que le nom
    listeHTML.innerHTML = bieresDistribActuel.map(biere => `
      <li>
        ${biere}
        ${modeEdition ? `<button class="btn-action-biere retirer" onclick="retirerBiere('${biere}')" title="Retirer">-</button>` : ''}
      </li>
    `).join('');
  }

  // 3. Remplir le menu déroulant [+] (On n'affiche que les bières qu'il n'a pas encore !)
  if (modeEdition) {
    const selectAjout = document.getElementById('select-nouvelle-biere');
    const bieresDispo = toutesLesBieres.filter(b => !bieresDistribActuel.includes(b));
    selectAjout.innerHTML = bieresDispo.map(b => `<option value="${b}">${b}</option>`).join('');
  }
}

// Clic sur le Crayon ✏️ (On allume/éteint l'édition)
document.getElementById('btn-modifier-bieres').addEventListener('click', () => {
  modeEdition = !modeEdition; // Bascule on/off
    mettreAJourAffichageBieres(); // On redessine !
    });

// Clic sur le bouton rouge [-]
window.retirerBiere = function(biereAEnlever) {
  // On garde toutes les bières SAUF celle qu'on a cliquée
  bieresDistribActuel = bieresDistribActuel.filter(b => b !== biereAEnlever);
  mettreAJourAffichageBieres();
};

// Clic sur le bouton vert [+]
document.querySelector('.btn-action-biere.ajouter').addEventListener('click', () => {
  const selectAjout = document.getElementById('select-nouvelle-biere');
  const nouvelleBiere = selectAjout.value;
  if (nouvelleBiere) {
    bieresDistribActuel.push(nouvelleBiere); // On ajoute à la liste
    mettreAJourAffichageBieres(); // On redessine !
  }
});



