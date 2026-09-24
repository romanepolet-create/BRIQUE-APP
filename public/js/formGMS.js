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
  direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "LB44", "NQ44", "YT44", "ML44", "LB33", "YT33", "NQ33", "UA33", "DB33"]
  }
};

function genererMatriceProduits(enseigne, bieresCocheesAvant = []) {
  const conteneur = document.getElementById('references-container');
  const regles = matriceGMS[enseigne.toUpperCase()];
  const infos = getURLParams(); 

  if (!regles) {
    conteneur.innerHTML = `<p style="color:red; font-style:italic;">Enseigne "${enseigne}" inconnue dans la matrice.</p>`;
    return;
  }

  const creerSection = (titre, listeBieres, couleurBordure, icone, estObligatoire) => {
    if (listeBieres.length === 0) return '';
    
    let html = `<details class="matrice-details" style="border: 2px solid ${couleurBordure};" open>
                  <summary class="matrice-summary" style="color: ${couleurBordure};">
                    ${icone} ${titre} (${listeBieres.length} réfs)
                  </summary>
                  <div class="matrice-grid">`;
                  
    listeBieres.forEach(biere => {
      const nomInput = `ref_${biere.replace(/\s+/g, '')}`;
      const estCoche = bieresCocheesAvant.includes(biere) ? "checked" : "";

      let blocChoix = "";
      if (infos.premiere_visite) {
         blocChoix = `
            <div id="choix_${nomInput}" class="bloc-choix" style="display: ${estCoche ? 'flex' : 'none'};">
              <label class="label-gagne">
                <input type="radio" name="statut_${nomInput}" value="Gagné"> 🏆 Gagné
              </label>
              <label class="label-constate">
                <input type="radio" name="statut_${nomInput}" value="Constaté"> 👀 Constaté
              </label>
            </div>
         `;
      }

      let blocDetails = `
          <div id="details_${nomInput}" class="bloc-details" style="display: ${estCoche ? 'flex' : 'none'};">
            <div class="details-group">
              <label class="details-label">Niv</label>
              <input type="number" id="niv_${nomInput}" name="niv_${nomInput}" class="details-input">
            </div>
            <div class="details-group">
              <label class="details-label">Facing</label>
              <input type="number" id="fac_${nomInput}" name="fac_${nomInput}" class="details-input">
            </div>
            <label class="label-rupture">
              <input type="checkbox" id="rpt_${nomInput}" name="rpt_${nomInput}" value="OUI"> RUPTURE
            </label>
          </div>
      `;

      const evtChange = `onchange="
          const isChecked = this.checked;
          const divChoix = document.getElementById('choix_${nomInput}');
          const divDetails = document.getElementById('details_${nomInput}');
          if (divChoix) divChoix.style.display = isChecked ? 'flex' : 'none';
          if (divDetails) divDetails.style.display = isChecked ? 'flex' : 'none';
      "`;
      
      html += `
        <div class="biere-item">
          <div class="biere-main-row">
            <input type="checkbox" id="${nomInput}" name="${nomInput}" value="OUI" ${estCoche} ${evtChange} class="biere-checkbox">
            <label for="${nomInput}" class="biere-label">${biere}</label>
          </div>
          ${blocChoix}
          ${blocDetails}
        </div>`;
    });
    
    html += `</div></details>`;
    return html;
  };

  conteneur.innerHTML = 
    creerSection('Gamme Obligatoire (En Stock)', regles.obligatoire, '#dc3545', '🚨', true) +
    creerSection('Gamme Facultative (Centrale)', regles.facultatif, '#ffc107', '🛒', false) +
    creerSection('Gamme Directe (Producteur)', regles.direct, '#002ab6', '📦', false);
}

