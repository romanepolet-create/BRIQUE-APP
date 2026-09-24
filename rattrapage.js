require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function reparationFinale() {
    console.log("🛠️ Démarrage de la réparation chirurgicale de l'historique...");
    const { data: visites, error } = await supabase.from('dashboard_visites').select('*');
    if (error) return console.error("Erreur:", error);
    
    let count = 0;
    for (const visite of visites) {
        // On cible uniquement le passé (avant aujourd'hui)
        if (new Date(visite.created_at) < new Date('2026-09-24')) {
            const dnG = parseInt(visite.dn_gagne) || 0;
            const dnC = parseInt(visite.dn_constate) || 0;
            const vraiScoreExcel = dnG + dnC;

            // Si le score est absurde (comme le fameux 18) et qu'on a de la donnée Excel
            if (vraiScoreExcel > 0 && parseInt(visite.score_dn) !== vraiScoreExcel) {
                await supabase
                    .from('dashboard_visites')
                    .update({ score_dn: vraiScoreExcel })
                    .eq('id', visite.id);
                count++;
                console.log(`✅ Corrigé : ${visite.hubspot_id} (${visite.created_at.split('T')[0]}) -> le faux ${visite.score_dn} redevient ${vraiScoreExcel}`);
            }
        }
    }
    console.log(`\n🎉 Mission accomplie ! ${count} visites historiques ont été purgées du doublon.`);
}

reparationFinale();
