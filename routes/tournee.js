const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ROUTE : Sauvegarder (Écraser) la tournée
router.post('/sauvegarder', async (req, res) => {
    const userId = req.session.userId;
    const listeMagasins = req.body.magasins;

    if (!userId) return res.status(401).json({ error: "Non connecté" });
    const { data, error } = await supabase
        .from('tournees')
        .upsert({ user_id: userId, magasins: listeMagasins }, { onConflict: 'user_id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

router.get('/charger', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ error: "Non connecté" });

    const { data, error } = await supabase
        .from('tournees')
        .select('magasins')
        .eq('user_id', userId)
        .single();

    if (error || !data) return res.json({ success: false }); 
    
    return res.json({ success: true, tournee: data });
});

module.exports = router;
