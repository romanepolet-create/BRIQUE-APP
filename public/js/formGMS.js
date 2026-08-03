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
};

// Fonction à appeler dans ton DOMContentLoaded (remplace la ligne commentée précédente)
function genererMatriceProduits(enseigne, bieresCocheesAvant = []) {
  const conteneur = document.getElementById('references-container');
  const regles = matriceGMS[enseigne.toUpperCase()];

  if (!regles) {
    conteneur.innerHTML = `<p style="color:red; font-style:italic;">Enseigne "${enseigne}" inconnue dans la matrice. Impossible de charger les produits.</p>`;
    return;
  }

  // Fonction interne pour générer l'accordéon HTML
  const creerSection = (titre, listeBieres, couleurBordure, icone) => {
    if (listeBieres.length === 0) return ''; // Si vide, on n'affiche pas la section
    
    let html = `<details style="margin-bottom: 15px; border: 2px solid ${couleurBordure}; border-radius: 8px; padding: 10px; background: white;" open>
                  <summary style="font-weight: bold; color: ${couleurBordure}; cursor: pointer; outline: none;">
                    ${icone} ${titre} (${listeBieres.length} réfs)
                  </summary>
                  <div style="margin-top: 15px; display: grid; gap: 10px;">`;
                  
    listeBieres.forEach(biere => {
      const nomInput = `ref_${biere.replace(/\s+/g, '')}`;
      const estCoche = bieresCocheesAvant.includes(biere) ? "checked" : "";
      
      html += `
        <div style="display: flex; align-items: center; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
          <input type="checkbox" id="${nomInput}" name="${nomInput}" value="OUI" ${estCoche} style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
          <label for="${nomInput}" style="font-size: 14px; font-weight: bold; color: #333; cursor: pointer; user-select: none; flex-grow: 1;">${biere}</label>
        </div>`;
    });
    
    html += `</div></details>`;
    return html;
  };

  // Injection des 3 blocs
  conteneur.innerHTML = 
    creerSection('Gamme Obligatoire (En Stock)', regles.obligatoire, '#dc3545', '🚨') +
    creerSection('Gamme Facultative (Centrale)', regles.facultatif, '#ffc107', '🛒') +
    creerSection('Gamme Directe (Producteur)', regles.direct, '#002ab6', '📦');
}

// Fonction pour extraire les paramètres de l'URL
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id_hubspot: params.get('id_hubspot') || '',
    nom: params.get('nom') || 'Magasin Inconnu',
    enseigne: params.get('enseigne') || 'Inconnue'
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

function traiterFichierPhoto(inputSource) {
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
        const cible = inputSource.files[i];
        photosActivesAEnvoyer.push(cible);

        const lecteur = new FileReader();
        lecteur.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '60px';
            img.style.height = '60px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '6px';
            img.style.border = '2px solid #002ab6';
            miniGallery.appendChild(img);
        };
        lecteur.readAsDataURL(cible);
    }

    document.getElementById('details-taille-photo').textContent = `${photosActivesAEnvoyer.length} photo(s) jointe(s)`;
    
  }
}

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
  
  const chargeUtile = new FormData(formulaireElement);

  const checkboxes = document.querySelectorAll('#references-container input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (!cb.checked) {
      chargeUtile.append(cb.name, 'NON');
    }
  });

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
        
        const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titreEvent}&details=${descriptionEvent}`;
        
        window.open(googleCalUrl, '_blank');
      }
      window.close();
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

