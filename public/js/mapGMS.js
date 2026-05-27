// Fonction pour vérifier si l'utilisateur est sur mobile
function isMobile() {
  return window.matchMedia("(max-width: 768px)").matches;
}


let geojsonLayer
let modeEdition = false;
let markerConteneur; //PINS MAGASINS
let listeMagasins = []; //DATA
let userPosition = null; // GEOLOC
let userMarker = null; //PIN GEOLOC
let donneesGeo; 
let donneesRegion;
const PORTAL_ID = "146794478"; //ID HS

//CARTE LEAFLET
const mapOptions = {
  center: [46.603354, 1.888334],
  zoom: 5,
  tap: false
};

const map = L.map('map', mapOptions);

  // 2. Charge le fond de carte (OpenStreetMap gratuit & propre)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors, © CARTO'
  }).addTo(map);


markerConteneur = L.markerClusterGroup({
  maxClusterRadius: 20,
  disableClusterAtZoom: 11
}).addTo(map);

async function initialiserCarte() {
  console.log("Démarrage de la carte...");
  await chargerGeoJSON();
  await chargerDonneesMagasins();
};

initialiserCarte();

// ===========================================================
// CHARGEMENT DES FICHIERS GEOJSON
// ===========================================================
async function chargerGeoJSON() {
  try {
    const [resGeo, resRegion] = await Promise.all([
      fetch('/api/geo'),
      fetch('/api/region'),
    ]);
    
    donneesGeo = await resGeo.json();
    donneesRegion = await resRegion.json();

    geojsonLayer = L.geoJSON(donneesGeo, {
      style: {
        fillColor: '#3388ff',
        weight: 1,
        opacity: 0.5,
        color: 'gray',
        fillOpacity: 0.3
      },
    }).addTo(map);

    //map.fitBounds(geojsonLayer.getBounds());

    L.geoJSON(donneesRegion, {
      style: {
        fillColor: 'transparent',
        weight: 3,
        opacity: 0.5,
        color: '#C7C3C2',
        fillOpacity: false
      },
    }).addTo(map);

    // 🚀 ON REMPLIT LES FILTRES DIRECTEMENT AVEC LES DONNÉES ENTRANTES
    remplirSelectFiltre('filter-region', donneesRegion, 'region');     
    remplirSelectFiltre('filter-dpt', donneesGeo, 'dpt');     

    console.log("Carte et Données chargées avec succès !");

  } catch (error) {
    console.error("Erreur de chargement des données :", error);
  }
}

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
// 🎨 Dictionnaire des couleurs par enseigne
function getCouleurEnseigne(enseigne) {
  if(!enseigne) return "#555555";
  const enseignePropre = enseigne.trim().toUpperCase();

    const couleurs = {
      "CRF": "#005baa",       // Bleu Carrefour
      "LCL": "#0066cc",       // Bleu Leclerc
      "ITM": "#e30613",       // Rouge Intermarché
      "U": "#0055a4",         // Bleu Système U
      "AUCHAN": "#e3001b",    // Rouge Auchan
      "CASINO": "#00994d",    // Vert Casino
      "MONOPRIX": "#e2007a",  // Rose Monoprix
      "FRANPRIX": "#ff6600",  // Orange Franprix
      "OTERA": "#6b8e23"      // Vert Otera
    } 
    // Retourne la couleur, ou un gris par défaut si l'enseigne est inconnue
    return couleurs[enseignePropre] || "#555555";
 }


async function chargerDonneesMagasins() {
  try {
    const response = await fetch('/api/gms');

    if (!response.ok) throw new Error("Erreur réseau GMS");
    
    listeMagasins = await response.json();

    remplirFiltresDepuisDonnees(listeMagasins, donneesGeo);

    console.log("Nombre de magasins reçus :", listeMagasins.length);
    console.log("Voici le premier magasin :", listeMagasins[0]);

    // Remplir la carte dès le départ
    afficherMagasinsSurCarte(listeMagasins);
  } catch (err) {
    console.error("Impossible de charger les magasins :", err);
  }
}

let nomEchappe

