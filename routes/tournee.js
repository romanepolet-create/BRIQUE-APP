const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ROUTE : Sauvegarder (Écraser) la tournée
router.post('/sauvegarder', async (req, res) => {
    const userId = req.session.userId;
    const email = req.session.email;
    const listeMagasins = req.body.magasins;

    if (!userId) return res.status(401).json({ error: "Non connecté" });
    const { data, error } = await supabase
        .from('tournees')
        .upsert({ user_id: userId, email: email, magasins: listeMagasins }, { onConflict: 'user_id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
});

router.get('/equipe', async (req, res) => {
    const email = req.session.email;
    if (email !== 'romane.polet@briquehouse.fr' && email !== 'leo.blanchet@briquehouse.fr') {
        return res.status(403).json({ error: "Accès refusé" });
    }
    
    const { data, error } = await supabase.from('tournees').select('email, magasins');
    if (error) return res.status(500).json({ error: error.message });
    
    return res.json({ success: true, tournees: data });
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