// Fonction pour extraire les paramètres de l'URL
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id_hubspot: params.get('id_hubspot') || '',
    nom: params.get('nom') || 'Magasin Inconnu',
    enseigne: params.get('enseigne') || 'Inconnue',
    premiere_visite: params.get('premiere_visite') === 'true'
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const infos = getURLParams();
  
  document.getElementById('hubspot_id').value = infos.id_hubspot;
  document.getElementById('nom_magasin').value = infos.nom;
  document.getElementById('enseigne').value = infos.enseigne;
  document.getElementById('huspot_link').href = `https://app.hubspot.com/contacts/146794478/company/${infos.id_hubspot}`

  document.getElementById('store-info-badges').innerHTML = `
    <span class="info-badge">🏪 ${infos.enseigne}</span>
    <span class="info-badge">🆔 ${infos.id_hubspot || 'N/A'}</span>`

    genererMatriceProduits(infos.enseigne);
});

// La matrice contenant tes règles

let photosActivesAEnvoyer = [];

// Gérer l'affichage conditionnel de la section MEA
function toggleMEAFields() {
  const status = document.getElementById('mea_status').value;
  const detailsDiv = document.getElementById('mea_details');
  
  if (status === 'OUI') {
    detailsDiv.style.display = 'block';
  } else {
    detailsDiv.style.display = 'none';
  }
}

function declencherDeclicPhoto(sourceId) {
  if(sourceId === 'camera') {
    document.getElementById('media-camera').click();
  } else if (sourceId === 'galerie') {
    document.getElementById('media-galerie').click();
  }
}

