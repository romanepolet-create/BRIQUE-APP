let userMarker = null

// ================
//CARTE
// ================
const map = L.map('map').setView([46.603354, 1.888334], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let etapesItineraire = [];
let userPosition = ""; 

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
  }, function(error) {
    console.warn("Erreur GPS : ", error.message);
    alert("Impossible de récupérer ta position GPS.");
  }, {
    enableHighAccuracy: true // Force l'utilisation du vrai GPS du téléphone
  });
};


//==========
//INPUT : RECHERCHE CHR
//==========

async function lancerRecherche() {
  const input = document.getElementById('input-chr').value;
  const listeResultats = document.getElementById('resultats-recherche');

  if(!input) return ;
  
  listeResultats.innerHTML = "<li>⏳ Recherche en cours...</li>";

  const query = encodeURIComponent(input);

  try {

    const urlPhoton = `https://photon.komoot.io/api/?q=${query}&limit=3`;
    const reqPhoton = fetch(urlPhoton).then(r => r.json()).catch(() => ({features: []}));

    const urlGouv = `https://api-adresse.data.gouv.fr/search/?q=${query}&limit=3`;
    const reqGouv = fetch(urlGouv).then(r => r.json()).catch(() => ({features: []}));

    const [dataPhoton, dataGouv] = await Promise.all([reqPhoton, reqGouv]);


    listeResultats.innerHTML = "";
    let aTrouveQuelqueChose = false;

    if (dataPhoton.features && dataPhoton.features.length > 0) {
      aTrouveQuelqueChose = true;
      ajouterTitreListe(listeResultats, "🏢 Établissements (OSM)");

    	dataPhoton.features.forEach(place => {
      	const lng = place.geometry.coordinates[0];
      	const lat = place.geometry.coordinates[1];
      	const props = place.properties;
      	const nom = props.name || props.street || "Établissement inconnu";
      	const ville = props.city || props.state || "";
      	const nomPropre = `${nom}, ${ville}`;

				ajouterElementListe(listeResultats, lat, lng, nomPropre, "📍");
      })
    };

	  if (dataGouv.features && dataGouv.features.length > 0) {
      aTrouveQuelqueChose = true;
      ajouterTitreListe(listeResultats, "📮 Adresses Exactes (BAN)");

      dataGouv.features.forEach(place => {
        const lng = place.geometry.coordinates[0];
        const lat = place.geometry.coordinates[1];
        const nomPropre = place.properties.label; 

        ajouterElementListe(listeResultats, lat, lng, nomPropre, "🏠");
      });
    }	

    if (!aTrouveQuelqueChose) {
      listeResultats.innerHTML = "<li style='color:red;'>Aucun résultat trouvé.</li>";
    }
      
  } catch (error) {
    listeResultats.innerHTML = `<li style='color: red;'>Erreur réseau. ${error}</li>`;
  }
}

function ajouterTitreListe(liste, texte) {
  const titre = document.createElement('li');
  titre.innerHTML = `<b>${texte}</b>`;
  titre.style = 'background-color: #f0f0f0; padding: 4px 8px; font-size: 10px; color: #555; text-transform: uppercase; margin-top: 5px;';
  liste.appendChild(titre);
}

function ajouterElementListe(liste, lat, lng, nom, icone) {
  const li = document.createElement('li');
  li.style = 'padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;';
  li.innerHTML = `${icone} ${nom}`;
  
  li.onclick = () => {
    ajouterPointCHR(lat, lng, nom);
    liste.innerHTML = "";
    document.getElementById('input-chr').value = "";
  };
liste.appendChild(li);
}


//====================================
//POINT SUR LA CARTE
//====================================
let spamLevel = 0;

function showPopup() {
  spamLevel++;
  const PopupNoEaster = document.getElementById("PopupNoEaster");
  const mainPopup = document.getElementById("popup");
  const secPopup = document.getElementById("secPopup")
  const lastPopup = document.getElementById("lastPopup")
	console.log(spamLevel);

  if (spamLevel === 1) {
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

// The chaotic infinite spam generator
function NoEasterPopup() {
  const PopupNoEaster = document.createElement("div");
         
  PopupNoEaster.style.position = "fixed";
  PopupNoEaster.style.top = 50 + "%";
  PopupNoEaster.style.left = 50 + "%" ;
  PopupNoEaster.style.transform = "translate(-50%, -50%)";
  PopupNoEaster.style.backgroundColor = "white";
  PopupNoEaster.style.padding = "20px";
  PopupNoEaster.style.border = "2px solid black";
  PopupNoEaster.style.color = "black";
  PopupNoEaster.style.textAlign = "center";
  PopupNoEaster.style.zIndex = "500";
  PopupNoEaster.style.boxShadow = "4px 4px 15px rgba(0,0,0,0.4)";


  PopupNoEaster.innerHTML = `
    <p>Limite de 10* distinations atteinte</p>
    <p>* 9 établissements + Position de départ</p>
    <button onclick="this.parentElement.remove()">OK</button>
  `;
  document.body.appendChild(PopupNoEaster);
}

function ajouterPointCHR(lat, lng, nom) {
  L.marker([lat, lng]).addTo(map).bindPopup(`<b>${nom}</b>`).openPopup();
  map.setView([lat, lng], 13);
  if(etapesItineraire.length >= 9) {
    showPopup();
    return;
  }
  
  etapesItineraire.push({lat: lat, lng: lng, nom: nom});
  actualiserPanneauGPS();
}

function actualiserPanneauGPS() {
  const panneau = document.getElementById('panneau-tournee');
  const liste = document.getElementById('liste-tournee');
  const compteur = document.getElementById('compteur-tournee');

  if (!panneau || !liste) return;

  if (compteur) compteur.textContent = etapesItineraire.length;

  if (etapesItineraire.length === 0) {
    panneau.style.display = 'block';
	liste.innerHTML= "<li style='color: #888; font-style: italic; font-size: 12px;'>Aucune étape sélectionnée</li>";
    return;
  }

  panneau.style.display = 'block'
  liste.innerHTML = "";

  etapesItineraire.forEach((etape, index) => {
    liste.innerHTML += `
      <li style="
        margin-bottom: 8px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        text-align: left; 
        font-size: 13px;"
      >
        <span style="
          max-width: 85%; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          white-space: nowrap;"
        >
          <strong>${index + 1}.</strong> ${etape.nom}
        </span>
        <button 
          onclick="supprimerEtape(${index})" 
          style="
            background: none; 
            border: none; 
            color: #dc3545; 
            cursor: pointer; 
            font-weight: bold; 
            font-size: 14px; 
            padding: 0 5px;">
            ×
        </button>
      </li>
    `;
  });
}

window.viderTournee = function() {
  etapesItineraire = [];
  actualiserPanneauGPS();
};

window.optimiserTournee = async function() {
  if (etapesItineraire.length < 2) {
    alert("📍 Ajouter au moins 2 magasins pour optimiser l'ordre");
    return
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

window.supprimerEtape = function(index) {
  // Supprime 1 élément à la position 'index'
  etapesItineraire.splice(index, 1); 
  
  // Rafraîchit le panneau d'affichage
  actualiserPanneauGPS();
};
