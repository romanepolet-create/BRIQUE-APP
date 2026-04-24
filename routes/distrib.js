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

module.exports = router
