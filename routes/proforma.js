const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// ==========================================
// ROUTE POUR LIRE LE JSON FINANCIER PROFORMA
// ==========================================
router.get('/', async (req, res) => {
  try {
    // Il va chercher ton fichier (vérifie que proforma.json est bien dans le dossier data/)
    const cheminFichier = path.join(__dirname, '../data', 'proforma.json');
    const data = await fs.readFile(cheminFichier, 'utf-8');
    
    // Il l'envoie au navigateur
    res.json(JSON.parse(data));
  } catch (erreur) {
    console.error("Erreur de lecture de proforma.json :", erreur);
    res.status(500).json({ message: "Impossible de charger les données financières" });
  }
});

module.exports = router;
