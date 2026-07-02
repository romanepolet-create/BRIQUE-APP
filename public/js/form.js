function doGet(e) {
  // Par défaut, on lit l'onglet 'Clients', mais le site peut demander un autre onglet !
  let nomOnglet = "Clients"; 
      
  // Si le site demande un onglet précis dans l'URL (?onglet=PLV)
  if (e.parameter.onglet) {
    nomOnglet = e.parameter.onglet;
  }

  const feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomOnglet);
                    
  if (!feuille) {
    return ContentService.createTextOutput(JSON.stringify({erreur: "Onglet introuvable"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const donnees = feuille.getDataRange().getValues();
  const entetes = donnees[0];
  const reponses = [];
                                          
  for (let i = 1; i < donnees.length; i++) {
    let ligne = {};
    for (let j = 0; j < entetes.length; j++) {
      ligne[entetes[j]] = donnees[i][j];
    }
    reponses.push(ligne);
  }
                                                                      
  return ContentService.createTextOutput(JSON.stringify(reponses))
    .setMimeType(ContentService.MimeType.JSON);
}

window.chargerFormulaire = function(urlTypeform, titre) {
  // On cache le message d'accueil
  document.getElementById('message-accueil').style.display = 'none';

  // 1. On met à jour le titre de la boîte bleue
  document.getElementById('titre-formulaire').innerText = titre;
            
  // 2. On injecte la bonne URL dans l'iframe
  document.getElementById('iframe-typeform').src = urlTypeform;
                        
  // 3. On affiche la grande zone qui était cachée
  document.getElementById('zone-typeform').style.display = 'block';
};

window.fermerFormulaire = function() {
  // 1. On cache la grande zone
  document.getElementById('zone-typeform').style.display = 'none';          
  // 2. On vide l'URL de l'iframe. 
  document.getElementById('iframe-typeform').src = '';
  // 3. On réaffiche le message d'accueil !
  document.getElementById('message-accueil').style.display = 'block';

};

let photoActiveAEnvoyer = null;

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

async funciton soumettreFormulaire() {
  const formulaireElement = document.getElemebtById('visiteForm');
  const chargeUtile = new FormData(formulaireElement);

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
      alert(`Erreur de sauvegarde : ${resultat.error}`)
    }
  } catch(err) {
    console.error("Echec de la communication avec l'API", err);
  }
}



