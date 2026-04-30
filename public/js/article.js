let biereSelectionnee = ""


//---GESTION INTERFACE

function allerEtape(num) {
  document.querySelectorAll('.etape').forEach(e => e.classList.remove('active'));
  document.getElementById(`etape${num}`).classListėadd('active');
  if(num === 1) chargerNoms();
}

async function ChargerNoms() {
  const response = await fetch('/api/bieres');
  const infos = await response.json();
  const container = document.getElementById('liste');

  const groupees = bieres.reduce((acc, b) => {
    const nomPropre = b.id.replace (/(33cl|75cl|CAN 44cl)/i, '').trim();
    if (!acc[nomPropre]) acc[nomPropre] = [];
    acc[nomPropre].push(b);
    return acc;
  }, {});

  const noms = [...new Set(Object.entries(groupees).map(b => b.nomPropre))];
  const conteneur = document.getElementById('listeBieres');
  conteneur.innerHTML = noms.map(nom =>
    `button onclick="choisirBiere('${nom}')">🍺${nom}</button>`
  ).join('');
}

window.choisirBiere = async function(nom) {
  const response = await fetch('/api/bieres');
  const infos = await response.json();
  const container = document.getElementById('liste');

  const groupees = bieres.reduce((acc, b) => {
    const nomPropre = b.id.replace (/(33cl|75cl|CAN 44cl)/i, '').trim();
    if (!acc[nomPropre]) acc[nomPropre] = [];
    acc[nomPropre].push(b);
    return acc;
  }, {});

  biereSelectionnee = nom;
  document.getElementById('titreBiere').innerText = nom;
  const formats = Object.entries(groupees).filter(b => b.nomPropre === nom);

  const conteneur = document.getElementById('listeFormats');
  conteneur.innerHTML = formats.map(f =>
    `<button onclick="choisirFormat('${f.id}')">📏 ${f.taille}</button>`
  ).join('');
  allerEtape(2);
}

window.choisirFormat = async function(idComplet) {
  const response = await fetch('/api/bieres');
  const infos = await response.json();
  const container = document.getElementById('liste');

  const groupees = bieres.reduce((acc, b) => {
    const nomPropre = b.id.replace (/(33cl|75cl|CAN 44cl)/i, '').trim();
    if (!acc[nomPropre]) acc[nomPropre] = [];
    acc[nomPropre].push(b);
    return acc;
  }, {});

  const biere = Object.entries(groupees).find(b => b.id === idComplet);
  document.getElementById('titreFormat').innerText = biere.id;

  const conteneur = document.getElementById('listeBadges');
  
  conteneur.innerHTML = `
     <button class="badge" onclick="ecrireDansPage('${biere.id}')">🍺 Nom : ${biere.id}</button>
     <button class="badge" onclick="ecrireDansPage('${biere.codeArticleFournisseur}')">🛒 Code Fournisseur ${biere.codeArticleFournisseur}</button>
     <button class="badge" onclick="ecrireDansPage('${biere.degrePlato}')">⚖️ Degre du Plato: ${biere.degrePlato} °P</button>
    <button class="badge" onclick="ecrireDansPage('${biere.Nomenclature}')">🛂 Nomenclature: ${biere.Nomenclature}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.DroitsDAccises}')">🛂 Droits d'Accises: ${biere.DroitsDAccises}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.typesDroits}')">🛂 Types de Droits : ${biere.typesDroits}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.PaysOrigine}')">🛂 Pays d'Origine : ${biere.PaysOrigine}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.Péremption}')">🛂 Péremption (mois) : ${biere.péremption}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UVC.type}')">🛂 Type d'UVC ${biere.UVC.type}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UVC.Gencode}')">🛂 Gencode UVC ${biere.UVC.Gencod}</button>
    <button class="badge" onclick="ecrireDansPage('${biere.UVC.long}')">🛂 Longueur UVC ${biere.UVC.long}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UVC.larg}')">🛂 Largeur UVC ${biere.UVC.larg}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UVC.hauteur}')">🛂 hauteur d'UVC ${biere.UVC.hauteur}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UVC.poids}')">🛂 Poids d'UVC ${biere.UVC.poids}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.type}')">🛂 Type d'UD ${biere.UD.type}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.Gencod}')">🛂 Gencod UD ${biere.UD.Gencode}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.long}')">🛂 Longueur d'UD ${biere.UD.long}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.larg}')">🛂 Largeur d'UD ${biere.UD.larg}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.hauteur}')">🛂 hauteur d'UD ${biere.UD.hauteur}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.poids}')">🛂 Poids d'UD ${biere.UD.poids}kg</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.Volume}')">🛂 Volume d'UD ${biere.UD.Volume}L</button>
  <button class="badge" onclick="ecrireDansPage('${biere.UD.nbUVC}')">🛂 Nombre d'UVC (UD) ${biere.UD.nbUVC}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.type}')">🛂 Type de palette ${biere.palette.type}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.Gencode}')">🛂 Gencod de palette ${biere.palette.Gencod}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.long}')">🛂 Longueur de palette ${biere.palette.long}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.larg}')">🛂 Largeur de palette ${biere.palette.larg}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.hauteur}')">🛂 Hauteur de palette ${biere.palette.hauteur}mm</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.poids}')">🛂 Poids de palette ${biere.palette.poids}kg</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.Volume}')">🛂 Volume sur palette ${biere.palette.Volume}L</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.nbUVC}')">🛂 Nombre d'UVC (palette) ${biere.palette.nbUVC}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.nbPerCouche}')">🛂 Nombre d'UVC / couche ${biere.palette.nbPerCouche}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.palette.nbCouche}')">🛂 Nombre de couches ${biere.palette.nbCouche}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.delaiAppro}')">Délai d'approvisionnement ${biere.delaiAppro}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.MatBout}')">Matière de la bouteille ${biere.MatBout}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.PoidBout}')">Poids de la bouteille ${biere.PoidBout}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.MatCapsule}')">Matière de la capsule ${biere.MatCapsule}</button>
  <button class="badge" onclick="ecrireDansPage('${biere.PoidCapsule}')">Poid de la capsule ${biere.PoidCapsule}</button>
  `;
  allerEtape(3);
}

chargerNom();

window.ecrireDansPage = async function(texteAInserer) {
  const response = await fetch('/api/bieres');
  const infos = await response.json();
  const container = document.getElementById('liste');

  const groupees = bieres.reduce((acc, b) => {
    const nomPropre = b.id.replace (/(33cl|75cl|CAN 44cl)/i, '').trim();
    if (!acc[nomPropre]) acc[nomPropre] = [];
    acc[nomPropre].push(b);
    return acc;
  }, {});

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: (texte) =>
        const elementActif = document.activeElement;

        if(!document.execCommand("insertText", false, texte)) {
          if(elementActif.value !== undefined) {
            const debut = elementActif.selectionStart;
            const fin = elementActif.selectionEnd;
            elementActif.value = elementActif.value.substring(0, debut) + texte + elementActif.value.substring(fin);
          } else {
            alert("Extension BH : Place d'abord ton curseur clignotant dans une case pour que je puisse écrire");
          }
        }
      },
      args: [texteAInserer]
    });
  });
}
