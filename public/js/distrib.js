let geojsonLayer;
let maData = [];

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
  const selectedId = document.getElementById('distribSelect').value;

  console.log("ID sélectionné :", selectedId);

  if(!selectedId) {
    geojsonLayer.eachLayer(layer => {
      layer.setStyle({fillColor: '#3388ff', fillOpacity:0.2});
    });
    return;
  }

    const selectedDistrib = maData.find(d => String(d.id) === String(selectedId));
    console.log("Distributeur trouvé:", selectedDistrib);

  if(selectedDistrib && geojsonLayer) {
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
