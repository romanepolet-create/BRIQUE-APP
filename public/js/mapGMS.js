let supabaseClient;
async function initialiserSupabase() {
  try {
    const reponse = await fetch('/api/config');
    const config = await reponse.json();
    
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
    console.log("Supabase connecté avec succès via le .env !");
  } catch (err) {
    console.error("Impossible de récupérer la config Supabase :", err);
  }
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
let lastUpdatePosition = null; 
const matriceGMS = {
  "AUCHAN HM": {
    obligatoire: ["LB75", "NQ75", "YT75", "ML75", "LB33", "NQ33",  "YT33"],
    facultatif: [],
    direct: ["LB44", "NQ44", "YT44", "ML44", "SH75", "TC75", "UA33", "DB44"]
  },
  "AUCHAN SM": {
    obligatoire: [],
    facultatif: ["LB75", "NQ75", "YT75", "ML75", "LB33", "NQ33", "YT33"],
    direct: ["SH75", "TC75", "LB44", "NQ44", "YT44", "ML44", "UA33"]
  }, 
  "CASINO": {
    obligatoire: ["LB44", "NQ44", "YT44", "LB33"],
    facultatif: [],
    direct: ["LB75", "NQ75", "ML75", "YT75", "SH75", "TC75", "ML44", "NQ33", "YT33", "UA33", "DB44"]
  },
  "FRANPRIX": {
    obligatoire: ["LB44", "YT44"],
    facultatif: [],
    direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "NQ44", "ML44", "LB33", "NQ33", "YT33", "UA33", "DB44"]
  },
  "MONOPRIX": {
    obligatoire: ["LB75", "LB44", "NQ44", "YT44"],
    facultatif: [],
    direct: ["NQ75", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "NQ33", "YT33", "UA33", "DB44"]
  },
  "CRF HYPER": {
    obligatoire: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"],
    facultatif: [],
    direct: ["SH75", "NQ44", "YT44", "LB33", "NQ33", "YT33", "UA33", "DB44"]
  },
  "CRF MARKET": {
    obligatoire: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"],
    facultatif: [],
    direct: ["NQ44", "YT44", "SH75", "LB33", "NQ33", "YT33", "UA33", "DB44"]
  },
  "CRF PROXI": {
    obligatoire: [],
    facultatif: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"],
    direct: ["SH75", "NQ44", "YT44", "LB33", "NQ33", "YT33", "UA33", "DB44"]
  },
  "ITM PROXI": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
  "ITM SM": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
  "LECLERC": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
  "LECLERC PROXI": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
"OTERA": {
    obligatoire: ["LB44", "NQ44", "YT44", "ML44"],
    facultatif: [],
    direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "LB33", "NQ33", "YT33", "UA33", "DB44"]
  },
