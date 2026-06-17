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
const map = L.map('map', {preferCanvas: true}).setView([46.603354, 1.888334], 5);
  // 2. Charge le fond de carte (OpenStreetMap gratuit & propre)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors, © CARTO'
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
        fillColor: 'transparent',
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
      "SUPER U": "#7304E7",
	  "MONOPRIX": "#f8de0d",
		"AUCHAN SM": "#f8190d",
		"CRF MARKET": "#3002d4",
		"LECLERC PROXI": "#fa1ee5",
		"LECLERC": "#ff99f5",
		"ITM SM": "#01981e",
		"ITM PROXI": "#14fa23",
		"FRANPRIX": "#fef3943",
		"CRF PROXI": "#4dbeff",
		"CRF HYPER": "#4d7fff",
		"CASINO": "#baab2c",
		"AUCHAN HM": "#fe7e71",
		"OTERA": "#ff871f",

    } 
    // Retourne la couleur, ou un gris par défaut si l'enseigne est inconnue
    return couleurs[enseignePropre] || "#555555";
 }


async function chargerDonneesMagasins() {
	console.time("affichage");
  try {
    const response = await fetch('/api/gms');

    if (!response.ok) throw new Error("Erreur réseau GMS");
    
    listeMagasins = await response.json();

    remplirFiltresDepuisDonnees(listeMagasins, donneesGeo);

    console.log("Nombre de magasins reçus :", listeMagasins.length);
    console.log("Voici le premier magasin :", listeMagasins[0]);

    // Remplir la carte dès le départ
	  console.log("avant affichage");

    afficherMagasinsSurCarte(listeMagasins);

	  console.log("apres affichage");
  } catch (err) {
    console.error("Impossible de charger les magasins :", err);
  }
	console.timeEnd("affichage");

}

let nomEchappe

