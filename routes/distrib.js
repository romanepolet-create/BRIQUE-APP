const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');


// On stocke le chemin vers le fichier pour ne pas le retaper partout
const cheminDistrib = path.join(__dirname, '../data', 'distrib.json');

router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(cheminDistrib, 'utf-8');
    res.json(JSON.parse(data));
  } catch (erreur) {
   console.error("Erreur de lecture de distrib.json :", erreur);
   res.status(500).json({ message: "Impossible de charger les distributeurs" });
 }
});

// ==========================================
// ROUTE POUR SAUVEGARDER LES BIÈRES
// ==========================================
router.post('/update', async (req, res) => {
  // 1. On récupère les infos envoyées par le bouton "Sauvegarder"
  const idDistrib = req.body.id;
  const nouvellesBieres = req.body.bieres;

  try {
    const fs = require('fs').promises;
    const path = require('path');
    const cheminDistrib = path.join(__dirname, '../data', 'distrib.json');

    // 2. On lit le fichier actuel
    const data = await fs.readFile(cheminDistrib, 'utf-8');
    let distributeurs = JSON.parse(data);

    // 3. On cherche le distributeur qu'on est en train de modifier
    const index = distributeurs.findIndex(d => String(d.id) === String(idDistrib));

    if (index !== -1) {
      // 4. On met à jour ses bières
      distributeurs[index].bieres = nouvellesBieres;

      // 5. On réécrit le fichier avec les nouvelles données ! (null, 2 permet de garder un fichier propre et indenté)
      await fs.writeFile(cheminDistrib, JSON.stringify(distributeurs, null, 2));
      
      res.json({ message: "✅ Sauvegarde réussie !" });
    } else {
      res.status(404).json({ message: "❌ Distributeur introuvable" });
    }

  } catch (erreur) {
    console.error("Erreur de sauvegarde :", erreur);
    res.status(500).json({ message: "Erreur serveur lors de la sauvegarde" });
  }
});

module.exports = router