"SUPER U": {
  obligatoire: [],
  facultatif: [],
  direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
"G 20": {
  obligatoire: [],
  facultatif: [],
  direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
"U EXPRESS": {
  obligatoire: [],
  facultatif: [],
  direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
"LECLERC DRIVE": {
  obligatoire: [],
  facultatif: [],
  direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
"MATCH": {
  obligatoire: [],
  facultatif: [],
  direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  },
"NICOLAS": {
  obligatoire: ["NQ33", "YT33", "ML44", "LB44"],
  facultatif: [],
  direct: ["LB75", "ML75", "TC75", "NQ75", "SH75", "YT75", "NQ44","YT44", "LB33", "UA33", "DB44"]
  },
"AUTRES": {
  obligatoire: [],
  facultatif: [],
  direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB44"]
  }
};

let joursOuvres = [];
let jourSelectionneId = null;
let memoireGlobaleTournees = {};

function genererJoursOuvres() {
    joursOuvres = [];
    let date = new Date();
    const nomsJours = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    
    while (joursOuvres.length < 5) {
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            joursOuvres.push({
                id: date.toISOString().split('T')[0],
                label: joursOuvres.length === 0 ? "Auj." : `${nomsJours[date.getDay()]} ${date.getDate()}`
            });
        }
        date.setDate(date.getDate() + 1);
    }
    jourSelectionneId = joursOuvres[0].id;
}

function afficherSliderJours() {
    const container = document.getElementById('slider-jours');
    if (!container) return;
    
    container.innerHTML = joursOuvres.map(jour => `
        <button type="button" class="btn-jour ${jour.id === jourSelectionneId ? 'actif' : ''}" 
                onclick="changerJour('${jour.id}')">
            ${jour.label}
        </button>
    `).join('');
}

window.changerJour = function(nouvelId) {
    memoireGlobaleTournees[jourSelectionneId] = [...etapesItineraire];
    jourSelectionneId = nouvelId;
    etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
    
    afficherSliderJours();
    actualiserPanneauGPS();
    filtrerMagasins();
};

function formatEmailToName(email) {
  if (!email) return "Utilisateur inconnu";
    const namePart = email.split('@')[0]; 
    const parts = namePart.split('.'); 
    const formattedName = parts.map(part => {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join(' ');
  return formattedName;
}

function normaliserTexte(texte) {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

//CARTE LEAFLET
const map = L.map('map', {preferCanvas: true}).setView([46.603354, 1.888334], 5);
  // 2. Charge le fond de carte (OpenStreetMap gratuit & propre)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  }).addTo(map);

L.Control.Fullscreen = L.Control.extend({
  onAdd: function(map) {
    var btn = L.DomUtil.create('button', 'leaflet-bar');
    btn.innerHTML = '⛶'; // Icône plein écran
    btn.style.backgroundColor = 'white';
    btn.style.width = '34px';
    btn.style.height = '34px';
    btn.style.fontSize = '20px';
    btn.style.lineHeight = '30px';
    btn.style.cursor = 'pointer';
    btn.style.border = '2px solid rgba(0,0,0,0.2)';
    btn.title = "Mettre la carte en plein écran";

    btn.onclick = function(){
      const mapEl = document.getElementById('map');
      if (!document.fullscreenElement) {
        if (mapEl.requestFullscreen) mapEl.requestFullscreen();
        else if (mapEl.webkitRequestFullscreen) mapEl.webkitRequestFullscreen(); // Safari
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); // Safari
      }
    }
    return btn;
  }
});
new L.Control.Fullscreen({ position: 'topleft' }).addTo(map);

markerConteneur = L.markerClusterGroup({
  maxClusterRadius: 20,
  disableClusterAtZoom: 11,
  chunkedLoading: true,
  chunkInterval: 50,
  chunkDelay: 10
}).addTo(map);

async function initialiserCarte() {
  await initialiserSupabase();
  console.log("Démarrage de la carte...");
  await chargerUtilisateurConnecte();
  await chargerGeoJSON();
  await chargerDonneesMagasins();

  await chargerTourneeMemoire();

  activerGeolocalisation();

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
};

// ============================================================
// DETECTION DE L'UTILISATEUR CONNECTE
// ============================================================
// Variable globale pour stocker le propriétaire actuel
let proprietaireActuel = "";

async function chargerUtilisateurConnecte() {
  try {
  const reponse = await fetch('/api/config');
    const data = await reponse.json();

  if (data.emailActuel) {
      proprietaireActuel = formatEmailToName(data.emailActuel); 
      console.log("Connecté en tant que :", proprietaireActuel);
  
    } else {
      console.warn("Aucune session utilisateur trouvée via le serveur.");
    }
  } catch (err) {
    console.error("Erreur de récupération de l'utilisateur :", err);
  }
}

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
        fillColor: 'transparent',
        weight: 1,
        opacity: 0.5,
        color: 'gray',
        fillOpacity: 0.3
      },
    }).addTo(map);

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

  navigator.geolocation.watchPosition(function(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const newPosition = L.latLng(lat, lng);

  userPosition = newPosition;   

    if (userMarker) {
      userMarker.setLatLng(userPosition);
    } else {
      const iconeBleue = L.divIcon({
        className: 'user-gps-marker',
        html: '<div class="user-gps-dot"></div>',
        iconSize: [20, 20]
      });
      userMarker = L.marker(userPosition, { icon: iconeBleue }).addTo(map);
      map.setView(userPosition, 12);
    }

  if (!lastUpdatePosition || map.distance(lastUpdatePosition, userPosition) > 20) {
        lastUpdatePosition = userPosition;
        filtrerMagasins();
    } else {
        majListeMagasinsVisibles();
    }
    
  }, function(error) {
    console.warn("Erreur GPS : ", error.message);
    alert("Impossible de récupérer ta position GPS.");
  }, {
    enableHighAccuracy: true
  });
};

// =================================================
// GESTION DES MAGASINS ET DE LA BULLE HUBSPOT
// =================================================
function getCouleurEnseigne(enseigne) {
  if(!enseigne) return "#555555";
  const enseignePropre = enseigne.trim().toUpperCase();

    const couleurs = {
      "SUPER U": "#7304E7",
    "MONOPRIX": "#f8de0d",
    "AUCHAN SM": "#f8190d",
    "CRF MARKET": "#3002d4",
    "LECLERC PROXI": "#fa1ee5",
    "LECLERC": "#ff99f5",
    "ITM SM": "#01981e",
    "ITM PROXI": "#14fa23",
    "FRANPRIX": "#fe3943",
    "CRF PROXI": "#4dbeff",
    "CRF HYPER": "#4d7fff",
    "CASINO": "#baab2c",
    "AUCHAN HM": "#fe7e71",
    "OTERA": "#ff871f",
     "MATCH": "#d1001f",
       "U EXPRESS": "#a000ff",
     "LECLERC DRIVE": "#ff66cc",
     "G 20": "#00b050",
     "NICOLAS": "#cc540e",
     "AUTRES": "#808080",
    } 
    return couleurs[enseignePropre] || "#555555";
 }