function afficherMagasinsSurCarte(magasins) {
  // On vide la carte avant de remettre les nouveaux pins filtrés
  markerConteneur.clearLayers();
  const nouveauxMarkers = [];

  magasins.forEach(magasin => {
    const positionMagasin = L.latLng(magasin.lat, magasin.lng);
		const couleurPin = getCouleurEnseigne(magasin.enseigne);

    // 🚀 LA SOLUTION BLINDÉE : On dessine directement un cercle vectoriel !
    const marker = L.circleMarker(positionMagasin, {
      radius: 4, //taille cercle
      fillColor: couleurPin, //couleur
      fillOpacity: 0.85, // Remplissage
      color: 'transparent',//couleur bordure
      weight: 15              //épaisseur bordure
    })

		
    marker.on('click', function(e) {
    const nomEchappe = magasin.nom ? magasin.nom.replace(/'/g, "\\'") : "Magasin";
    const lienHubspot = `https://app.hubspot.com/contacts/${PORTAL_ID}/company/${magasin.hubspot_id}`;
		

		const contenuBulle = `
      <div style="text-align: center; font-family: Arial, sans-serif; min-width: 160px;">
        <h4 style="color: #002ab6; margin: 0 0 5px 0;">${magasin.nom}</h4>
        <p style="margin: 0 0 12px 0; color: #666; font-size: 13px;">
          ${magasin.adresse || "Adresse non renseignée"}<br>
          <strong>${magasin.code_postal} ${magasin.ville}</strong><br>
		  <em>Priorité : ${magasin.Priorité}</em>
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
        <button onclick="ajouterEtape(${magasin.lng}, ${magasin.lat}, '${nomEchappe}', '${magasin.hubspot_id}')"
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
			L.popup({ autoPanPadding: [50, 50] })
			.setLatLng(positionMagasin)
			.setContent(contenuBulle)
			.openOn(map)
		
			e.target.bindPopup(contenuBulle).openPopup();
    });

		nouveauxMarkers.push(marker);
    });
	
  markerConteneur.addLayers(nouveauxMarkers);
  MajListeMagasinsVisibles()
}

// ================
// FILTRES
// ================
window.filtrerMagasins = function() {
	const rechercheTexte = document.getElementById('search-bar') ? document.getElementById('search-bar').value.toLowerCase() : "";
	 const afficherSeulementTournee = document.getElementById('toggle-selected') ? document.getElementById('toggle-selected').checked : false;

  const rayonMaximum = parseFloat(document.getElementById('filter-rayon').value);

  // NOUVELLE FONCTION : Lit les cases cochées dans nos divs
  const getValeursSelectionnees = (id) => {
    const container = document.getElementById(id);
    if (!container) return [];
    // On cherche toutes les checkboxes qui sont cochées dans ce conteneur
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    // On retourne un tableau avec leurs valeurs
    return Array.from(checkboxes).map(cb => cb.value);
  };


	const regionsSel = getValeursSelectionnees('dropdown-region');
  const dptsSel = getValeursSelectionnees('dropdown-dpt');
  const enseignesSel = getValeursSelectionnees('dropdown-enseigne');
	const prioSel = getValeursSelectionnees('dropdown-prio');



  //FILTER ON DATA
  const magasinsFiltres = listeMagasins.filter(magasin => {

  // --- FILTRE TOGGLE "MA TOURNEE SEULEMENT" ---
    if (afficherSeulementTournee) {
      // On cherche si le magasin est dans la tournée ET qu'il n'est PAS masqué
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

    // 1. ENSEIGNES
    if (enseignesSel.length > 0 && !enseignesSel.includes(magasin.enseigne)) return false;  
    // 2. REGION
    if (regionsSel.length > 0 && !regionsSel.includes(magasin.region)) return false;
	// Prio
	if (prioSel.length > 0 && !prioSel.includes(magasin.Priorité)) return false;

    // 3. DPT
    if (dptsSel.length > 0 && !dptsSel.includes(String(magasin.dpt))) return false;

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
  const containerRegion = document.getElementById('dropdown-region');
  const containerDpt = document.getElementById('dropdown-dpt');

  if (!magasins || magasins.length === 0) return;

  // 1. Remplissage des Régions uniques (Trié par ordre alphabétique)
  if (containerRegion && containerRegion.innerHTML.trim() === "") {
    const regions = [...new Set(magasins.map(m => m.region))].filter(Boolean).sort();
    regions.forEach(region => {
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${region}" onchange="filtrerMagasins()"> ${region}`;
      containerRegion.appendChild(label);
    });
  }

  // 2. Remplissage des Départements rangés par Région avec leur Vrai Nom
  if (containerDpt && donneesGeoJSON && donneesGeoJSON.features && containerDpt.innerHTML.trim() === "") {
 
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
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" value="${item.code}" onchange="filtrerMagasins()"> ${item.texteAffichage}`;
      containerDpt.appendChild(label);
    });
  }
}

// Ouvre ou ferme la liste déroulante cliquée
window.toggleDropdown = function(id) {
  document.getElementById(id).classList.toggle('show');
};

