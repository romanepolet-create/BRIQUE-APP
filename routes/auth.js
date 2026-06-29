const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.endsWith('@briquehouse.fr')) {
    return res.status(403).json({ error: "Seules les adresses @briquehouse.fr sont autorisées." });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ success: true, message: "Un e-mail de confirmation vient d'être envoyé." });
});

// --- ROUTE 2 : CONNEXION ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.endsWith('@briquehouse.fr')) {
    return res.status(403).json({ error: "Email non autorisé." });
  }

  // Supabase vérifie le mot de passe
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect (ou non vérifié)." });
  }
  req.session.userId = data.user.id;

  req.session.email = email;
  req.session.save((err) => {
    if (err) {
      console.error("Erreur de session:", err);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
    // On ne répond "success" que quand on est SÛR que c'est mémorisé
    return res.json({ success: true });
  });
});

module.exports = router;