async function chargerDonneesMagasins() {
  console.time("affichage");
  try {
    const response = await fetch('/api/gms');
    if (!response.ok) throw new Error("Erreur réseau GMS");
    
    listeMagasins = await response.json();

  const { data: historique, error } = await supabaseClient
      .from('historique_visites')
      .select('hubspot_id, derniere_visite, references');

  if (!error && historique) {
    const dicoHistorique = {};     
    
    historique.forEach(h => {
          let aDesBieres = false;
      if (h.references && typeof h.references === 'object') {
            aDesBieres = Object.values(h.references).some(val => val === "OUI" || val === "Gagné" || val === "Constaté");
        }
        dicoHistorique[h.hubspot_id] = {
            derniere_visite: h.derniere_visite,
            aFormulaire: true,
            possedeBH: aDesBieres,
        references: h.references || {}
        };
        });

    listeMagasins.forEach(magasin => {
        const hist = dicoHistorique[magasin.hubspot_id];
        if (hist) {
            magasin.derniere_visite = hist.derniere_visite;
            magasin.aFormulaire = true;
            magasin.possedeBH = hist.possedeBH;
        magasin.references = hist.references;
        } else {
            magasin.derniere_visite = null;
            magasin.aFormulaire = false;
            magasin.possedeBH = false;
        magasin.references = {};
        }
      });
    } else {
      console.warn("Impossible de récupérer l'historique pour le filtrage :", error);
    }

    remplirFiltresDepuisDonnees(listeMagasins, donneesGeo);
    console.log("Nombre de magasins reçus :", listeMagasins.length);
  console.log("avant affichage");

  filtrerMagasins()

    console.log("apres affichage");
  } catch (err) {
    console.error("Impossible de charger les magasins :", err);
  }
  console.timeEnd("affichage");

}

let nomEchappe

function afficherMagasinsSurCarte(magasins) {
  markerConteneur.clearLayers();
  const nouveauxMarkers = [];

  magasins.forEach(magasin => {
    const positionMagasin = L.latLng(magasin.lat, magasin.lng);
  const couleurPin = getCouleurEnseigne(magasin.enseigne);

    const marker = L.circleMarker(positionMagasin, {
      radius: 4,
      fillColor: couleurPin,
      fillOpacity: 0.85,
      color: 'transparent',
      weight: 15
    })

  marker.magasinData = magasin;
    marker.on('click', function(e) {
     ouvrirPopupDynamique(e.target);
  });
    nouveauxMarkers.push(marker);
    });
  
  markerConteneur.addLayers(nouveauxMarkers);
  majListeMagasinsVisibles()
}

