const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase for this route file
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch all users
router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST: Update a user's role
router.post('/update-role', async (req, res) => {
  const { targetUserId, newRole } = req.body;
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Rôle mis à jour avec succès" });
});

module.exports = router;
