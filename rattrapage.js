require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function retablirLaVerite() {
    try {
        console.log("🔍 Analyse de la vérité absolue (historique_visites)...");
        
        // 1. Récupération de la vérité (le JSON des cases cochées)
        const { data: historiques, error: errH } = await supabase.from('historique_visites').select('*');
        if (errH) throw errH;

        // 2. Récupération des visites du dashboard
        const { data: dashboards, error: errD } = await supabase.from('dashboard_visites').select('*');
        if (errD) throw errD;

        let corrections = 0;

        for (const histo of historiques) {
            // Calcul du VRAI score d'après les cases réellement cochées dans le JSON
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

            // On cherche la DERNIÈRE visite de ce magasin dans le dashboard
            const visitesDuMagasin = dashboards.filter(v => String(v.hubspot_id) === String(histo.hubspot_id));
            
            if (visitesDuMagasin.length > 0) {
                // Tri de la plus récente à la plus ancienne
                visitesDuMagasin.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const derniereVisite = visitesDuMagasin[0];

                // Si le score affiché sur le dashboard est différent de la réalité des cases
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