// Ferme les listes si on clique ailleurs sur la page
window.onclick = function(event) {
  if (!event.target.closest('.custom-select')) {
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


// ==========================================
// GESTION DES ÉTAPES (MASQUER, FINAL, SUPPRIMER)
// ==========================================
window.ajouterEtape = function(lng, lat, nom, hubspot_id) {
  const activeCount = etapesItineraire.filter(e => !e.masque).length;
  if(activeCount >= 9) {
      showPopup();
      return;
  }

  etapesItineraire.push({lat: lat, lng: lng, nom: nom, hubspot_id: hubspot_id, masque: false, isFinal: false});
  actualiserPanneauGPS();
  filtrerMagasins();

  afficherToast(`✅ ${nom} a bien été ajouté à la tournée`);
};

window.supprimerEtape = function(index) {
  etapesItineraire.splice(index, 1);
  actualiserPanneauGPS();
  filtrerMagasins(); 
};

// Fonction pour Masquer / Démasquer un établissement
window.toggleMasqueEtape = function(index) {
  // Si on veut démasquer, on vérifie d'abord qu'on ne dépasse pas la limite de 9
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
};

// Fonction pour définir la destination finale (Drapeau)
window.toggleFinalEtape = function(index) {
  const currentStatus = etapesItineraire[index].isFinal;
  // On remet tout à zéro (une seule destination finale possible)
  etapesItineraire.forEach(e => e.isFinal = false);
  // Si ce n'était pas déjà la destination finale, on l'active
  if (!currentStatus) {
    etapesItineraire[index].isFinal = true;
  }
  actualiserPanneauGPS();
};

function actualiserPanneauGPS() {
  const panneau = document.getElementById('panneau-tournee');
  const liste = document.getElementById('liste-tournee');
  const compteur = document.getElementById('compteur-tournee');

  if (!panneau || !liste) return;

  // Le compteur n'affiche que le nombre d'étapes ACTIVES
  const activeCount = etapesItineraire.filter(e => !e.masque).length;
  if (compteur) compteur.textContent = activeCount;

  if (etapesItineraire.length === 0) {
    panneau.style.display = "block";
    liste.innerHTML= "<li style='color: #888; font-style: italic; font-size: 12px;'>Aucune étape sélectionnée</li>";
    return;
  }

  panneau.style.display = 'block';
  liste.innerHTML = "";

  etapesItineraire.forEach((etape, index) => {
    let contenuTexte = etape.nom;
    if (etape.hubspot_id && etape.hubspot_id !== 'undefined') {
      const lien = `https://app.hubspot.com/contacts/${PORTAL_ID}/company/${etape.hubspot_id}`;
      // Si masqué, on grise le lien
      contenuTexte = `<a href="${lien}" target="_blank" style="color: ${etape.masque ? '#999' : '#005baa'}; text-decoration: none; font-weight: bold;">${etape.nom}</a>`;
    }

    const styleLigne = etape.masque ? "opacity: 0.5; text-decoration: line-through;" : "";
    
    // Le bouton Oeil (barré par CSS natif si masqué)
    const btnMasque = etape.masque
      ? `<button onclick="toggleMasqueEtape(${index})" title="Réafficher" style="background:none; border:none; cursor:pointer; position:relative; font-size:16px;">👁️<span style="position:absolute; top:50%; left:5%; width:90%; height:2px; background:red; transform:rotate(45deg);"></span></button>`
      : `<button onclick="toggleMasqueEtape(${index})" title="Masquer temporairement" style="background:none; border:none; cursor:pointer; font-size:16px;">👁️</button>`;

    // Le bouton Drapeau (Finale)
    const btnFinal = etape.isFinal
      ? `<button onclick="toggleFinalEtape(${index})" title="Retirer de la fin" style="background:#28a745; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px; padding:2px 5px;">🏁</button>`
      : `<button onclick="toggleFinalEtape(${index})" title="Verrouiller à la fin" style="background:none; border:1px solid #ccc; border-radius:4px; cursor:pointer; font-size:12px; filter:grayscale(100%); opacity:0.5; padding:2px 5px;">🏁</button>`;

    liste.innerHTML += `
      <li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; ${styleLigne}">
        <span style="flex:1; text-align:left; padding-right: 5px;"><strong>${index+1}.</strong> ${contenuTexte}</span>
        <div style="display:flex; gap: 5px; align-items:center;">
          ${btnFinal}
          ${btnMasque}
          <button class="btn-delete-etape" onclick="supprimerEtape(${index})" title="Retirer" style="background: #dc3545; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display:flex; align-items:center; justify-content:center; font-size:10px;">✖</button>
        </div>
      </li>
    `;
  });
}


window.viderTournee = function() {
  etapesItineraire = [];
  actualiserPanneauGPS();
  filtrerMagasins();
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

