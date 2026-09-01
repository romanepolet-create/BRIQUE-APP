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
        
        let listeMagasins = [];
        try {
            const { data: gmsData } = await supabase.from('GMS').select('hubspot_id, nom, enseigne, "Propriétaire", "Priorité"');
            if (gmsData) listeMagasins = gmsData;
        } catch (e) {
            console.error("Erreur GMS :", e);
        }

        let listeCommerciaux = [];
        if (isAdmin) {
            let tousLesEmails = [
                ...visitesBrutes.map(v => v.commercial_email),
                ...objectifs.map(o => o.commercial_email)
            ];

            const proprietairesGMS = [...new Set(listeMagasins.map(m => m.Propriétaire))].filter(p => p && p !== "Vacant" && p !== "Vacant Nord");
            const emailsDepuisGMS = proprietairesGMS.map(nom => {
                return nom.toLowerCase().trim().replace(/\s+/g, '.') + '@briquehouse.fr';
            });
            tousLesEmails = [...tousLesEmails, ...emailsDepuisGMS];
            
            listeCommerciaux = [...new Set(tousLesEmails)].filter(Boolean);
        }      
        
        res.json({ success: true, emailConnecte, isAdmin, listeCommerciaux, visitesBrutes, objectifs, listeMagasins });
        
    } catch (error) {
        console.error("🚨 Erreur Route Dashboard:", error);
        res.json({ success: false, error: "Erreur serveur" });
    }
});

module.exports = router;
