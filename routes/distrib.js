const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mtvzhpqticnxqcxsadkg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dnpocHF0aWNueHFjeHNhZGtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTc1MCwiZXhwIjoyMDkzNjA1NzUwfQ.r2JXBf8hLrukjKOLQFlVqCBXDx8AjxlgVMGKir1a55U');

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
  const { id, bieres } = req.body;

  const { error } = await supabase
    .from('distributeurs')
    .update({ bieres: bieres })
    .eq('id', id);

  if (error) return res.status(500).json({ message: "Erreur de sauvegarde" });
  res.json({ message: "✅ Sauvegardé !" });
});



module.exports = router
