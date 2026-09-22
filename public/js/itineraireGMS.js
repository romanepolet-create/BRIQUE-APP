let etapesItineraire = [];
let memoireGlobaleTournees = {};

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

window.viderTournee = function() {
  etapesItineraire = [];
  actualiserPanneauGPS();
  filtrerMagasins();
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

window.creerTacheAgenda = function(titre, adresse) {
    const titreEvent = encodeURIComponent(`${titre}`);
    const adresseEvent = encodeURIComponent(adresse);
    const lienGCal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titreEvent}&location=${adresseEvent}`;
    
    window.open(lienGCal, '_blank');
};

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