window.ouvrirPopupDynamique = function(layer) {
    const m = layer.magasinData;
    if (!m) return;

    const nomEchappe = m.nom ? m.nom.replace(/'/g, "\\'") : "Magasin";
    const lienHubspot = `https://app.hubspot.com/contacts/${PORTAL_ID}/company/${m.hubspot_id}`;
  const urlFormPopup = `/formGMS.html?id_hubspot=${m.hubspot_id}&nom=${encodeURIComponent(m.nom)}&enseigne=${encodeURIComponent(m.enseigne)}&premiere_visite=${!m.derniere_visite}`;
    
  const adresseEchappe = `${m.adresse || ''} ${m.ville || ''}`.replace(/'/g, "\\'");
  let prio = m.Priorité || "?";
    let dateTexte = " - Aucune visite";

  if (m.derniere_visite) {
        const dateVisite = new Date(m.derniere_visite);
        const jj = String(dateVisite.getDate()).padStart(2, '0');
        const mm = String(dateVisite.getMonth() + 1).padStart(2, '0');

    const diffTemps = new Date() - dateVisite;
        const diffJours = Math.floor(diffTemps / (1000 * 60 * 60 * 24));
        
        dateTexte = ` - ${jj}/${mm} (il y a ${diffJours} j)`;
    }
  
    const contenuBulle = `
        <div class="popup-container">
          <h4 class="popup-title">${m.nom}</h4>
          <p class="popup-address">${m.adresse ? m.adresse + ', ' : ''}${m.code_postal || ''} ${m.ville || ''}</p>
          <p class="popup-prio">${prio}${dateTexte}</p>

          <div class="popup-row">
            <a href="${lienHubspot}" target="_blank" class="popup-btn btn-hs">
              <img src="https://www.hubspot.com/hubfs/assets/hubspot.com/style-guide/brand-guidelines/guidelines_the-sprocket.svg" style="width: 14px; height: 14px;" alt="Logo HS"> HS
            </a>
            <button onclick="creerTacheAgenda('${nomEchappe}', '${adresseEchappe}')" class="popup-btn btn-task">📅 Tâche</button>
          </div>

          <button onclick="ajouterEtape(${m.lng}, ${m.lat}, '${nomEchappe}', '${m.hubspot_id}', '${m.enseigne}')" class="popup-btn btn-add">📍 Ajouter à l'itinéraire</button>
          
          <div class="popup-row">
            <button data-url="${urlFormPopup}" onclick="window.open(this.dataset.url, '_blank')" class="popup-btn btn-visit">📝 Visite</button>
            <button data-url="${urlFormPopup}&open_notes=true" onclick="window.open(this.dataset.url, '_blank')" class="popup-btn btn-notes">💬 Notes</button>
          </div>
        </div>
    `;

    L.popup({ autoPanPadding: [50, 50] })
        .setLatLng(layer.getLatLng())
        .setContent(contenuBulle)
        .openOn(map);
};

window.clicSurListe = function(layerId) {
    const layer = markerConteneur.getLayer(layerId);
    
    if (layer) {
        map.panTo(layer.getLatLng()); 
        ouvrirPopupDynamique(layer);
    }
};

// ==========================================
// LISTE DES MAGASINS VISIBLES À L'ÉCRAN
// ==========================================
window.majListeMagasinsVisibles = function() {
  const conteneurListe = document.getElementById('liste-visibles-content');
  if (!conteneurListe) return;

  const limitesEcran = map.getBounds();
  let html = '';
  let count = 0;
  
  let magasinsVisiblesTemp = [];
  const idsDejaVus = new Set();

 markerConteneur.eachLayer(function(layer) {
    if (limitesEcran.contains(layer.getLatLng())) {
      const m = layer.magasinData;
      const cleUnique = (m.hubspot_id && m.hubspot_id !== 'undefined') ? m.hubspot_id : m.nom;
      
      if (m && !idsDejaVus.has(cleUnique)) {
        idsDejaVus.add(cleUnique);
    let distance = Infinity;
    if (userPosition) {
          distance = map.distance(userPosition, layer.getLatLng());
        }
        
        magasinsVisiblesTemp.push({
          magasin: m,
          layer: layer,
          distance: distance
        });
      }
    }
  });

  magasinsVisiblesTemp.sort((a, b) => {
    if (userPosition && a.distance !== Infinity && b.distance !== Infinity) {
      return a.distance - b.distance;
    } else {
      const enseigneA = (a.magasin.enseigne || "").toLowerCase();
      const enseigneB = (b.magasin.enseigne || "").toLowerCase();
      if (enseigneA !== enseigneB) {
        return enseigneA.localeCompare(enseigneB);
      }
      const nomA = (a.magasin.nom || "").toLowerCase();
      const nomB = (b.magasin.nom || "").toLowerCase();
      return nomA.localeCompare(nomB);
    }
  });

  magasinsVisiblesTemp.forEach(item => {
    const m = item.magasin;
    count++;
    
    if (count <= 100) {
      const couleur = getCouleurEnseigne(m.enseigne);
      let distanceTexte = '';

      if (userPosition && item.distance !== Infinity) {
        if (item.distance < 1000) {
          distanceTexte = `<span class="list-dist">${Math.round(item.distance)} m</span>`;
        } else {
          distanceTexte = `<span class="list-dist">${(item.distance / 1000).toFixed(1)} km</span>`;
        }
    }

    const urlFormList = `/formGMS.html?id_hubspot=${m.hubspot_id}&nom=${encodeURIComponent(m.nom)}&enseigne=${encodeURIComponent(m.enseigne)}&premiere_visite=${!m.derniere_visite}`;
      
      html += `
        <div onclick="clicSurListe(${item.layer._leaflet_id})" class="list-item">
          <span class="list-dot" style="background:${couleur};"></span>
          <div class="list-text">
            <span class="list-title">${m.nom}</span>
            <span class="list-prio">${m.Priorité}</span>
          </div>
          ${distanceTexte}
          <button data-url="${urlFormList}" onclick="event.stopPropagation(); window.open(this.dataset.url, '_blank')" title="Ouvrir le formulaire de visite" class="list-btn-edit">📝</button>
        </div>
      `;
    }
  });

  if (count > 100) {
    html += `<div style="padding: 10px; text-align: center; color: #888; font-style: italic; font-size: 11px;">+ ${count - 100} autres magasins (zoomez pour affiner)</div>`;
  } else if (count === 0) {
    html = `<div style="padding: 10px; text-align: center; color: #888; font-style: italic; font-size: 12px;">Zoomer sur la carte pour lister les magasins</div>`;
  }

  conteneurListe.innerHTML = html;
};

map.on('moveend', majListeMagasinsVisibles);
map.on('zoomend', majListeMagasinsVisibles);


// ================
// FILTRES
// ================
window.filtrerMagasins = function() {
  const rechercheTexte = document.getElementById('search-bar') ? document.getElementById('search-bar').value.toLowerCase() : "";
  const afficherSeulementTournee = document.getElementById('toggle-selected') ? document.getElementById('toggle-selected').checked : false;
  const tdnValue = parseInt(document.getElementById('filter-tdn') ? document.getElementById('filter-tdn').value : -1);
  const tdn75Value = parseInt(document.getElementById('filter-tdn75') ? document.getElementById('filter-tdn75').value : -1);

  const getValeursSelectionnees = (id) => {
    const container = document.getElementById(id);
    if (!container) return [];
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  };

    const enseignesSel = getValeursSelectionnees('dropdown-enseigne');
  const prioSel = getValeursSelectionnees('dropdown-prio');
  const propriosSel = getValeursSelectionnees('dropdown-proprio');
  const visiteSel = document.querySelector('input[name="filtre_visite"]:checked')?.value || "all";

    const magasinsFiltres = listeMagasins.filter(magasin => {

    if (afficherSeulementTournee) {
      const estDansTournee = etapesItineraire.some(etape => etape.lat === magasin.lat && etape.lng === magasin.lng && !etape.masque);
      if (!estDansTournee) return false;
    }

    if (rechercheTexte !== "") {
      const nom = magasin.nom ? magasin.nom.toLowerCase() : "";
      const ville = magasin.ville ? magasin.ville.toLowerCase() : "";
      const adresse = magasin.adresse ? magasin.adresse.toLowerCase() : "";
      
      if (!nom.includes(rechercheTexte) && !ville.includes(rechercheTexte) && !adresse.includes(rechercheTexte)) {
        return false;
      }
    }

  const filtreBH = document.getElementById('toggle-bh') ? parseInt(document.getElementById('toggle-bh').value) : 0;

  if (filtreBH === 1) {
      if (!magasin.aFormulaire || !magasin.possedeBH) return false;
  } else if (filtreBH === -1) {
      if (magasin.aFormulaire && magasin.possedeBH) return false;
  }

    // 1. ENSEIGNES
    if (enseignesSel.length === 0) {
        if (magasin.enseigne === "G 20" || magasin.enseigne === "LECLERC DRIVE") return false;
    } else {
        if (!enseignesSel.includes(magasin.enseigne)) return false;
    }

  // Filtre Priorité
    if (prioSel.length > 0 && !prioSel.includes(magasin.Priorité)) return false;

  //date derniere visite
  if (visiteSel !== "all") {
    if (visiteSel === "never") {
      if (magasin.derniere_visite) return false; 
    } else {
      if (!magasin.derniere_visite) return false;

      const dateVisite = new Date(magasin.derniere_visite);
      const joursEcoules = (new Date() - dateVisite) / (1000 * 60 * 60 * 24);

      if (visiteSel === "1week" && joursEcoules > 7) return false;
      if (visiteSel === "2weeks" && (joursEcoules <= 7 || joursEcoules > 14)) return false;
      if (visiteSel === "1month" && (joursEcoules <= 14 || joursEcoules > 30)) return false;
      if (visiteSel === "2months" && joursEcoules <= 30) return false;
    }
  }

  if (propriosSel.length > 0) {
      const propMagasin = magasin.Propriétaire || "";
  
    const matchProprio = propriosSel.some(propSelectionne =>
      normaliserTexte(propSelectionne) === normaliserTexte(propMagasin)
    );
    
      if (!matchProprio) return false;
    }

    if (tdnValue !== -1 || tdn75Value !== -1) {
      const enseigneMagasin = magasin.enseigne ? magasin.enseigne.toUpperCase() : "";
      const regles = matriceGMS[enseigneMagasin];
      
      if (regles && regles.obligatoire) {
        let manquantTotal = 0;
        let manquant75 = 0;
        
        regles.obligatoire.forEach(biere => {
          const cleBdd = `ref_${biere.replace(/\s+/g, '')}`; 
          const valBDD = magasin.references && magasin.references[cleBdd];
          const estPresente = valBDD === "OUI" || valBDD === "Gagné" || valBDD === "Constaté";
          
          if (!estPresente) {
            manquantTotal++;
            if (biere.includes("75")) {
              manquant75++;
            }
          }
        });

        if (tdnValue !== -1) {
          if (tdnValue === 5 && manquantTotal < 5) return false;
          if (tdnValue !== 5 && manquantTotal !== tdnValue) return false;
        }

        if (tdn75Value !== -1) {
          if (tdn75Value === 5 && manquant75 < 5) return false;
          if (tdn75Value !== 5 && manquant75 !== tdn75Value) return false;
        }

      } else {
        if (tdnValue > 0 || tdn75Value > 0) return false;
      }
    }

    return true; // Le magasin passe tous les filtres !
  });

  afficherMagasinsSurCarte(magasinsFiltres);
};

// Fonction pour remplir automatiquement les menus déroulants HTML
function remplirSelectFiltre(idSelect, donneesGeoJSON, clePropriete) {
  const selectElement = document.getElementById(idSelect);
  if (!selectElement) return;

  const listeZones = donneesGeoJSON.features.map(f => f.properties[clePropriete]);
  const zonesUniques = [...new Set(listeZones)].sort();

  zonesUniques.forEach(zone => {
    if (zone) {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = zone;
      selectElement.appendChild(option);
    }
  });
}

function remplirFiltresDepuisDonnees(magasins, donneesGeoJSON) {
  const containerRegion = document.getElementById('dropdown-region');
  const containerDpt = document.getElementById('dropdown-dpt');
  const containerProprio = document.getElementById('dropdown-proprio');

  if (!magasins || magasins.length === 0) return;

  if (containerRegion && containerRegion.innerHTML.trim() === "") {
    const regions = [...new Set(magasins.map(m => m.region))].filter(Boolean).sort();
    regions.forEach(region => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${region}" onchange="filtrerMagasins()"> ${region}`;
      containerRegion.appendChild(label);
    });
  }

  if (containerDpt && donneesGeoJSON && donneesGeoJSON.features && containerDpt.innerHTML.trim() === "") {
    const dptsSupabase = [...new Set(magasins.map(m => m.dpt))].filter(Boolean);
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
        code: codeDpt,
        texteAffichage: `${codeString} - ${vraiNom}`
      });
    });

    listeOptionsFinales.sort((a, b) => a.texteAffichage.localeCompare(b.texteAffichage));

    listeOptionsFinales.forEach(item => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${item.code}" onchange="filtrerMagasins()"> ${item.texteAffichage}`;
      containerDpt.appendChild(label);
    });
  }

  if (containerProprio) {
    containerProprio.innerHTML = "";
    let proprios = [...new Set(magasins.map(m => m.Propriétaire))].filter(Boolean);
    const isManager = proprietaireActuel && normaliserTexte(proprietaireActuel) === normaliserTexte("Leo Blanchet");

    if (proprietaireActuel && !isManager) {
      const existeDeja = proprios.some(p => normaliserTexte(p) === normaliserTexte(proprietaireActuel));
      if (!existeDeja) {
        proprios.push(proprietaireActuel);
      }
    }

  proprios.sort();

    proprios.forEach(prop => {
      const label = document.createElement('label');
      
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = prop;
      input.onchange = filtrerMagasins;

      if (proprietaireActuel && !isManager && normaliserTexte(prop) === normaliserTexte(proprietaireActuel)) {
        input.checked = true; 
      }

      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + prop));
      containerProprio.appendChild(label);
    });
  }
}