function afficherMagasinsSurCarte(magasins) {
  // On vide la carte avant de remettre les nouveaux pins filtrés
  markerConteneur.clearLayers();

  magasins.forEach(magasin => {
    const positionMagasin = L.latLng(magasin.lat, magasin.lng);
    const lienHubspot = `https://app.hubspot.com/contacts/${PORTAL_ID}/company/${magasin.hubspot_id}`;

    // Contenu HTML de la bulle (Popup)
    nomEchappe = magasin.nom ? magasin.nom.replace(/'/g, "\\'") : "Magasin";

    const contenuBulle = `
      <div style="text-align: center; font-family: Arial, sans-serif; min-width: 160px;">
        <h4 style="color: #002ab6; margin: 0 0 5px 0;">${magasin.nom}</h4>
        <p style="margin: 0 0 12px 0; color: #666; font-size: 13px;">
          ${magasin.adresse || "Adresse non renseignée"}<br>
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
        <button onclick="ajouterEtape(${magasin.lng}, ${magasin.lat}, '${nomEchappe}')"
          style="
            display = block;
            width: 100%;
            background-color: #28a745;
            color: white;
            padding: 8px 10px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;">
          📍 Ajouter à l'itinéraire
        </button>
      </div>
    `;

    const couleurPin = getCouleurEnseigne(magasin.enseigne);

    // 🚀 LA SOLUTION BLINDÉE : On dessine directement un cercle vectoriel !
    L.circleMarker(positionMagasin, {
      radius: calculerRayonSelonZoom(map.getZoom()), //taille cercle
      fillColor: couleurPin, //couleur
      fillOpacity: 0.85, // Remplissage
      color: 'transparent',//couleur bordure
      weight: 13              //épaisseur bordure
    })
    .bindPopup(contenuBulle)
    .addTo(markerConteneur);
  });
}

// Plus le zoom est grand, plus le rayon px est petit
function calculerRayonSelonZoom(zoom) {
  if (zoom <= 6) return 5;    
  if (zoom === 7) return 4;  
  if (zoom === 8) return 4;
  if (zoom === 9) return 4;
  if (zoom === 10) return 4;
  return 3;                   
}

//Recalcule la taille des points à chaque changement de zoom
map.on('zoomend', function() {
  const nouveauZoom = map.getZoom();
  const nouveauRayon = calculerRayonSelonZoom(nouveauZoom);

  // On parcourt tous les points affichés pour changer leur taille en direct
  markerConteneur.eachLayer(function(layer) {
    if (layer.setRadius) {
      layer.setRadius(nouveauRayon);
    }
  });
});

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



// Fonction pour remplir automatiquement les menus déroulants HTML
function remplirSelectFiltre(idSelect, donneesGeoJSON, clePropriete) {
  const selectElement = document.getElementById(idSelect);
  if (!selectElement) return;

  // 1. On extrait le nom de chaque zone géographique
  const listeZones = donneesGeoJSON.features.map(f => f.properties[clePropriete]);
          
  // 2. On trie par ordre alphabétique et on supprime les doublons
  const zonesUniques = [...new Set(listeZones)].sort();

  // 3. On crée une option HTML pour chaque zone
  zonesUniques.forEach(zone => {
    if (zone) {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = zone;
      selectElement.appendChild(option);
    }
  });
}

// Génération automatique des options des filtres à partir de Supabase
function remplirFiltresDepuisDonnees(magasins, donneesGeoJSON) {
  const selectRegion = document.getElementById('filter-region');
  const selectDpt = document.getElementById('filter-dpt');

  if (!magasins || magasins.length === 0) return;

  // 1. Remplissage des Régions uniques (Trié par ordre alphabétique)
  if (selectRegion && selectRegion.options.length <= 1) {
    const regions = [...new Set(magasins.map(m => m.region))].filter(Boolean).sort();
    regions.forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      selectRegion.appendChild(option);
    });
  }

  // 2. Remplissage des Départements rangés par Région avec leur Vrai Nom
  if (selectDpt && donneesGeoJSON && donneesGeoJSON.features) {
    // On extrait la liste des numéros de départements uniques présents dans Supabase
    selectDpt.innerHTML = `<option value="">Tous les départements</option>`;

    const dptsSupabase = [...new Set(magasins.map(m => m.dpt))].filter(Boolean);

    // On crée un dictionnaire pour retrouver le Nom et la Région d'un code dpt
    const dicoNomsDpt = {};
    donneesGeoJSON.features.forEach(f => {
      const code = f.properties.code; 
      const nom = f.properties.nom;                                
      if (code) {
        const codeString = String(code).padStart(2, '0');
        dicoNomsDpt[codeString] = nom;
      }
    });

    const listeOptionsFinales = [];

    dptsSupabase.forEach(codeDpt => {
      const codeString = String(codeDpt).padStart(2, '0');
      const vraiNom = dicoNomsDpt[codeString]||`Département ${codeString}`;
      
      listeOptionsFinales.push({
        code: codeDpt, // Valeur brute pour Supabase
        texteAffichage: `${codeString} - ${vraiNom}` // Texte propre pour l'utilisateur
      });
    });

    // On trie toute la liste par le numéro du département (01, 02, 03...)
    listeOptionsFinales.sort((a, b) => a.texteAffichage.localeCompare(b.texteAffichage));

    // On injecte les options triées dans le HTML (plus besoin de sous-groupes "Autre")
    listeOptionsFinales.forEach(item => {
      const option = document.createElement('option');
      option.value = item.code;
      option.textContent = item.texteAffichage;
      selectDpt.appendChild(option);
    });
  }
}