window.traiterFichierPhoto = function(inputSource) {
  if (inputSource.files && inputSource.files.length > 0) {
    document.getElementById('bloc-apercu-photo').style.display = 'block';
    
    const imgUnique = document.getElementById('image-rendu-apercu');
    if (imgUnique) imgUnique.style.display = 'none';

    let miniGallery = document.getElementById('mini-galerie-mea');
    if (!miniGallery) {
        miniGallery = document.createElement('div');
        miniGallery.id = 'mini-galerie-mea';
        miniGallery.style.display = 'flex';
        miniGallery.style.flexWrap = 'wrap';
        miniGallery.style.gap = '10px';
        miniGallery.style.justifyContent = 'center';
        document.getElementById('bloc-apercu-photo').insertBefore(miniGallery, document.getElementById('details-taille-photo'));
    }

    for (let i = 0; i < inputSource.files.length; i++) {
      const fichierOriginal = inputSource.files[i];
      
      const lecteur = new FileReader();
      lecteur.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(function(blob) {
            const fichierCompresse = new File([blob], fichierOriginal.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            photosActivesAEnvoyer.push(fichierCompresse);

            const imgApercu = document.createElement('img');
            imgApercu.src = URL.createObjectURL(blob);
            imgApercu.style.width = '60px';
            imgApercu.style.height = '60px';
            imgApercu.style.objectFit = 'cover';
            imgApercu.style.borderRadius = '6px';
            imgApercu.style.border = '2px solid #002ab6';
            miniGallery.appendChild(imgApercu);

            document.getElementById('details-taille-photo').textContent = `${photosActivesAEnvoyer.length} photo(s) jointe(s) (compressées)`;
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      lecteur.readAsDataURL(fichierOriginal);
    }    
  }
}

document.getElementById('mea_volume').addEventListener('input', function(e) {
  let val = this.value.replace(',', '.');
  val = val.replace(/[^0-9.]/g, '');
  this.value = val;
});

async function soumettreFormulaire() {
  const formulaireElement = document.getElementById('visiteForm');

  if (!formulaireElement.checkValidity()) {
    formulaireElement.reportValidity();
    return;
  }
  const btnSubmit = document.querySelector('.submit-btn');
  const txtInitial = btnSubmit.textContent;
  btnSubmit.textContent = "⏳ Envoi en cours...";
  btnSubmit.disabled = true;

  const noteTexte = document.getElementById('new_note').value.trim();
  if (noteTexte !== "") {
      const btnSaveNote = document.getElementById('btn-save-note');
      if (btnSaveNote) btnSaveNote.click();
  }
  
  const chargeUtile = new FormData(formulaireElement);
  let erreurChoix = false;


  const checkboxes = document.querySelectorAll('#references-container input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (!cb.checked) {
      chargeUtile.append(cb.name, 'NON');
    } else {
      const divChoix = document.getElementById(`choix_${cb.name}`);
      if (divChoix) {
        // C'est une 1ère visite : on force le choix Gagné/Constaté
        const radioCoche = document.querySelector(`input[name="statut_${cb.name}"]:checked`);
        if (!radioCoche) {
          erreurChoix = true;
        } else {
          chargeUtile.set(cb.name, radioCoche.value);
        }
      } else {
        // 👇 CORRECTION : C'est une visite de suivi (pas de boutons radio), on envoie OUI !
        chargeUtile.set(cb.name, 'OUI');
      }
    }
  });

  // --- NOUVEAU : Récupération des présences et des détails produits ---
  const presence = {};
  ['LUN', 'MAR', 'MER', 'JEU', 'VEN'].forEach(jour => {
      const cbAM = document.querySelector(`input[name="pres_${jour}_AM"]`);
      const cbPM = document.querySelector(`input[name="pres_${jour}_PM"]`);
      presence[jour] = {
          AM: cbAM ? cbAM.checked : true,
          PM: cbPM ? cbPM.checked : true
      };
  });
  chargeUtile.append('presence_chef', JSON.stringify(presence));

  const detailsProduits = {};
  checkboxes.forEach(cb => {
      if (cb.checked) {
          const niv = document.getElementById(`niv_${cb.name}`);
          const fac = document.getElementById(`fac_${cb.name}`);
          const rpt = document.getElementById(`rpt_${cb.name}`);
          detailsProduits[cb.name] = {
              niveau: niv ? niv.value : "",
              facings: fac ? fac.value : "",
              rupture: (rpt && rpt.checked) ? "OUI" : "NON"
          };
      }
  });
  chargeUtile.append('details_produits', JSON.stringify(detailsProduits));

  if (erreurChoix) {
    alert("⚠️ Vous devez choisir 'Gagné' ou 'Constaté' pour chaque référence cochée !");
    btnSubmit.textContent = txtInitial;
    btnSubmit.disabled = false;
    return;
  }


  if (document.getElementById('mea_status').value === 'OUI' && photosActivesAEnvoyer.length === 0) {
    alert("⚠️ Vous avez coché OUI pour la MEA, au moins une photo est obligatoire.");
    btnSubmit.textContent = txtInitial;
    btnSubmit.disabled = false;
    return;
  }
  
  photosActivesAEnvoyer.forEach((photo) => {
    chargeUtile.append('photos', photo);
  });

  try {
    const reponse = await fetch('/api/visite/soumettre', {
      method: 'POST',
      body: chargeUtile
    });

    const resultat = await reponse.json();
    if(resultat.success) {
       const veutRappel = confirm(`✅ Visite enregistrée avec succès !\n\nVoulez-vous planifier une prochaine action (rappel) dans votre agenda ?`);

     if (veutRappel) {
        const nomMagasin = document.getElementById('nom_magasin').value;
        const notes = document.querySelector('textarea').value || "Aucun commentaire spécifique lors de la visite.";

        const titreEvent = encodeURIComponent(`Relance / Suivi : ${nomMagasin}`);
        const descriptionEvent = encodeURIComponent(`Rappel suite à notre dernière visite.\n\nNotes de la dernière visite :\n${notes}`);
        const lienGCal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titreEvent}&details=${descriptionEvent}`;
        
        window.open(lienGCal, '_blank');
        
        setTimeout(() => window.close(), 1000);
      } else {
        window.close();
      }
    } else {
      alert(`Erreur de sauvegarde : ${resultat.error}`);
      btnSubmit.textContent = txtInitial;
      btnSubmit.disabled = false;
    }
  } catch(err) {
    console.error("Echec de la communication avec l'API", err);
    alert("❌ Impossible de joindre le serveur. Vérifiez votre connexion.");
    btnSubmit.textContent = txtInitial;
    btnSubmit.disabled = false;
  }
}

