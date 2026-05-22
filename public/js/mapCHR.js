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

  if(!input) { 
    return;
  }

  listeResultats.innerHTML = "<li>⏳ Recherche en cours...</li>";

  const query = encodeURIComponent(input);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=fr&format=json&limit=5://photon.komoot.io/api/?q=${query}&limit=5&lat=46.6&lon=1.8`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    listeResultats.innerHTML = "";

    if (data.length === 0) {
      listeResultats.innerHTML = "<li style='color:red'>Aucun résultat trouvé.</li>";
      return;
    }

    data.forEach(place => {
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);

      const nomPropre = place.display_name.split(',').slice(0, 2).join(',');

      const li = document.createElement('li');
      li.style = 'padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;';
      li.innerHTML = `📍 ${nomPropre}`;

      li.onclick = () => {
        ajouterPointCHR(lat, lng, nomPropre);
        listeResultats.innerHTML = "";
        document.getElementById('input-chr').value = "";
      };

      listeResultats.appendChild(li);
    });

  } catch (error) {
    listeResultats.innerHTML = "<li style='color: red;'>Erreur réseau.</li>";
  }
}

//====================================
//POINT SUR LA CARTE
//====================================
let spamLevel = 0;

function showPopup() {
  spamLevel++;
  const mainPopup = document.getElementById("popup");
  const secPopup = document.getElementById("secPopup")
  const lastPopup = document.getElementById("lastPopup")

  if(spamLevel === 1) {
    if(mainPopup) mainPopup.style.display = "block";
  }

  else if (spamLevel === 3) {
    if(secPopup) {
      secPopup.style.top = (48 + Math.random() * 4) + "%";
      secPopup.style.left = (48 + Math.random() * 4) + "%";
      secPopup.style.display = "block";
    }
  }

  else if (spamLevel=== 5) {
    if(lastPopup) {
      lastPopup.style.top = (52 + Math.random() * 4) + "%";
      lastPopup.style.left = (52 + Math.random() * 4) + "%";
      lastPopup.style.display = "block";
    }
  }
  else if (spamLevel >= 6) {
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
  extraPopup.style.border = "2px solid red";
  extraPopup.style.color = "red";
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
