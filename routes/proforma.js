const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// ==========================================
// ROUTE POUR LIRE LE JSON FINANCIER PROFORMA
// ==========================================
const cheminProforma = path.join (__dirname, '../data', 'proforma.json');

router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(cheminProforma, 'utf-8');
                  
    res.json(JSON.parse(data));
  } catch (erreur) {
    console.error("Erreur de lecture de proforma.json :", erreur);
    res.status(500).json({ message: "Impossible de charger les données financières" });
  }
});

module.exports = router;
