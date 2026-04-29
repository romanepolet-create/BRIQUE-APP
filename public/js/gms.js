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
    const nomPropre = biereActuelle.id.replace(/(33cl|75cl|CAN 44cl)/i, '').trim(); // 👈 ELLE EST ICI !
    let couleur = "Blonde"; // Par défaut, on voit que tout ton JSON est Blonde
    if (biereActuelle.type.toLowerCase().includes("ambré")) couleur = "Ambrée";
    if (biereActuelle.type.toLowerCase().includes("brun")) couleur = "Brune";
    if (biereActuelle.type.toLowerCase().includes("blanch")) couleur = "Blanche";
    
    let contenant = biereActuelle.UVC.type === "BOUTEILLE" ? "VERRE PERDU" : "BOITE METAL";

    let volUVC = 0.33;
    if (biereActuelle.id.includes("75cl")) volUVC = 0.75;
    if (biereActuelle.id.includes("44cl")) volUVC = 0.44;

    const bordureFine = {
      top: { style: "thin", color: { auto: 1 } },
      bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } },
      right: { style: "thin", color: { auto: 1 } }
    }

    const sTitreSection = {
      font: {name: "Lexend Deca",
             sz: 12, 
             bold: true, 
             color:{rgb: "002AB6"}
      }, fill: {fgColor: {rgb: "F3B0CF"}
      }, alignment: {vertical: "center", horizontal: "center"
      }, border: bordureFine
    };

    const sCentreGrasCouleur = {
      font: {name: "Lexend Deca",
             sz: 10, 
             bold: true, 
             color:{rgb: "FFFFFF"}
      }, fill: {fgColor: {rgb: "002AB6"}
      }, alignment: {horizontal: "center",
                    vertical: "center",
                    wrapText: true
      }, border: bordureFine
    };

    const sLabel = {
      font: { name: "Lexend Deca", sz: 10, bold: true },
      border: bordureFine,
      alignment: {horizontal: "center",
                    vertical: "center",
                    wrapText: true
                 }

    };

    const sGras = {
      font: {name: "Lexend Deca",
             sz: 10, 
             bold: true, 
      }, border: bordureFine
    };

    const sNormal = {
      font: {name: "Lexend Deca",
             sz: 10, 
      }, border: bordureFine
    };

    const sVide = {};

    const sCentre = {
      font: {name: "Lexend Deca",
             sz: 10, 
      }, alignment: {horizontal: "center",
                     vertical: "center",
      }, border: bordureFine
    };

    const donnees = Array(40).fill(null).map(() => Array(14).fill({ v: "", s: sVide }));

    const setCell = (row, col, val, style) => {
      donnees[row][col] = { v: val, s: style };
    };


    // --- EN TÊTE ---
    setCell(1, 1, "FORMULAIRE DE CREATION D'ARTICLE", sTitreSection); // Ligne 2, Colonne C

    // --- INFORMATIONS GENERALES ---
    setCell(4, 1, "INFORMATIONS GENERALES", sTitreSection);

    setCell(6, 0, "Adhérent", sLabel);                  setCell(6, 1, "BRIQUE HOUSE BREWERY", sNormal);
    setCell(6, 4, "Nom de la bière", sLabel);           setCell(6, 5, nomPropre, sNormal);
    
    setCell(7, 0, "Code article fournisseur", sLabel);  setCell(7, 1, biereActuelle.codeArticleFournisseur || "", sNormal);
    setCell(7, 4, "Couleur", sLabel);                   setCell(7, 5, couleur, sNormal);
    
    setCell(8, 0, "Degré(s) alcool", sLabel);           setCell(8, 1, biereActuelle.degre + "°", sNormal);
    setCell(8, 4, "Type", sLabel);                      setCell(8, 5, biereActuelle.type, sNormal);
    
    setCell(9, 0, "Degré(s) plato", sLabel);            setCell(9, 1, biereActuelle.degrePlato + " °P", sNormal);

    setCell(10, 0, "Nomenclature douanière", sLabel);   setCell(10, 1, biereActuelle.Nomenclature, sNormal);
    setCell(10, 4, "Désignation de l'article", sLabel); setCell(10, 5, biereActuelle.id, sNormal);
    
    setCell(11, 0, "Droits d'Accises", sLabel);         setCell(11, 1, biereActuelle.DroitsDAccises, sNormal);
    setCell(12, 0, "Type droits", sLabel);              setCell(12, 1, biereActuelle.typesDroits, sNormal);
    setCell(13, 0, "Pays d'origine", sLabel);           setCell(13, 1, "FRANCE", sNormal);
    setCell(14, 0, "Péremption ( en mois )", sLabel);   setCell(14, 1, biereActuelle.Péremption, sNormal);
    setCell(15, 0, "Marque", sLabel);                   setCell(15, 1, "BRIQUE HOUSE", sNormal);
    setCell(16, 0, "Circuit de distribution", sLabel);  setCell(16, 1, "GMS", sNormal);

    // --- CONDITIONNEMENT ---
    setCell(19, 1, "CONDITIONNEMENT", sTitreSection);
    
    setCell(21, 0, "Type de contenant", sLabel);        setCell(21, 1, contenant, sNormal);

    // En-têtes du grand tableau
    const colonnesTableau = ["Type", "Gencod", "Longueur (mm)", "Largeur(mm)", "Hauteur(mm)", "Poids (kg)", "Volume (L)", "Nb UVC", "Nb / couche", "Nb couche"];
    colonnesTableau.forEach((titre, index) => {
        setCell(23, 2 + index, titre, sCentreGrasCouleur); // Commence à la colonne E (index 4)
    });

    // Ligne UVC
    setCell(24, 0, "UVC ( Unité Vente Consommateur )", sLabel);
    const donnesUVC = [biereActuelle.UVC.type, biereActuelle.UVC.Gencod, biereActuelle.UVC.long, biereActuelle.UVC.larg, biereActuelle.UVC.hauteur, biereActuelle.UVC.poids, volUVC, 1, "", ""];
    donnesUVC.forEach((val, i) => setCell(24, 2 + i, val, sCentre));

    // Ligne UD
    setCell(25, 0, "UD ( Unité de distribution )", sLabel);
    const donnesUD = [biereActuelle.UD.type, biereActuelle.UD.Gencod, biereActuelle.UD.long, biereActuelle.UD.larg, biereActuelle.UD.hauteur, biereActuelle.UD.poids, biereActuelle.UD.Volume, biereActuelle.UD.nbUVC, "", ""];
    donnesUD.forEach((val, i) => setCell(25, 2 + i, val, sCentre));

    // Ligne PALETTE
    setCell(26, 0, "PALETTE", sLabel);
    const donnesPal = [biereActuelle.palette.type, biereActuelle.palette.Gencod, biereActuelle.palette.long, biereActuelle.palette.larg, biereActuelle.palette.hauteur, biereActuelle.palette.poids, biereActuelle.palette.Volume, biereActuelle.palette.nbUVC, biereActuelle.palette.nbPerCouche, biereActuelle.palette.nbCouche];
    donnesPal.forEach((val, i) => setCell(26, 2 + i, val, sCentre));

    // --- APPROVISIONNEMENT ---
    setCell(29, 1, "APPROVISIONNEMENT", sTitreSection);
    setCell(31, 0, "Délai d'approvisionnement ( en jours )", sLabel); setCell(31, 1, biereActuelle.delaiAppro, sNormal);

    // 4. Création de la feuille
    const feuille = XLSX.utils.aoa_to_sheet(donnees);

    feuille['!merges'] = [
      { s: { r: 1, c: 1 }, e: { r: 1, c: 6 } }, // FORMULAIRE (B2 à G2)
      { s: { r: 4, c: 1 }, e: { r: 4, c: 6 } }, // INFOS (B5 à G5)
      { s: { r: 19, c: 1 }, e: { r: 19, c: 6 } }, // COND (B20 à G20)
      { s: { r: 29, c: 1 }, e: { r: 29, c: 6 } }  // APPRO (B30 à G30)
    ];

    // 5. Ajustement des largeurs de colonnes pour correspondre au design
    const colWidths = Array(14).fill({ wch: 12 }); // Largeur minimum par défaut

    donnees.forEach((ligne, indexLigne) => {
      if ([1, 4, 19, 29].includes(indexLigne)) return;

      ligne.forEach((cellule, indexCol) => {
        if (cellule && cellule.v) {
          const longueurTexte = cellule.v.toString().length;

          if (longueurTexte + 4 > colWidths[indexCol].wch) {
            colWidths[indexCol] = { wch: Math.min(longueurTexte + 4, 45) };
          }
        }
      });
    });

    colWidths[3] = { wch: 8 };
    feuille['!cols'] = colWidths;

    feuille['!views'] = [{showGridLines: false}];

    // 6. Téléchargement
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Formulaire_Article");
    XLSX.writeFile(classeur, `Creation_GMS_${biereActuelle.codeArticleFournisseur}.xlsx`);
}

function copierInfo(texte) {
  navigator.clipboard.writeText(texte);
  // Optionnel : petite notification "Copié !"
}
