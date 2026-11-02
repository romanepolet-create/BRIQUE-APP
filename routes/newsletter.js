const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const moisActuel = req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const [resVisites, resMagasins, resObjectifs] = await Promise.all([
            supabase.from('dashboard_visites').select('*').limit(10000),
            supabase.from('GMS').select('hubspot_id, nom, enseigne'),
            supabase.from('objectifs_mensuels').select('*').eq('mois', moisActuel)
        ]);

        res.json({
            visitesBrutes: resVisites.data || [],
            listeMagasins: resMagasins.data || [],
            objectifsData: resObjectifs.data || []
        });

    } catch (err) {
        console.error("Erreur API newsletter:", err);
        res.status(500).json({ error: "Erreur lors de la récupération des données." });
    }
});

module.exports = router;
