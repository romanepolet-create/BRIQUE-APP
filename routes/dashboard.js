const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/kpis', async (req, res) => {
    try {
        const email = req.session.email || "inconnu@briquehouse.fr";

        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        const { data, error } = await supabase
            .from('dashboard_visites')
            .select('*')
            .eq('commercial_email', email)
            .gte('created_at', firstDayLastMonth);

        if (error) throw error;

        const toutesVisites = Array.isArray(data) ? data : [];
        const visitesMoisPrecedent = toutesVisites.filter(v => v.created_at >= firstDayLastMonth && v.created_at < firstDayThisMonth);

        // ==========================================
        // 4. CALCUL DES KPIs
        // ==========================================

        // KPI 1 : Visites réalisées
        const nbVisites = visitesMois.length;
        const nbVisitesM1 = visitesMoisPrecedent.length;

        // KPI 2 : MEA (HL)
        const meaHl = visitesMois.reduce((total, v) => total + (v.volume_mea || 0), 0);
        const meaHlM1 = visitesMoisPrecedent.reduce((total, v) => total + (v.volume_mea || 0), 0);

        // KPI 3 : Distributeurs Directs (Magasins uniques visités ce mois-ci)
        const enseignesDirectes = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U"];
        // Un "Set" permet d'éviter de compter 2 fois le même magasin s'il a été visité 2 fois !
        const magasinsDirectsVisites = new Set(
            visitesMois.filter(v => enseignesDirectes.includes(v.enseigne)).map(v => v.hubspot_id)
        );
        const nbDirects = magasinsDirectsVisites.size;

        // KPI 4 : Calcul intelligent de la DN
        // Fonction interne pour ne garder que la *dernière* visite de chaque magasin dans un mois
        const getLastVisitScore = (listeVisites) => {
            const mapMagasins = {};
            listeVisites.forEach(v => {
                // Si on n'a pas encore le magasin, ou si cette visite est PLUS récente, on remplace
                if (!mapMagasins[v.hubspot_id] || v.created_at > mapMagasins[v.hubspot_id].created_at) {
                    mapMagasins[v.hubspot_id] = v;
                }
            });
            // On additionne tous les scores finaux conservés
            return Object.values(mapMagasins).reduce((total, v) => total + (v.score_dn || 0), 0);
        };

        const dnFinale = getLastVisitScore(visitesMois);
        const dnInitiale = getLastVisitScore(visitesMoisPrecedent);

        // 5. On renvoie tout ça à l'écran !
        res.json({
            success: true,
            visites: nbVisites,
            visitesM1: nbVisitesM1,
            dnInitiale: dnInitiale,
            dnFinale: dnFinale,
            meaHl: parseFloat(meaHl.toFixed(2)), // Arrondi propre
            meaHlM1: parseFloat(meaHlM1.toFixed(2)),
            nbDirects: nbDirects
        });

    } catch (error) {
        console.error("🚨 Erreur Dashboard sécurisée:", error);
        res.json({
            success: true, visites: 0, visitesM1: 0, dnInitiale: 0, dnFinale: 0, meaHl: 0, meaHlM1: 0, nbDirects: 0
        });
    }
});

module.exports = router;