window.toggleDropdown = function(id) {
  document.getElementById(id).classList.toggle('show');
};

window.onclick = function(event) {
  if (!event.target.closest('.custom-select') && !event.target.closest('.select-right')) {
    document.querySelectorAll('.dropdown-list').forEach(el => el.classList.remove('show'));
  }
};

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

  if(spamLevel === 1) { NoEasterPopup() }

  if(spamLevel === 3) {
    if(mainPopup) mainPopup.style.display = "block";
  } else if (spamLevel === 5) {
    if(secPopup) {
      secPopup.style.top = (48 + Math.random() * 4) + "%";
      secPopup.style.left = (48 + Math.random() * 4) + "%";
      secPopup.style.display = "block";
    }
  } else if (spamLevel=== 7) {
    if(lastPopup) {
      lastPopup.style.top = (52 + Math.random() * 4) + "%";
      lastPopup.style.left = (52 + Math.random() * 4) + "%";
      lastPopup.style.display = "block";
    }
  } else if (spamLevel >= 8) {
    spawnExtraPopup();
  }
}

function hidePopup() {
  document.getElementById("popup").style.display = "none";
}

function spawnExtraPopup() {
  const extraPopup = document.createElement("div");
  const random = 40 + Math.random() * 20;  
  
  extraPopup.className = "custom-modal";
  extraPopup.style.top = random + "%";
  extraPopup.style.left = random + "%";
  extraPopup.style.width = "250px";
  extraPopup.innerHTML = `<p>STOP CLICKING</p><button onclick="this.parentElement.remove()">OK</button>`;
  document.body.appendChild(extraPopup);
}

