require('dotenv').config();
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// Connexions
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const GOOGLE_SHEET_ID = process.env.GSHEET_VISITE;
const auth = new google.auth.GoogleAuth({
  keyFile: './config/google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function rattraperTout() {
    try {
        console.log("🚀 Démarrage du Grand Rattrapage Absolu...");
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Lister tous les onglets du fichier Excel
        const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
        const onglets = sheetMetadata.data.sheets
            .map(s => s.properties.title)
            .filter(title => /^\d{2}-\d{4}$/.test(title)); // Ne garde que les onglets au format "MM-YYYY"

        console.log(`📑 Onglets détectés : ${onglets.join(', ')}`);

        // 2. Récupérer TOUTES les visites du dashboard Supabase pour faire le lien
        console.log("📥 Téléchargement de la base de données Supabase...");
        const { data: visitesDb, error } = await supabase
            .from('dashboard_visites')
            .select('id, hubspot_id, created_at')
            .limit(50000);
            
        if (error) throw error;

        let totalMaj = 0;

        // 3. Boucler sur chaque onglet
        for (const onglet of onglets) {
            console.log(`\n⏳ Traitement de l'onglet : ${onglet}...`);
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: GOOGLE_SHEET_ID,
                range: `${onglet}!A2:Z`, // On ignore la première ligne (titres)
            });

            const rows = response.data.values || [];
            let ongletMaj = 0;

            for (const row of rows) {
                const hubspot_id = row[1];
                const dateExcel = row[4]; // Format "18/09/2026 11:28:43"

                if (!hubspot_id || !dateExcel) continue;

                // Convertir la date Excel en format Supabase (YYYY-MM-DD)
                const [jour, mois, annee] = dateExcel.split(' ')[0].split('/');
                const dateCible = `${annee}-${mois}-${jour}`;

                let dn_gagne = 0;
                let dn_constate = 0;

                // Les bières sont stockées des colonnes H (7) à V (21)
                for (let i = 7; i <= 21; i++) {
                    const val = (row[i] || "").trim().toLowerCase();
                    // Les OUI sont désormais comptés comme des Gagnés !
                    if (['gagné', 'gagne', 'oui'].includes(val)) dn_gagne++;
                    else if (['constaté', 'constate', 'constatée'].includes(val)) dn_constate++;
                }

                if (dn_gagne > 0 || dn_constate > 0) {
                    // Trouver la ligne exacte dans Supabase (Même ID + Même jour)
                    const visite = visitesDb.find(v => 
                        String(v.hubspot_id) === String(hubspot_id) && 
                        v.created_at.startsWith(dateCible)
                    );

                    if (visite) {
                        await supabase
                            .from('dashboard_visites')
                            .update({ dn_gagne: dn_gagne, dn_constate: dn_constate })
                            .eq('id', visite.id);

                        ongletMaj++;
                        totalMaj++;
                    }
                }
            }
            console.log(`✅ ${ongletMaj} visites mises à jour pour le mois de ${onglet}.`);
        }

        console.log(`\n🎉 TERMINÉ ! Un total de ${totalMaj} visites ont été restaurées avec succès dans Supabase.`);
    } catch (err) {
        console.error("🚨 Erreur lors du rattrapage :", err);
    }
}

rattraperTout();
