const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mtvzhpqticnxqcxsadkg.supabase.co', process.env.SUPABASE_ANON_KEY);

// On stocke le chemin vers le fichier pour ne pas le retaper partout
const cheminDistrib = path.join(__dirname, '../data', 'distrib.json');


router.get('/', async (req, res) => {
  try {
    // On demande TOUTES les données de la table 'distributeurs' à Supabase
    const { data, error } = await supabase.from('distributeurs').select('*');
    
    if (error) {
      throw error;
    }
    
    // On renvoie la vraie donnée fraîche au frontend
    res.json(data);
    
  } catch (erreur) {
    console.error("Erreur de lecture Supabase :", erreur);
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
