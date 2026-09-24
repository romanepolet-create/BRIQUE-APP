require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function retablirLaVerite() {
    try {
        console.log("🔍 Analyse de la vérité absolue (historique_visites)...");
        
        const { data: historiques, error: errH } = await supabase.from('historique_visites').select('*');
        if (errH) throw errH;

        const { data: dashboards, error: errD } = await supabase.from('dashboard_visites').select('*');
        if (errD) throw errD;

        // 🛠️ LA CORRECTION EST ICI : On isole UNIQUEMENT la toute dernière visite de chaque magasin
        const derniersHistoriques = {};
        for (const h of historiques) {
            if (!derniersHistoriques[h.hubspot_id] || new Date(h.created_at) > new Date(derniersHistoriques[h.hubspot_id].created_at)) {
                derniersHistoriques[h.hubspot_id] = h;
            }
        }

        let corrections = 0;

        // On boucle uniquement sur la version la plus récente !
        for (const histo of Object.values(derniersHistoriques)) {
            let vraiScore = 0;
            if (histo.references && typeof histo.references === 'object') {
                Object.values(histo.references).forEach(val => {
                    if (typeof val === 'string') {
                        const clean = val.trim().toLowerCase();
                        if (['oui', 'gagné', 'gagne', 'constaté', 'constate'].includes(clean)) {
                            vraiScore++;
                        }
                    }
                });
            }

            const visitesDuMagasin = dashboards.filter(v => String(v.hubspot_id) === String(histo.hubspot_id));
            
            if (visitesDuMagasin.length > 0) {
                visitesDuMagasin.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const derniereVisite = visitesDuMagasin[0];

                if (parseInt(derniereVisite.score_dn) !== vraiScore) {
                    await supabase
                        .from('dashboard_visites')
                        .update({ score_dn: vraiScore })
                        .eq('id', derniereVisite.id);
                    
                    corrections++;
                    console.log(`✅ Corrigé : Magasin ${histo.hubspot_id} -> remis à ${vraiScore} (était à ${derniereVisite.score_dn})`);
                }
            }
        }
        
        console.log(`\n🎉 Terminé ! ${corrections} magasins ont retrouvé leur vrai score sur le dashboard.`);
    } catch (err) {
        console.error("Erreur :", err);
    }
}

retablirLaVerite();
