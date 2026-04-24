const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// ==========================================
// 🛠️ OUTILS PARTAGÉS
// ==========================================
const normaliser = (texte) => {
  if (!texte) return "";
  return texte.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z]/g,"");
};

const synonymes = {
  "acidifier": "acidite", "adoucie": "douce", "amertume": "amere",
  "houblonneafroid": "houblonnageafroid", "houblonneachaud": "houblonnageachaud",
  "laiteux": "laiteuse", "lactobacilles": "lactobacillus",
  "fermentationbasse": "bassefermentation", "fermentationhaute": "hautefermentation",
  "torrefie": "torrefier", "torrefies": "torrefier", "torrefiee": "torrefier", "torrefiees": "torrefier",
  "bacterielactique": "bacterieslactiques", "doux": "douce", "resineuse": "resineux",
  "rondes": "ronde", "clairs": "clair", "cuivres": "cuivre", "limpidite": "limpide"
};

// ==========================================
// ROUTE 1 : L'AUDIT DU GLOSSAIRE
// URL : http://localhost:3000/api/lexique/audit
// ==========================================

router.get('/audit', async (req, res) => {
  try {
    const dossiers = await fs.readdir(path.join(__dirname, '../data'));
    let tousLesMotsExistants = [];
    let tousLesLiensDemandes = [];

    for (let fichier of dossiers) {
      if (fichier.endsWith('.json')) {
        const contenu = await fs.readFile(path.join(__dirname, '../data', fichier), 'utf8');
        const json = JSON.parse(contenu);

        for (let item of json) {
          if (!item) continue;
          if (item.mot) tousLesMotsExistants.push(normaliser(item.mot));         
          if (item.desc) {
            const liensTrouves = item.desc.match(/([a-zA-ZÀ-ÿ_]+)\*/g);   
            if (liensTrouves) {
              liensTrouves.forEach(lien => {
                tousLesLiensDemandes.push({
                  motClique: lien.replace('*', ''),
                  titreDeLaDef: item.mot,
                  fichierSource: fichier
                });
              });
            }
          }
        }
      }
    }

    let problemes = [];
    tousLesLiensDemandes.forEach(recherche => {
      let motRechercheNettoye = normaliser(recherche.motClique);
      if (synonymes[motRechercheNettoye]) {
        motRechercheNettoye = synonymes[motRechercheNettoye];
      }

      let matchExact = tousLesMotsExistants.includes(motRechercheNettoye);
      let matchPartiel = tousLesMotsExistants.some(motExistant => 
        motExistant.includes(motRechercheNettoye) || motRechercheNettoye.includes(motExistant)
      );
      if (!matchExact && !matchPartiel) {
        problemes.push({
          "Mot ciblé (Cassé)": recherche.motClique.replace(/_/g, ' '),
          "Où se trouve l'erreur ?": recherche.titreDeLaDef,
          "Dans le fichier": recherche.fichierSource
        });
      }
    });

    console.log("\n=========================================");
    console.log("BILAN DE SANTÉ DES LIENS DU GLOSSAIRE");
    console.log("=========================================\n");

    if (problemes.length === 0) {
      console.log("✅ INCROYABLE ! Absolument tous les liens sont valides.");
      res.send("<h1 style='color:green; text-align:center;'>✅ Tout est parfait ! Regarde ton terminal.</h1>");
    } else {
      console.table(problemes);
      res.send(`<h1 style='color:red; text-align:center;'>⚠️ Aïe ! ${problemes.length} liens sont cassés. Regarde ton terminal pour voir le tableau !</h1>`);
    } 
  } catch (erreur) {
    console.error("Erreur d'audit:", erreur);
    res.status(500).send("Erreur lors de l'audit.");
  }
});

// ==========================================
// 🔍 ROUTE 2 : LA RECHERCHE (POPUP WIKI)
// ==========================================
router.get('/recherche/:mot', async (req, res) => {
  try {
    const motRechercheBrut = req.params.mot.replace('*', '').trim();
    let motRechercheNettoye = normaliser(motRechercheBrut);

    if (synonymes[motRechercheNettoye]) {
      motRechercheNettoye = synonymes[motRechercheNettoye];
    }

    console.log(`\n🔍 Recherche demandée: "${motRechercheBrut}" (Nettoyé/Traduit: "${motRechercheNettoye}")`);
    const dossiers = await fs.readdir(path.join(__dirname, '../data'));
    let matchPartiel = null;

    for (let fichier of dossiers) {
      if (fichier.endsWith('.json')) {
        try {
          const contenu = await fs.readFile(path.join(__dirname, '../data', fichier), 'utf8');
          const json = JSON.parse(contenu); 

          for (let item of json) {
            const texteAComparer = item.mot || item.b;
            if (!item || !texteAComparer) continue;
            const motJsonNettoye = normaliser(texteAComparer);

            let DRiche = item.desc || "Définitƣon non disponible.";
            if (item.b) {
              DRiche = "";
              if (item.detail) DRiche += `<em
                style="color:gray;">${item.detail}</em><br><br>`;
              if (item.desc) DRiche += `<strong>${item.desc}</strong><br><br>`;
              if (item.type) DRiche += `${item.type}<br><br>`;
              if (item.ie) DRiche += `${item.ie}<br>`;
              if (item.app) DRiche += `${item.app}<br>`;
              if (item.nez) DRiche += `${item.nez}<br>`;
              if (item.bouche) DRiche += `${item.bouche}<br>`;
              if (item.houblon) DRiche += `${item.houblon}`;
            }
            if (motJsonNettoye === motRechercheNettoye) {
              console.log(`✅ Trouvé EXACT dans ${fichier} !`); 
              return res.json({
                mot: texteAComparer,
                desc: DRiche || "Voir la fiche détaillée de cette bière."
              });
            }
            if (!matchPartiel && (motJsonNettoye.includes(motRechercheNettoye) || motRechercheNettoye.includes(motJsonNettoye))) {
              matchPartiel = {
                mot: texteAComparer,
                desc: DRiche || "Voir la fiche détaillée de cette bière."
              };
            }
          }
        } catch (errJson) {
              console.error(`⚠️ Erreur :`, errJson.message);
        }
      }
    }
    if (matchPartiel) {
      console.log(`✅ Trouvé PARTIEL : ${matchPartiel.mot}`);
      return res.json(matchPartiel);
    }
    console.log(`❌ Introuvable.`);
    res.status(404).json({erreur: "Définition introuvable"});
  } catch (erreur) {
      console.error(erreur);
      res.status(500).json({erreur: "Erreur du glossaire."});
  }
});

// ==========================================
// 📖 ROUTE 3 : AFFICHER UNE CATÉGORIE ENTIÈRE 
// (⚠️ DOIT TOUJOURS RESTER EN DERNIER !)
// ==========================================

router.get('/:categorie', async (req, res) => {
  try {
    const categorie = req.params.categorie;
    const cheminFichier = path.join(__dirname, '../data', `${categorie}.json`);
    const fichierBrut = await fs.readFile(cheminFichier, 'utf8');
    res.json(JSON.parse(fichierBrut));
  } catch (erreur) {
    console.error("Erreur de lecture du lexique:", erreur);
    res.status(404).json({erreur: "Cette page du glossaire n'existe pas encore."});
  }
});

module.exports = router;
