const matriceGMS = {
  "AUCHAN HM": {
    obligatoire: ["LB33",  "LB75",  "NQ33", "NQ75", "YT33", "YT75", "ML75"],
    facultatif: [],
    direct: ["LB44", "NQ44", "YT44", "SH75", "TC75", "ML44"]
  },
  "AUCHAN SM": {
    obligatoire: [],
    facultatif: ["LB33", "LB75", " NQ33", "NQ75", "YT33", "YT75", "ML75"],
    direct: ["LB44", "NQ44", "YT44", "SH75", "TC75", "ML44"]
  }, 
  "CASINO": {
    obligatoire: ["LB33", "LB44", "NQ44", "YT44"],
    facultatif: [],
    direct: ["NQ33", "YT33", "YT75", "SH75", "TC75", "ML44"]
  },
  "FRANPRIX": {
    obligatoire: ["LB44", "YT44"],
    facultatif: [],
    direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "NQ44", "ML44"]
  },
  "MONOPRIX": {
    obligatoire: ["LB44", "LB75", "NQ44", "YT44"],
    facultatif: [],
    direct: ["NQ75", "YT75", "SH75", "TC75", "ML44"]
  },
  "CRF HYPER": {
    obligatoire: ["LB44", "LB75", "NQ75", "YT75", "TC75", "ML44", "ML75"],
    facultatif: [],
    direct: ["LB33", "NQ33", "NQ44", "YT33", "YT44", "SH75"]
  },
  "CRF MARKET": {
    obligatoire: [],
    facultatif: ["LB44", "LB75", "NQ75", "YT75", "TC75", "ML44", "ML75"],
    direct: ["LB33", "NQ44", "YT44", "SH75"]
  },
  "CRF PROXI": {
    obligatoire: [],
    facultatif: ["LB44", "LB75", "NQ75", "YT75", "TC75", "ML44", "ML75"],
    direct: []
  },
  "ITM PROXI": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44"]
  },
  "ITM SM": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44"]
  },
  "LECLERC": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44"]
  },
  "LECLERC PROXI": {
    obligatoire: [],
    facultatif: [],
    direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44"]
  },
"OTERA": {
    obligatoire: ["LB44", "NQ44", "YT44", "ML44"],
    facultatif: [],
    direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "U acid33", "ephemeres"]
  },
"SUPER U": {
  obligatoire: [],
  facultatif: [],
  direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44"]
  },
};

// Fonction à appeler dans ton DOMContentLoaded (remplace la ligne commentée précédente)
function genererMatriceProduits(enseigne) {
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
      // Nettoyage du nom pour l'attribut name (ex: "U acid33" -> "Uacid33")
      const nomInput = `ref_${biere.replace(/\s+/g, '')}`;
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
          <span style="font-size: 14px; font-weight: bold; color: #333;">${biere}</span>
          <div>
            <label style="margin-right: 10px;"><input type="radio" name="${nomInput}" value="OUI" required> OUI</label>
            <label><input type="radio" name="${nomInput}" value="NON" required> NON</label>
          </div>
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

  document.getElementById('store-info-badges').innerHTML = `
    <span class="info-badge">🏪 ${infos.enseigne}</span>
    <span class="info-badge">🆔 ${infos.id_hubspot || 'N/A'}</span>
  `;

  genererMatriceProduits(infos.enseigne);
});

document.addEventListener("DOMContentLoaded", () => {
  const infos = getURLParams();
  
  document.getElementById('hubspot_id').value = infos.id_hubspot;
  document.getElementById('nom_magasin').value = infos.nom;
  document.getElementById('enseigne').value = infos.enseigne;

  document.getElementById('store-info-badges').innerHTML = `
    <span class="info-badge">🏪 ${infos.enseigne}</span>
    <span class="info-badge">🆔 ${infos.id_hubspot || 'N/A'}</span>

    genererMatriceProduits(infos.enseigne);
  `;
});

// La matrice contenant tes règles

let photoActiveAEnvoyer = null;

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
  if (inputSource.files && inputSource.files[0]) {
    const cible = inputSource.files[0];
    photoActiveAEnvoyer = cible;

    if (inputSource.id === 'media-camera') document.getElementById('media-galerie').value = "";
    if (inputSource.id === 'media-galerie') docuement.getElementById('media-camera').value = "";

    const lecteur = newFileReader();
    lecteur.onload = function(evenement) {
      document.getElementById('image-rendu-apercu').src = evenement.target.result;
      document.getElementById('bloc-apercu-photo').style.display = 'block';

      const tailleMo = (cible.size / (1024 * 1024)).toFixed(2);
      document.getElementById('details-taille-photo').textContent = `Fichier lié : ${cible.name} (${tailleMo} Mo)`
    };
    lecteur.readAsDataURL(cible);
  }
}

async function soumettreFormulaire() {
  const btnSubmit = document.querySelector('.submit-btn');
  const txtInitial = btnSubmit.textContent;
  btnSubmit.textContent = "⏳ Envoi en cours...";
  btnSubmit.disabled = true;

  const formulaireElement = document.getElementById('visiteForm');
  const chargeUtile = new FormData(formulaireElement);

  if (document.getElementById('mea_status').value === 'OUI' && !photoActiveAEnvoyer) {
    alert("⚠️ Vous avez coché OUI pour la MEA, une photo est obligatoire.");
    btnSubmit.textContent = txtInitial;
    btnSubmit.disabled = false;
    return;
  }

  if (photoActiveAEnvoyer) {
    chargeUtile.append('photo', photoActiveAEnvoyer);
  }

  try {
    const reponse = await fetch('/api/visite/soumettre', {
      methode: 'POST',
      body: chargeUtile
    });

    const resultat = await reponse.json();
    if(resultat.success) {
      alert(`Visite ${resultat.codeVisite} enregistrée`);
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