function NoEasterPopup () {
  const PopupNoEaster = document.createElement("div");
  PopupNoEaster.className = "custom-modal";
  PopupNoEaster.style.top = "50%";
  PopupNoEaster.style.left = "50%";
  PopupNoEaster.innerHTML = `<p>Limite de 10* distinations atteinte.</p><p>* 9 établissements + Position de départ</p><button onclick="this.parentElement.remove()">OK</button>`;
  document.body.appendChild(PopupNoEaster);
}

function PopupDejaDansTournee(onConfirm) {
  const DejaPopup = document.createElement("div");
  DejaPopup.className = "custom-modal";
  DejaPopup.style.top = "50%";
  DejaPopup.style.left = "50%";
  DejaPopup.style.width = "250px";
  DejaPopup.innerHTML = `
    <p>Cet établissement est déjà dans votre tournée.</p>
    <p>Voulez-vous quand même l'ajouter ?</p>
    <div class="modal-actions">
      <button id="DejaPopupOUI" class="btn-modal-yes">OUI</button>
      <button id="DejaPopupNON" class="btn-modal-no">NON</button>
    </div>
  `;
  document.body.appendChild(DejaPopup);
  document.getElementById('DejaPopupOUI').onclick = function() { DejaPopup.remove(); if(typeof onConfirm === "function") onConfirm(); };
  document.getElementById('DejaPopupNON').onclick = function() { DejaPopup.remove(); };
}

window.ajouterEtape = function(lng, lat, nom, hubspot_id, enseigne) {
  const activeCount = etapesItineraire.filter(e => !e.masque).length;
  if(activeCount >= 9) {
      showPopup();
      return;
  }

  const magasinDejaPresent = etapesItineraire.some(etape => etape.hubspot_id === hubspot_id);

  const executerAjout = () => {
    etapesItineraire.push({lat: lat, lng: lng, nom: nom, hubspot_id: hubspot_id, enseigne: enseigne, masque: false, isFinal: false});
    actualiserPanneauGPS();
    filtrerMagasins();
    sauvegarderTourneeMemoire();
    afficherToast(`✅ ${nom} a bien été ajouté à la tournée`);
  };

  if (magasinDejaPresent) {
    PopupDejaDansTournee(executerAjout);
  } else {
    executerAjout();
  }
};

