const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');


// On stocke le chemin vers le fichier pour ne pas le retaper partout
const cheminGeo = path.join(__dirname, '../data', 'geo.json');

router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(cheminGeo, 'utf-8');
    res.json(JSON.parse(data));
  } catch (erreur) {
    console.error("Erreur de lecture de geo.json :", erreur);
    res.status(500).json({ message: "Impossible de charger la carte" });
  }
});

module.exports = router;
