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

  navigator.geolocation.watchPosition(function(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    userPosition = L.latLng(lat, lng);

    if (userMarker) {
      userMarker.setLatLng(userPosition);
    } else {
      const iconeBleue = L.divIcon({
        className: 'user-gps-marker',
        html: '<div></div>',
        iconSize: [20, 20]
      });
      userMarker = L.marker(userPosition, { icon: iconeBleue }).addTo(map);
      map.setView(userPosition, 12);
    }   
  }, function(error) {
    console.warn("Erreur GPS : ", error.message);
    alert("Impossible de récupérer ta position GPS.");
  }, {
    enableHighAccuracy: true
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
  titre.class = `liTitre`;
  liste.appendChild(titre);
}

function ajouterElementListe(liste, lat, lng, nom, icone) {
  const li = document.createElement('li');
  li.class = `liNom`;
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
  const ExtraPopup = document.getElementById("ExtraPopup");
  console.log(spamLevel);

  if (spamLevel === 1) {
    if(PopupNoEaster) PopupNoEaster.style.display = "block";
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
	if(ExtraPopup) {
    	const random = 40 + Math.random() * 20;  
  		ExtraPopup.style.top = random + "%";
  		ExtraPopup.style.left = random + "%";
  		ExtraPopup.style.bottom = random + "%";
  		ExtraPopup.style.right = random + "%";
		ExtraPopup.style.display = "block";
	}
  }
}
  
function hidePopup() {
  document.getElementById("popup").style.display = "none";
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
	liste.innerHTML= "<li id='liPanneau'>Aucune étape sélectionnée</li>";
    return;
  }

  panneau.style.display = 'block'
  liste.innerHTML = "";

  etapesItineraire.forEach((etape, index) => {
    liste.innerHTML += `
      <li class='liPanneauNom'>
        <span class="spanPanneauNom">
          <strong>${index + 1}.</strong> ${etape.nom}
        </span>
        <button class="btnPanneauSuppr" onclick="supprimerEtape(${index})">×</button>
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
  etapesItineraire.splice(index, 1); 
  actualiserPanneauGPS();
};
