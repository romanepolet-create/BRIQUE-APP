const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/kpis', async (req, res) => {
    const emailConnecte = req.session.email || "inconnu@briquehouse.fr";

    const admins = ["leo.blanchet@briquehouse.fr", "romane.polet@briquehouse.fr"];
    const isAdmin = admins.includes(emailConnecte.toLowerCase());

    let filtreRequis = req.query.filtre || 'general';

    if (!isAdmin && filtreRequis !== 'general' && filtreRequis !== emailConnecte) {
        filtreRequis = 'general';
    }
     try {
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

        let query = supabase.from('dashboard_visites').select('*').gte('created_at', firstDayLastMonth);

        if (filtreRequis !== 'general') {
            query = query.eq('commercial_email', filtreRequis);
        }

        const { data, error } = await query;
        if (error) throw error;

        const toutesVisites = Array.isArray(data) ? data : [];
        const visitesMois = toutesVisites.filter(v => v.created_at >= firstDayThisMonth);
        const visitesMoisPrecedent = toutesVisites.filter(v => v.created_at >= firstDayLastMonth && v.created_at < firstDayThisMonth);

        let listeCommerciaux = [];
        if (isAdmin) {
            const { data: allMails } = await supabase.from('dashboard_visites').select('commercial_email');
            if (allMails) {
                listeCommerciaux = [...new Set(allMails.map(v => v.commercial_email))].filter(Boolean);
            }
        }

        // ==========================================
        // 4. CALCUL DES KPIs
        // ==========================================

        const nbVisites = visitesMois.length;
        const nbVisitesM1 = visitesMoisPrecedent.length;

        const meaHl = visitesMois.reduce((total, v) => total + (v.volume_mea || 0), 0);
        const meaHlM1 = visitesMoisPrecedent.reduce((total, v) => total + (v.volume_mea || 0), 0);

        const enseignesDirectes = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U"];
        const magasinsDirectsVisites = new Set(
            visitesMois.filter(v => enseignesDirectes.includes(v.enseigne)).map(v => v.hubspot_id)
        );
        const nbDirects = magasinsDirectsVisites.size;

        const getLastVisitScore = (listeVisites) => {
            const mapMagasins = {};
            listeVisites.forEach(v => {
                if (!mapMagasins[v.hubspot_id] || v.created_at > mapMagasins[v.hubspot_id].created_at) {
                    mapMagasins[v.hubspot_id] = v;
                }
            });
            return Object.values(mapMagasins).reduce((total, v) => total + (v.score_dn || 0), 0);
        };

        const dnFinale = getLastVisitScore(visitesMois);
        const dnInitiale = getLastVisitScore(visitesMoisPrecedent);

        res.json({
            success: true,
            emailConnecte: emailConnecte,
            isAdmin: isAdmin,
            listeCommerciaux: listeCommerciaux,
            visites: nbVisites,
            visitesM1: nbVisitesM1,
            dnInitiale: dnInitiale,
            dnFinale: dnFinale,
            meaHl: parseFloat(meaHl.toFixed(2)),
            meaHlM1: parseFloat(meaHlM1.toFixed(2)),
            nbDirects: nbDirects
        });

    } catch (error) {
        console.error("🚨 Erreur Dashboard sécurisée:", error);
        res.json({
            success: true, emailConnecte, isAdmin, listeCommerciaux: [],
            visites: 0, visitesM1: 0, dnInitiale: 0, dnFinale: 0, meaHl: 0, meaHlM1: 0, nbDirects: 0
        });
    }
});

module.exports = router;
