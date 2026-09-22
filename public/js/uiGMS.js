let joursOuvres = [];
let jourSelectionneId = null;

// --- GESTION DES JOURS OUVRES ---
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
        <button type="button" class="btn-jour ${jour.id === jourSelectionneId ? 'actif' : ''}" onclick="changerJour('${jour.id}')">
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

// --- GESTION DES FILTRES ---
function remplirSelectFiltre(idSelect, donneesGeoJSON, clePropriete) {
  const selectElement = document.getElementById(idSelect);
  if (!selectElement) return;
  const listeZones = donneesGeoJSON.features.map(f => f.properties[clePropriete]);
  const zonesUniques = [...new Set(listeZones)].sort();
  zonesUniques.forEach(zone => {
    if (zone) {
      const option = document.createElement('option');
      option.value = zone; option.textContent = zone;
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
      if (f.properties.code) dicoNomsDpt[String(f.properties.code).padStart(2, '0')] = f.properties.nom;
    });

    const listeOptionsFinales = dptsSupabase.map(codeDpt => {
      const codeString = String(codeDpt).padStart(2, '0');
      return { code: codeDpt, texteAffichage: `${codeString} - ${dicoNomsDpt[codeString]||'Département '+codeString}` };
    }).sort((a, b) => a.texteAffichage.localeCompare(b.texteAffichage));

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
      if (!proprios.some(p => normaliserTexte(p) === normaliserTexte(proprietaireActuel))) proprios.push(proprietaireActuel);
    }
    proprios.sort();

    proprios.forEach(prop => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox'; input.value = prop; input.onchange = filtrerMagasins;
      if (proprietaireActuel && !isManager && normaliserTexte(prop) === normaliserTexte(proprietaireActuel)) input.checked = true; 
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + prop));
      containerProprio.appendChild(label);
    });
  }
}

window.filtrerMagasins = function() {
  const rechercheTexte = document.getElementById('search-bar') ? document.getElementById('search-bar').value.toLowerCase() : "";
  const afficherSeulementTournee = document.getElementById('toggle-selected') ? document.getElementById('toggle-selected').checked : false;
  const tdnValue = parseInt(document.getElementById('filter-tdn') ? document.getElementById('filter-tdn').value : -1);
  const tdn75Value = parseInt(document.getElementById('filter-tdn75') ? document.getElementById('filter-tdn75').value : -1);

  const getValeursSelectionnees = (id) => {
    const container = document.getElementById(id);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  };

  const enseignesSel = getValeursSelectionnees('dropdown-enseigne');
  const prioSel = getValeursSelectionnees('dropdown-prio');
  const propriosSel = getValeursSelectionnees('dropdown-proprio');
  const visiteSel = document.querySelector('input[name="filtre_visite"]:checked')?.value || "all";

  const magasinsFiltres = listeMagasins.filter(magasin => {
    if (afficherSeulementTournee && !etapesItineraire.some(e => e.lat === magasin.lat && e.lng === magasin.lng && !e.masque)) return false;

    if (rechercheTexte !== "") {
      const nom = (magasin.nom || "").toLowerCase();
      const ville = (magasin.ville || "").toLowerCase();
      const adresse = (magasin.adresse || "").toLowerCase();
      if (!nom.includes(rechercheTexte) && !ville.includes(rechercheTexte) && !adresse.includes(rechercheTexte)) return false;
    }

    const filtreBH = document.getElementById('toggle-bh') ? parseInt(document.getElementById('toggle-bh').value) : 0;
    if (filtreBH === 1 && (!magasin.aFormulaire || !magasin.possedeBH)) return false;
    else if (filtreBH === -1 && (magasin.aFormulaire && magasin.possedeBH)) return false;

    if (enseignesSel.length === 0) { if (magasin.enseigne === "G 20" || magasin.enseigne === "LECLERC DRIVE") return false; } 
    else if (!enseignesSel.includes(magasin.enseigne)) return false;

    if (prioSel.length > 0 && !prioSel.includes(magasin.Priorité)) return false;

    if (visiteSel !== "all") {
      if (visiteSel === "never") { if (magasin.derniere_visite) return false; } 
      else {
        if (!magasin.derniere_visite) return false;
        const joursEcoules = (new Date() - new Date(magasin.derniere_visite)) / (1000 * 60 * 60 * 24);
        if (visiteSel === "1week" && joursEcoules > 7) return false;
        if (visiteSel === "2weeks" && (joursEcoules <= 7 || joursEcoules > 14)) return false;
        if (visiteSel === "1month" && (joursEcoules <= 14 || joursEcoules > 30)) return false;
        if (visiteSel === "2months" && joursEcoules <= 30) return false;
      }
    }

    if (propriosSel.length > 0 && !propriosSel.some(p => normaliserTexte(p) === normaliserTexte(magasin.Propriétaire || ""))) return false;

    if (tdnValue !== -1 || tdn75Value !== -1) {
      const regles = matriceGMS[(magasin.enseigne || "").toUpperCase()];
      if (regles && regles.obligatoire) {
        let manquantTotal = 0, manquant75 = 0;
        regles.obligatoire.forEach(biere => {
          const valBDD = magasin.references && magasin.references[`ref_${biere.replace(/\s+/g, '')}`];
          if (!(valBDD === "OUI" || valBDD === "Gagné" || valBDD === "Constaté")) {
            manquantTotal++;
            if (biere.includes("75")) manquant75++;
          }
        });
        if (tdnValue !== -1 && (tdnValue === 5 ? manquantTotal < 5 : manquantTotal !== tdnValue)) return false;
        if (tdn75Value !== -1 && (tdn75Value === 5 ? manquant75 < 5 : manquant75 !== tdn75Value)) return false;
      } else if (tdnValue > 0 || tdn75Value > 0) return false;
    }

    return true; 
  });
  afficherMagasinsSurCarte(magasinsFiltres);
};

