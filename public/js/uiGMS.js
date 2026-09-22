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

window.clicSurListe = function(layerId) {
    const layer = markerConteneur.getLayer(layerId);
    
    if (layer) {
        map.panTo(layer.getLatLng()); 
        ouvrirPopupDynamique(layer);
    }
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

window.toggleDropdown = function(id) {
  document.getElementById(id).classList.toggle('show');
};

window.onclick = function(event) {
  if (!event.target.closest('.custom-select') && !event.target.closest('.select-right')) {
    document.querySelectorAll('.dropdown-list').forEach(el => el.classList.remove('show'));
  }
};

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
