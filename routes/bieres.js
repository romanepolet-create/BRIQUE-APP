const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');


// On stocke le chemin vers le fichier pour ne pas le retaper partout
const cheminBieres = path.join(__dirname, '../data', 'bieres.json');

// ==========================================
// 📖 ROUTE GET : LIRE LA CAVE (ET FILTRER)
// ==========================================
router.get('/', async (req, res) => {
  try {
    // 1. On lit le fichier JSON
    const contenu = await fs.readFile(cheminBieres, 'utf8');
    const caveGMS = JSON.parse(contenu);

    // 2. On applique ton filtre si l'URL contient ?min=
    const {min} = req.query;
    if(min) {
      const bieresFiltrees = caveGMS.filter(b => b.degre >= parseFloat(min));
      return res.json(bieresFiltrees);
    }
                                              
    // 3. Sinon, on renvoie tout
    res.json(caveGMS);
  } catch (erreur) {
    console.error("Erreur lecture bières:", erreur);
    res.status(500).json({erreur: "Impossible de lire la cave."});
  }
});



// ==========================================
// 🍺 ROUTE GET : LIRE UNE SEULE BIÈRE (Celle qui manquait !)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const idDemande = req.params.id;
    const contenu = await fs.readFile(cheminBieres, 'utf8');
    const bieres = JSON.parse(contenu);

    const biereTrouvee = bieres.find(biere => biere.id === idDemande);
                          
    if (biereTrouvee) {
      res.json(biereTrouvee);
    } else {
      res.status(404).json({ erreur: "Bière introuvable." });
    }
  } catch (erreur) {
   console.error("Erreur lecture bière unique:", erreur);
    res.status(500).json({ erreur: "Problème serveur." });
  }
});


// ==========================================
// ✍️ ROUTE POST : AJOUTER ET SAUVEGARDER
// ==========================================
router.post('/', async (req, res) => {
  try {
    // 1. On ouvre le fichier actuel
    const contenu = await fs.readFile(cheminBieres, 'utf8');
    const caveGMS = JSON.parse(contenu);

    // 2. On ajoute la nouvelle bière envoyée par le client
    const nvBiere = req.body;
    caveGMS.push(nvBiere);

    // 3. LA MAGIE : On réécrit le fichier JSON en entier avec la nouvelle bière !
    // JSON.stringify(data, null, 2) permet de garder le fichier bien formaté et lisible
    await fs.writeFile(cheminBieres, JSON.stringify(caveGMS, null, 2), 'utf8');

    // 4. On confirme le succès
    res.status(201).json({
      message: "Bière ajoutée et sauvegardée en dur avec succès !",
      caveGMS: caveGMS
    });
  } catch (erreur) {
    console.error("Erreur écriture bières:", erreur);
    res.status(500).json({erreur: "Impossible de sauvegarder la nouvelle bière."});
  }
});


module.exports = router; // On exporte ce "mini-serveur" pour l'utiliser ailleurs
