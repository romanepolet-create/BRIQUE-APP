const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/data', async (req, res) => {
    const emailConnecte = req.session.email || "inconnu@briquehouse.fr";
    const admins = ["leo.blanchet@briquehouse.fr", "romane.polet@briquehouse.fr"];
    const isAdmin = admins.includes(emailConnecte.toLowerCase());

    try {
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        const { data: visitesData } = await supabase.from('dashboard_visites').select('*').gte('created_at', firstDayLastMonth);
        const visitesBrutes = Array.isArray(visitesData) ? visitesData : [];

        const { data: objData } = await supabase.from('objectifs_commerciaux').select('*');
        const objectifs = Array.isArray(objData) ? objData : [];

        let listeCommerciaux = [];
        if (isAdmin) {
            listeCommerciaux = [...new Set(visitesBrutes.map(v => v.commercial_email))].filter(Boolean);
        }

        let listeMagasins = [];
        try {
            const { data: gmsData } = await supabase.from('GMS').select('hubspot_id, nom, enseigne, "Propriétaire"');
            if (gmsData) listeMagasins = gmsData;
        } catch (e) {
            console.error("Erreur GMS :", e);
        }
        
        res.json({ success: true, emailConnecte, isAdmin, listeCommerciaux, visitesBrutes, objectifs, listeMagasins });
        
    } catch (error) {
        console.error("🚨 Erreur Route Dashboard:", error);
        res.json({ success: false, error: "Erreur serveur" });
    }
});

module.exports = router;