window.supprimerEtape = function(index) {
  etapesItineraire.splice(index, 1);
  actualiserPanneauGPS();
  filtrerMagasins(); 

  sauvegarderTourneeMemoire();
};

window.toggleMasqueEtape = function(index) {
  if (etapesItineraire[index].masque) {
    const activeCount = etapesItineraire.filter(e => !e.masque).length;
    if (activeCount >= 9) {
      showPopup();
      return;
    }
  }
  etapesItineraire[index].masque = !etapesItineraire[index].masque;
  actualiserPanneauGPS();
  filtrerMagasins();
  sauvegarderTourneeMemoire();
};

window.toggleFinalEtape = function(index) {
  const currentStatus = etapesItineraire[index].isFinal;
  etapesItineraire.forEach(e => e.isFinal = false);
  if (!currentStatus) {
    etapesItineraire[index].isFinal = true;
  }
  actualiserPanneauGPS();
  sauvegarderTourneeMemoire();
};

function actualiserPanneauGPS() {
  const panneau = document.getElementById('panneau-tournee');
  const liste = document.getElementById('liste-tournee');
  const compteur = document.getElementById('compteur-tournee');

  if (!panneau || !liste) return;

  const activeCount = etapesItineraire.filter(e => !e.masque).length;
  if (compteur) compteur.textContent = activeCount;

  if (etapesItineraire.length === 0) {
    panneau.style.display = "block";
    liste.innerHTML = "<li class='tournee-empty'>Aucune étape sélectionnée</li>";
    return;
  }

  panneau.style.display = 'block';
  liste.innerHTML = "";

  etapesItineraire.forEach((etape, index) => {
    const magasinComplet = listeMagasins.find(m => String(m.hubspot_id) === String(etape.hubspot_id)) || {};
    let contenuTexte = `<span class="tournee-no-link">${etape.nom} - ${magasinComplet.Priorité}</span>`;
    const urlForm = `/formGMS.html?id_hubspot=${etape.hubspot_id}&nom=${encodeURIComponent(etape.nom)}&enseigne=${encodeURIComponent(etape.enseigne)}&premiere_visite=${!magasinComplet.derniere_visite}`;    
    const colorLink = etape.masque ? '#999' : '#005baa';

    if (etape.hubspot_id && etape.hubspot_id !== 'undefined') {
      contenuTexte = `<a href="${urlForm}" target="_blank" class="tournee-link" style="color: ${colorLink};">${etape.nom} - ${magasinComplet.Priorité}</a>`;    
    }
    
    const styleLigne = etape.masque ? "opacity: 0.5; text-decoration: line-through;" : "";

    const nomEchappe = etape.nom ? etape.nom.replace(/'/g, "\\'") : "Magasin";
    const adresseEchappe = `${magasinComplet.adresse || ''} ${magasinComplet.ville || ''}`.replace(/'/g, "\\'");
    
    const btnTache = `<button onclick="creerTacheAgenda('${nomEchappe}', '${adresseEchappe}')" title="Ajouter une tâche / rappel" class="btn-icon">📅</button>`;

    const btnMasque = etape.masque
      ? `<button onclick="toggleMasqueEtape(${index})" title="Réafficher" class="btn-icon btn-eye">👁️<span class="eye-slash"></span></button>`
      : `<button onclick="toggleMasqueEtape(${index})" title="Masquer temporairement" class="btn-icon btn-eye">👁️</button>`;

    const btnFinal = etape.isFinal
      ? `<button onclick="toggleFinalEtape(${index})" title="Retirer de la fin" class="btn-flag-on">🏁</button>`
      : `<button onclick="toggleFinalEtape(${index})" title="Verrouiller à la fin" class="btn-flag-off">🏁</button>`;

    liste.innerHTML += `
      <li class="tournee-item" style="${styleLigne}">
        <span class="tournee-text"><strong>${index+1}.</strong> ${contenuTexte}</span>
        <div class="tournee-actions">
          ${btnTache}
          ${btnFinal}
          ${btnMasque}
          <button class="btn-delete" onclick="supprimerEtape(${index})" title="Retirer">✖</button>
        </div>
      </li>
    `;
  });
}


window.viderTournee = function() {
  etapesItineraire = [];
  actualiserPanneauGPS();
  filtrerMagasins();
  sauvegarderTourneeMemoire();
};

window.ouvrirGoogleMaps = function() {
  const etapesActives = etapesItineraire.filter(e => !e.masque); // EXCLURE MASQUÉS
  if (etapesActives.length === 0) return;
  
  let url = 'https://www.google.com/maps/dir/';
  if (userPosition) url += `${userPosition.lat},${userPosition.lng}/`;
  
  const coordonneesMagasins = etapesActives.map(etape => `${etape.lat},${etape.lng}`).join('/');
  url += coordonneesMagasins;
  window.open(url,'_blank');
};


window.ouvrirWaze = function() {
  const etapesActives = etapesItineraire.filter(e => !e.masque);
  if (etapesActives.length === 0) return;
  const dest = etapesActives[0]; // Waze ne prend que la 1ère destination
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
  const activeStops = etapesItineraire.filter(e => !e.masque);
  const hiddenStops = etapesItineraire.filter(e => e.masque); // On les garde de côté

  if (activeStops.length < 2) {
    alert("📍 Ajoutez au moins 2 magasins actifs (non masqués) pour optimiser l'ordre");
    return;
  }
  
  const btnOpti = document.getElementById('btn-opti');
  if(btnOpti) {
    btnOpti.textContent = "Calcul Routier en cours...";
    btnOpti.style.pointerEvents = "none";
  }

 try {
    let pointsPourAPI = [];
    if(userPosition) pointsPourAPI.push({lat: userPosition.lat, lng: userPosition.lng, isUser: true});

    // On cherche l'étape avec le drapeau final
    let stopsToOptimize = [...activeStops];
    const finalStopIndex = stopsToOptimize.findIndex(e => e.isFinal);
    let finalStop = null;
    let hasDestinationLast = false;

    // Si on a une destination finale, on la retire du milieu pour la forcer à la toute fin
    if (finalStopIndex !== -1) {
      finalStop = stopsToOptimize.splice(finalStopIndex, 1)[0];
      hasDestinationLast = true;
    }

pointsPourAPI = pointsPourAPI.concat(stopsToOptimize);
    if (finalStop) pointsPourAPI.push(finalStop); // 🏁 Placée tout à la fin

    // Création de la chaîne de coordonnées
    const coordString = pointsPourAPI.map(p => {
      const cleanLng = parseFloat(String(p.lng).replace(',','.'));
      const cleanLat = parseFloat(String(p.lat).replace(',','.'));
      return `${cleanLng},${cleanLat}`;
    }).join(';');

    let url = `https://router.project-osrm.org/trip/v1/driving/${coordString}?source=first&roundtrip=false`;
    if (hasDestinationLast) url += `&destination=last`; // Force l'API à garder le dernier point à la fin



  
    const response = await fetch(url);
    const data = await response.json();


    if (data.code !== 'Ok') throw new Error(`Refus API : ${data.message}`);

      let pointsTries = new Array(pointsPourAPI.length); 
    data.waypoints.forEach((wp, indexOrigine) => {
      const indexOptimise = wp.waypoint_index;
      pointsTries[indexOptimise] = pointsPourAPI[indexOrigine];
    });

  if(userPosition) pointsTries.shift(); // Retire la géoloc des étapes affichées

    // L'itinéraire final = Les actifs triés + les masqués collés à la fin
    etapesItineraire = [...pointsTries, ...hiddenStops];
    actualiserPanneauGPS();
  sauvegarderTourneeMemoire();
    
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
    console.error("Erreur OSRM :", error);
    alert("Désolé, impossible de joindre le serveur d'optimisation pour le moment.");
  } finally {
    if(btnOpti) {
      btnOpti.textContent = "⏳ Optimiser l'itinéraire";
      btnOpti.style.pointerEvents = "auto";
    }
  }
};


// Fonction pour afficher le petit message de succès
window.afficherToast = function(message) {
  let toast = document.getElementById("toast-notification");
  
  // Si le toast n'existe pas encore dans le HTML, on le crée à la volée
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.className = "toast-show";
  
  // On retire la classe après 3 secondes (3000 ms) pour qu'il disparaisse
  setTimeout(function() { 
    toast.className = toast.className.replace("toast-show", ""); 
  }, 3000);
};

initialiserCarte();


window.reinitialiserFiltres = function() {
  const searchBar = document.getElementById('search-bar');
  if (searchBar) searchBar.value = "";

  const toggleBh = document.getElementById('toggle-bh');
  if (toggleBh) toggleBh.value = "0";

  const filterTdn = document.getElementById('filter-tdn');
  if (filterTdn) {
    filterTdn.value = "-1";
    document.getElementById('tdn-val').innerText = "Tous";
  }
  
  const filterTdn75 = document.getElementById('filter-tdn75');
  if (filterTdn75) {
    filterTdn75.value = "-1";
    document.getElementById('tdn75-val').innerText = "Tous";
  }

  document.querySelectorAll('.dropdown-list input[type="checkbox"]').forEach(cb => {
      if (!cb.closest('#dropdown-proprio')) {
          cb.checked = false;
      }
  });

  const radioAll = document.querySelector('input[name="filtre_visite"][value="all"]');
  if (radioAll) radioAll.checked = true;

  filtrerMagasins();
};


window.creerTacheAgenda = function(titre, adresse) {
    const titreEvent = encodeURIComponent(`${titre}`);
    const adresseEvent = encodeURIComponent(adresse);
    const lienGCal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titreEvent}&location=${adresseEvent}`;
    
    window.open(lienGCal, '_blank');
};
