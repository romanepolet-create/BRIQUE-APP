let geojsonLayer
let modeEdition = false;
let markerConteneur; //PINS MAGASINS
let listeMagasins = []; //DATA
let userPosition = null; // GEOLOC
let userMarker = null; //PIN GEOLOC

const PORTAL_ID = "146794478"; //ID HS

//CARTE LEAFLET
const map = L.map('map').setView([46.603354, 1.888334], 5);

  // 2. Charge le fond de carte (OpenStreetMap gratuit & propre)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CARTO'
  }).addTo(map);

 
// ===========================================================
// CHARGEMENT DES FICHIERS GEOJSON (Frontières)
// ===========================================================
async function chargerGeoJSON() {
  try {
    const [resGeo, resRegion] = await Promise.all([
      fetch('/api/geo'),
      fetch('/api/region'),
    ]);
    
    const donneesGeo = await resGeo.json();
    const donneesRegion = await resRegion.json();

    geojsonLayer = L.geoJSON(donneesGeo, {
      style: {
        fillColor: '#3388ff',
        weight: 1,
        opacity: 0.5,
        color: 'gray',
        FillOpacity: 0.3
      },
    }).addTo(map);

    //map.fitBounds(geojsonLayer.getBounds());

    L.geoJSON(donneesRegion, {
      style: {
        fillColor: 'transparent',
        weight: 3,
        opacity: 0.5,
        color: 'C7C3C2',
        FillOpacity: false
      },
    }).addTo(map);

    console.log("Carte et Données chargées avec succès !");

  } catch (error) {
    console.error("Erreur de chargement des données :", error);
  }
}

markerConteneur = L.layerGroup().addTo(map);

chargerGeoJSON();

chargerDonneesMagasins();



// =========================================================
// GÉOLOCALISATION
// =========================================================
window.activerGeolocalisation = function() {
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée par ton navigateur.");
    return;
  }

  // Déclenche le suivi en temps réel du commercial
  navigator.geolocation.watchPosition(function(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    userPosition = L.latLng(lat, lng);

    // Si le point bleu existe déjà, on le déplace, sinon on le crée
    if (userMarker) {
      userMarker.setLatLng(userPosition);
    } else {
      // Création d'un marqueur bleu spécial pour le commercial
      const iconeBleue = L.divIcon({
        className: 'user-gps-marker',
        html: '<div style="background-color: #002ab6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
        iconSize: [20, 20]
      });
      userMarker = L.marker(userPosition, { icon: iconeBleue }).addTo(map);
      // Au premier repérage, on zoome automatiquement sur lui
      map.setView(userPosition, 12);
    }
        
    // On relance le filtrage pour calculer la distance autour de lui si le filtre est actif
    filtrerMagasins();

  }, function(error) {
    console.warn("Erreur GPS : ", error.message);
    alert("Impossible de récupérer ta position GPS.");
  }, {
    enableHighAccuracy: true // Force l'utilisation du vrai GPS du téléphone
  });
};

// =================================================
// GESTION DES MAGASINS ET DE LA BULLE HUBSPOT
// =================================================
async function chargerDonneesMagasins() {
  try {
    const response = await fetch('/api/gms');

    if (!response.ok) throw new Error("Erreur réseau GMS");
    
    listeMagasins = await response.json();

    // Remplir la carte dès le départ
    afficherMagasinsSurCarte(listeMagasins);
  } catch (err) {
    console.error("Impossible de charger les magasins :", err);
  }
}


function afficherMagasinsSurCarte(magasins) {
  // On vide la carte avant de remettre les nouveaux pins filtrés
  markerConteneur.clearLayers();

  magasins.forEach(magasin => {
    const positionMagasin = L.latLng(magasin.lat, magasin.lng);
    const lienHubspot = `https://app.hubspot.com/contacts/${PORTAL_ID}/company/${magasin.hubspot_id}`;

    // Contenu HTML de la bulle (Popup)
    const contenuBulle = `
      <div style="text-align: center; font-family: Arial, sans-serif; min-width: 160px;">
        <h4 style="color: #002ab6; margin: 0 0 5px 0;">${magasin.nom}</h4>
        <p style="margin: 0 0 12px 0; color: #666; font-size: 13px;">
          ${magasin.adresse}<br>
          <strong>${magasin.code_postal} ${magasin.ville}</strong>
        </p>
        <a href="${lienHubspot}" target="_blank" 
           style="display: block; 
                  background-color: #f3b0cf; 
                  color: #002ab6; 
                  padding: 8px 10px; 
                  border-radius: 5px; 
                  font-weight: bold; 
                  text-decoration: none; 
                  font-size: 12px;">
            🌐 Ouvrir dans HubSpot
        </a>
      </div>
    `;

    // Création du Pin et ajout au conteneur
    L.marker(positionMagasin)
      .bindPopup(contenuBulle)
      .addTo(markerConteneur);
  });
}

// ================
// FILTRES
// ================
window.filtrerMagasins = function() {
  const regionSelectionnee = document.getElementById('filter-region').value;
  const dptSelectionne = document.getElementById('filter-dpt').value;
  const enseigneSelectionnee = document.getElementById('filter-enseigne').value;
  const rayonMaximum = parseFloat(document.getElementById('filter-rayon').value);

  //FILTER ON DATA
  const magasinsFiltres = listeMagasins.filter(magasin => {
        
    // 1. ENSEIGNES
    if (enseigneSelectionnee && magasin.enseigne !== enseigneSelectionnee) return false;
        
    // 2. REGION
    if (regionSelectionnee && magasin.region !== regionSelectionnee) return false;

    // 3. DPT
    if (dptSelectionne && magasin.dpt !== dptSelectionne) return false;

    // 4. RAYON KM (GEOLOC)
    if (rayonMaximum && rayonMaximum < 99999) {
      if (!userPosition) {
        // Si le commercial demande un rayon mais n'a pas activé son GPS
        return true; 
      }
      const positionMagasin = L.latLng(magasin.lat, magasin.lng);
      // map.distance donne le résultat en mètres, on divise par 1000 pour avoir des km
      const distanceKM = map.distance(userPosition, positionMagasin) / 1000;
            
      if (distanceKM > rayonMaximum) return false;
    }

    return true; // Le magasin passe tous les filtres !
  });

  // On met à jour l'affichage sur la carte
  afficherMagasinsSurCarte(magasinsFiltres);
};