// ==========================================
// 🚗 MOTEUR GPS ET ITINÉRAIRES
// ==========================================
let etapesItineraire = [];
let spamLevel = 0;

function showPopup() {
  spamLevel++;
  const mainPopup = document.getElementById("popup");
  const secPopup = document.getElementById("secPopup")
  const lastPopup = document.getElementById("lastPopup")
  const PopupNoEaster = document.getElementById("PopupNoEaster")

  if(spamLevel === 1) {
    NoEasterPopup()
  }

  if(spamLevel === 3) {
    if(mainPopup) mainPopup.style.display = "block";
  }

  else if (spamLevel === 5) {
    if(secPopup) {
      secPopup.style.top = (48 + Math.random() * 4) + "%";
      secPopup.style.left = (48 + Math.random() * 4) + "%";
      secPopup.style.display = "block";
    }
  }

  else if (spamLevel=== 7) {
    if(lastPopup) {
      lastPopup.style.top = (52 + Math.random() * 4) + "%";
      lastPopup.style.left = (52 + Math.random() * 4) + "%";
      lastPopup.style.display = "block";
    }
  }
  else if (spamLevel >= 8) {
    spawnExtraPopup();
  }
}

  
function hidePopup() {
  document.getElementById("popup").style.display = "none";
}


// The chaotic infinite spam generator
function spawnExtraPopup() {
  const extraPopup = document.createElement("div");
        
  const random = 40 + Math.random() * 20;  
  
  extraPopup.style.position = "fixed";
  extraPopup.style.top = random + "%";
  extraPopup.style.left = random + "%";
  extraPopup.style.bottom = random + "%";
  extraPopup.style.right = random + "%";
  extraPopup.style.transform = "translate(-50%, -50%)";
  extraPopup.style.backgroundColor = "white";
  extraPopup.style.padding = "20px";
  extraPopup.style.border = "2px solid black";
  extraPopup.style.color = "black";
  extraPopup.style.fontWeight = "bold";
  extraPopup.style.textAlign = "center";
  extraPopup.style.zIndex = "9999";
  extraPopup.style.boxShadow = "4px 4px 15px rgba(0,0,0,0.4)";
  extraPopup.style.width = "250px";
  extraPopup.style.height = "100px";

  extraPopup.innerHTML = `
    <p>STOP CLICKING</p>
    <button onclick="this.parentElement.remove()">OK</button>
  `;
  document.body.appendChild(extraPopup);
}

function NoEasterPopup () {
  const PopupNoEaster = document.createElement("div");
        
  PopupNoEaster.style.position = "fixed";
  PopupNoEaster.style.top = 50 + "%";
  PopupNoEaster.style.left = 50 + "%";
  PopupNoEaster.style.transform = "translate(-50%, -50%)";
  PopupNoEaster.style.backgroundColor = "white";
  PopupNoEaster.style.padding = "20px";
  PopupNoEaster.style.border = "2px solid black";
  PopupNoEaster.style.color = "black";
  PopupNoEaster.style.textAlign = "center";
  PopupNoEaster.style.zIndex = "500";
  PopupNoEaster.style.boxShadow = "4px 4px 15px rgba(0,0,0,0.4)";

  PopupNoEaster.innerHTML = `
    <p>Limite de 10* distinations atteinte.</p>
    <p>* 9 établissements + Position de départ</p>
    <button onclick="this.parentElement.remove()">OK</button>
  `;
  document.body.appendChild(PopupNoEaster);
}


window.ajouterEtape = function(lng, lat, nom) {
  if(etapesItineraire.length >=9) {
      showPopup();
      return;}

  etapesItineraire.push({lat: lat, lng: lng, nom: nom});
  actualiserPanneauGPS();
};

