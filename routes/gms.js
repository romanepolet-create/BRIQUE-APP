const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mtvzhpqticnxqcxsadkg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dnpocHF0aWNueHFjeHNhZGtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTc1MCwiZXhwIjoyMDkzNjA1NzUwfQ.r2JXBf8hLrukjKOLQFlVqCBXDx8AjxlgVMGKir1a55U');

/*router.get('/', async (req, res) => {
  try {
    // On demande à Supabase de récupérer toutes les lignes de la table GMS
    const { data, error } = await supabase
      .from('GMS')
      .select('*')
      .limit(100000);

    console.log("Nombre reçu depuis Supabase :", data?.length);

    if (error) {
      throw error;
    }

    // On renvoie les données au format JSON à ton frontend
    res.json(data);

  } catch (err) {
    console.error("Erreur Supabase GMS :", err);
    res.status(500).json({ error: "Erreur lors de la récupération des magasins." });
  }
});

module.exports = router;*/

const cheminMapGMS = path.join(__dirname, '../data', 'mapGMS.json');

router.get('/', async (req, res) => {
	try { 
		const data = await fs.readFile(cheminMapGMS, 'utf-8');
		
    res.json(JSON.parse(data));
  } catch(erreur) {
    console.error('Erreur de lecture de proforma.json :', erreur);
    res.status(500).json({ message: "Impossible de charger les donnees magasins" });
  }
});

module.exports = router;
