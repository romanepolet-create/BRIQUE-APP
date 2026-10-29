const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialisation de Supabase
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- ROUTE : POST /api/qualite/remontee ---
router.post('/remontee', async (req, res) => {
  const { reference, numero_lot, format, description } = req.body;

  if (!reference || !numero_lot || !format || !description) {
    return res.status(400).json({ error: "Tous les champs sont obligatoires." });
  }

  // Insertion dans Supabase (table: remontees_qualite)
  const { data, error } = await supabase
    .from('remontees_qualite')
    .insert([
      { 
        reference, 
        numero_lot, 
        format, 
        description,
        user_email: req.session.email // On trace le commercial qui fait la remontée grâce à la session express
      }
    ]);

  if (error) {
    console.error("Erreur d'insertion Supabase (Qualité):", error);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement dans la base." });
  }

  return res.json({ success: true, message: "Problème signalé avec succès !" });
});

module.exports = router;
