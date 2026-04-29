let biereActuelle = null;

async function chargerBieres() {
  const response = await fetch('/api/bieres');
  const bieres = await response.json();
  const container = document.getElementById('liste');

  const groupees = bieres.reduce((acc, b) => {
    const nomPropre = b.id.replace(/(33cl|75cl|CAN 44cl)/i, '').trim();

    if (!acc[nomPropre]) acc[nomPropre] = [];
    acc[nomPropre].push(b);
    return acc;
  }, {});

  container.innerHTML = Object.entries(groupees).map(([nom, formats]) => `
    <div class="card">
    <h3>${nom}</h3>
    <p>${formats[0].type}</p>
    <p class="degre">${formats[0].degre}%</p>
    <hr style="border: 0.5px solid #444; margin: 15px 0;">
    <div style="text-align: left;">
    ${formats.map(f => `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <span style="font-size: 0.9em;">${f.id.split(' ').pop()}: <strong>${f.prix}€</strong></span>
    <button onclick="voirDetails('${f.id}')" style="cursor: pointer; background:#ffcc00; border: none; padding: 4px 8px; border-radius: 4px; font-weight:bold;">i</button>
    </div>
    `).join('')}
    </div>
    </div>
  `).join('');
}
chargerBieres();

async function voirDetails(id) {
  const response = await fetch(`/api/bieres/${id}`);
  const biere = await response.json();

  if(response.ok) {
    biereActuelle = biere;

    document.getElementById('modaleTitre').innerText = biere.id

    document.getElementById('modaleInfos').innerHTML = `
      <b>Type:</b> ${biere.type}<br>
      <b>Degré :</b> ${biere.degre}%<br>
      <b>Prix HT (carton de ${biere.nombre}) :</b> ${biere.prix} €<br>
      <b>PMC :</b> ${biere.PMC} €
      <button onclick="telechargerExcelGMS()" class="btn-excel">
        📊 Télécharger la fiche création (Excel)
      </button>
      `;

      let taille = "33";
      if (biere.id.includes("75cl")) {
        taille = "75";
      } else if (biere.id.includes("44cl")) {
        taille = "44";
      }

      const nomPropre = biere.id.replace(/(33cl|75cl|CAN 44cl)/i, '').trim();
      const nomFormate = nomPropre.replace(/\s+/g, '_');
      const cheminImage = `/images/${taille}/${nomFormate}_${taille}.png`;
      document.getElementById('modaleImage').src = cheminImage;
      document.getElementById('modaleBiere').style.display = "block";



    } else {
      // Si la bière n'existe pas, alerte basique
      alert(biere.erreur);
    }
  }

  function fermerModaleBiere() {
    document.getElementById('modaleBiere').style.display = "none";
  }

  window.onclick = function(event) {
    let modale = document.getElementById('modaleBiere');
    if (event.target === modale) {
      modale.style.display = "none";
    }
  }



function telechargerExcelGMS() {
    if (!biereActuelle) return;

    // A. On prépare les lignes de notre tableau Excel (comme sur ta capture PDF !)
    const donnees = [
        ["FORMULAIRE DE CRÉATION D'ARTICLE", "BRIQUE HOUSE BREWERY"],
        [""],
        ["INFORMATIONS GÉNÉRALES", ""],
        ["Nom de la bière", biereActuelle.id],
        ["Type", biereActuelle.type],
        ["Degré d'alcool", biereActuelle.degre + " %"],
        ["Degré Plato", biereActuelle.degrePlato + " °P"],
        ["Nomenclature Douanière", biereActuelle.Nomenclature],
        ["Droits d'Accises", biereActuelle.DroitsDAccises],
        ["Type de droits", biereActuelle.typesDroits],
        ["Pays d'origine", biereActuelle.PaysOrigine],
        ["Péremption", biereActuelle.Péremption + " MOIS"],
        ["Code Article GBS / Fournisseur", biereActuelle.codeArticleFournisseur],
        [""],
        ["CONDITIONNEMENT (UVC)", ""],
        ["Type de contenant", biereActuelle.UVC.type],
        ["Gencod UVC", biereActuelle.UVC.Gencod],
        ["Poids (kg)", biereActuelle.UVC.poids],
        ["Dimensions (mm)", `L: ${biereActuelle.UVC.long} x l: ${biereActuelle.UVC.larg} x H: ${biereActuelle.UVC.hauteur}`],
        [""],
        ["UNITÉ DE DISTRIBUTION (CARTON)", ""],
        ["Type", biereActuelle.UD.type],
        ["Gencod Carton", biereActuelle.UD.Gencod],
        ["Nombre d'UVC par Carton", biereActuelle.UD.nbUVC],
        ["Poids du Carton (kg)", biereActuelle.UD.poids],
        ["Volume (Litres)", biereActuelle.UD.Volume],
        ["Dimensions (mm)", `L: ${biereActuelle.UD.long} x l: ${biereActuelle.UD.larg} x H: ${biereActuelle.UD.hauteur}`],
        [""],
        ["LOGISTIQUE & PALETTE", ""],
        ["Type de Palette", biereActuelle.palette.type],
        ["Gencod Palette", biereActuelle.palette.Gencod],
        ["Disposition", `${biereActuelle.palette.nbCouche} couches de ${biereActuelle.palette.nbPerCouche} UVC`],
        ["Total UVC sur Palette", biereActuelle.palette.nbUVC],
        ["Poids Total Palette (kg)", biereActuelle.palette.poids],
        ["Délai d'approvisionnement", biereActuelle.delaiAppro + " jours"]
    ];

    // B. On crée le fichier Excel virtuel
    const feuille = XLSX.utils.aoa_to_sheet(donnees);
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Fiche Création GMS");

    // C. On élargit les colonnes pour que ce soit beau et lisible
    feuille['!cols'] = [{ wch: 35 }, { wch: 50 }];

    // D. On lance le téléchargement sur le PC du client !
    // Le fichier s'appellera par exemple : Fiche_Creation_LB33.xlsx
    XLSX.writeFile(classeur, `Fiche_Creation_${biereActuelle.codeArticleFournisseur}.xlsx`);
}

