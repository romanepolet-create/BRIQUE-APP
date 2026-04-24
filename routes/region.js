const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const cheminRegion = path.join(__dirname, '../data', 'region.geojson');

router.get('/', async(req, res) => {
  try {
    const data = await fs.readFile(cheminRegion, 'utf-8');
    res.json(JSON.parse(data));
  } catch (erreur) {
    console.error("Erreur de lecture de region.json:", erreur);
    res.status(500).json({message: "Impossible de charger les régions"});
  }
});

module.exports = router;