function actualiserPanneauGPS() {
  const panneau = document.getElementById('panneau-tournee');
  const liste = document.getElementById('liste-tournee');
  const compteur = document.getElementById('compteur-tournee');

  if (!panneau || !liste) return;

  if (compteur) compteur.textContent = etapesItineraire.length;

  if (etapesItineraire.length === 0) {
    panneau.style.display = "block";
    liste.innerHTML= "<li style='color: #888; font-style: italic; font-size: 12px;'>Aucune étape sélectionnée</li>";
    return;
  }

  panneau.style.display = 'block'
  liste.innerHTML = "";

  etapesItineraire.forEach((etape, index) => {
    liste.innerHTML += `<li style="margin-bottom: 5px"><strong>${index+1}.</strong>${etape.nom}</li>`;
  });
}

window.viderTournee = function() {
  etapesItineraire = [];
  actualiserPanneauGPS();
};

window.ouvrirGoogleMaps = function() {
  if (etapesItineraire.length === 0) return;
  
  let url = 'https://www.google.com/maps/dir/';
  
  if (userPosition) {
   url += `${userPosition.lat},${userPosition.lng}/`;
  } 
  
  const coordonneesMagasins = etapesItineraire.map(etape => `${etape.lat},${etape.lng}`).join('/');
  url += coordonneesMagasins;
  window.open(url,'_blank');
  };


window.ouvrirWaze = function() {
  if (etapesItineraire.length === 0) return;
  const dest = etapesItineraire[0];
  window.open(`https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`, '_blank');
};

//=====================
//OPTIMISATION D'ITINERAIRE
//=====================

function genererPermutation(arr) {
  if(arr.length <= 1) return [arr];
  const permutations = [];
  for (let i = 0 ; i < arr.length ; i++) {
    const elementActuel = arr[i];
    const reste = arr.slice(0, i).concat(arr.slice(i+1));
    const permutationsReste = genererPermutations(reste);
    for (let perm of permutationsReste) {
      permutations.push([elementActuel].concat(perm));
    }
  } return permutations;
}

window.optimiserTournee = async function() {
  if (etapesItineraire.length < 2) {
    alert("📍 Ajouter au moins 2 magasins pour optimiser l'ordre");
  }
  
  const btnOpti = document.getElementById('btn-opti');
  
  if(btnOpti) {
    btnOpti.textContent = "Calcul Routier en cours...";
    btnOpti.style.pointerEvents = "none";
  }

  try {
    let pointsPourAPI = [];

    if(userPosition) {
      pointsPourAPI.push({lat: userPosition.lat, lng: userPosition.lng, isUser: true});
    }
    pointsPourAPI = pointsPourAPI.concat(etapesItineraire);

    const coordString = pointsPourAPI.map(p => {
      const cleanLng = parseFloat(String(p.lng).replace(',','.'));
      const cleanLat = parseFloat(String(p.lat).replace(',','.'));
      return `${cleanLng},${cleanLat}`;
    }).join(';');

    const url = `https://router.project-osrm.org/trip/v1/driving/${coordString}?source=first&roundtrip=false`;

    console.log('URL OSRM:', url);

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error(`Refus API - code = ${data.code} : ${data.message}`);
    }

    let pointsTries = new Array(pointsPourAPI.length); 
    data.waypoints.forEach((wp, indexOrigine) => {
      const indexOptimise = wp.waypoint_index;
      pointsTries[indexOptimise] = pointsPourAPI[indexOrigine];
    });

    if(userPosition) {
      pointsTries.shift();
    };

    etapesItineraire = pointsTries;
    actualiserPanneauGPS();
    
    if(btnOpti) {
      btnOpti.textContent = "✅ Trajet Optimisé !";
      btnOpti.style.backgroundColor = "#28a745";
      btnOpti.style.color = "white";

      setTimeout(() => {
        btnOpti.textContent = "⏳ Optimiser l'itinéraire";
        btnOpti.style.backgroundColor = "#ffc107";
        btnOpti.style.color = "#333";
        btnOpti.style.pointerEvents = "auto";
      }, 3000);
    }
      
  } catch (error) {
    console.error("Erreur d'optimisation OSRM :", error);
    alert("Désolé, impossible de joindre le serveur d'optimisation pour le moment.");
  } finally {
    if(btnOpti) btnOpti.textContent = "⏳ Optimiser l'itinéraire";
  }
};
