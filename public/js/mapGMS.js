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


let joursOuvres = [];
let jourSelectionneId = null;

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

initialiserCarte();