window.reinitialiserFiltres = function() {
  const searchBar = document.getElementById('search-bar');
  if (searchBar) searchBar.value = "";
  const toggleBh = document.getElementById('toggle-bh');
  if (toggleBh) toggleBh.value = "0";
  const filterTdn = document.getElementById('filter-tdn');
  if (filterTdn) { filterTdn.value = "-1"; document.getElementById('tdn-val').innerText = "Tous"; }
  const filterTdn75 = document.getElementById('filter-tdn75');
  if (filterTdn75) { filterTdn75.value = "-1"; document.getElementById('tdn75-val').innerText = "Tous"; }

  document.querySelectorAll('.dropdown-list input[type="checkbox"]').forEach(cb => {
      if (!cb.closest('#dropdown-proprio')) cb.checked = false;
  });
  const radioAll = document.querySelector('input[name="filtre_visite"][value="all"]');
  if (radioAll) radioAll.checked = true;
  filtrerMagasins();
};

// --- LISTE ET BULLES ---
window.majListeMagasinsVisibles = function() {
  const conteneurListe = document.getElementById('liste-visibles-content');
  if (!conteneurListe) return;

  const limitesEcran = map.getBounds();
  let html = '', count = 0;
  let magasinsVisiblesTemp = [];
  const idsDejaVus = new Set();

  markerConteneur.eachLayer(function(layer) {
    if (limitesEcran.contains(layer.getLatLng())) {
      const m = layer.magasinData;
      const cleUnique = (m.hubspot_id && m.hubspot_id !== 'undefined') ? m.hubspot_id : m.nom;
      
      if (m && !idsDejaVus.has(cleUnique)) {
        idsDejaVus.add(cleUnique);
        magasinsVisiblesTemp.push({ magasin: m, layer: layer, distance: userPosition ? map.distance(userPosition, layer.getLatLng()) : Infinity });
      }
    }
  });

  magasinsVisiblesTemp.sort((a, b) => {
    if (userPosition && a.distance !== Infinity && b.distance !== Infinity) return a.distance - b.distance;
    const enseigneA = (a.magasin.enseigne || "").toLowerCase();
    const enseigneB = (b.magasin.enseigne || "").toLowerCase();
    if (enseigneA !== enseigneB) return enseigneA.localeCompare(enseigneB);
    return (a.magasin.nom || "").toLowerCase().localeCompare((b.magasin.nom || "").toLowerCase());
  });

  magasinsVisiblesTemp.forEach(item => {
    const m = item.magasin;
    count++;
    if (count <= 100) {
      const couleur = getCouleurEnseigne(m.enseigne);
      let distanceTexte = '';
      if (userPosition && item.distance !== Infinity) {
        distanceTexte = item.distance < 1000 ? `<span class="list-dist">${Math.round(item.distance)} m</span>` : `<span class="list-dist">${(item.distance / 1000).toFixed(1)} km</span>`;
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

  if (count > 100) html += `<div style="padding: 10px; text-align: center; color: #888; font-style: italic; font-size: 11px;">+ ${count - 100} autres magasins (zoomez pour affiner)</div>`;
  else if (count === 0) html = `<div style="padding: 10px; text-align: center; color: #888; font-style: italic; font-size: 12px;">Zoomer sur la carte pour lister les magasins</div>`;
  conteneurListe.innerHTML = html;
};

// On attache l'event de rafraichissement de la liste à la carte
map.on('moveend', majListeMagasinsVisibles);
map.on('zoomend', majListeMagasinsVisibles);

window.clicSurListe = function(layerId) {
    const layer = markerConteneur.getLayer(layerId);
    if (layer) { map.panTo(layer.getLatLng()); ouvrirPopupDynamique(layer); }
};

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
        const diffJours = Math.floor((new Date() - dateVisite) / (1000 * 60 * 60 * 24));
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

    L.popup({ autoPanPadding: [50, 50] }).setLatLng(layer.getLatLng()).setContent(contenuBulle).openOn(map);
};

window.afficherToast = function(message) {
  let toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = "toast-show";
  setTimeout(() => { toast.className = toast.className.replace("toast-show", ""); }, 3000);
};

window.toggleDropdown = function(id) { document.getElementById(id).classList.toggle('show'); };
window.onclick = function(event) {
  if (!event.target.closest('.custom-select') && !event.target.closest('.select-right')) {
    document.querySelectorAll('.dropdown-list').forEach(el => el.classList.remove('show'));
  }
};
