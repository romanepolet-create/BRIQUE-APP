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

async function rattraperExcelVersSupabase() {
    try {
        console.log("🔄 Lancement de la machine à remonter le temps...");

        const aujourdhui = new Date();
        const nomOngletSheet = `${String(aujourdhui.getMonth() + 1).padStart(2, '0')}-${aujourdhui.getFullYear()}`;
        const startOfMonth = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1).toISOString();

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Lecture du Google Sheet du mois
        console.log(`📥 Lecture de l'onglet Google Sheet : ${nomOngletSheet}`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${nomOngletSheet}!A2:Z`, // On ignore la ligne 1 (en-têtes)
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return console.log("⚠️ Le fichier Excel est vide.");

        // 2. Lecture des visites dans Supabase
        console.log(`📥 Récupération des visites Supabase depuis le 1er du mois...`);
        const { data: visitesDb, error } = await supabase
            .from('dashboard_visites')
            .select('*')
            .gte('created_at', startOfMonth);

        if (error) throw error;

        let compteurMaj = 0;

        // 3. Croisement des données et mise à jour
        for (const row of rows) {
            const hubspot_id = row[1];
            const nom_magasin = row[3];

            // Dans ton Sheet, les bières vont de la colonne H (index 7) à V (index 21)
            let dn_gagne = 0;
            let dn_constate = 0;

            for (let i = 7; i <= 21; i++) {
                const val = row[i] ? row[i].trim() : "";
                if (val === 'Gagné') dn_gagne++;
                else if (val === 'Constaté') dn_constate++;
            }

            // S'il y a des points à récupérer
            if (dn_gagne > 0 || dn_constate > 0) {
                // On cherche la visite dans Supabase qui correspond à ce magasin
                const visiteCible = visitesDb.find(v => String(v.hubspot_id) === String(hubspot_id) && v.dn_gagne === 0 && v.dn_constate === 0);

                if (visiteCible) {
                    // On injecte les valeurs
                    await supabase
                        .from('dashboard_visites')
                        .update({ dn_gagne: dn_gagne, dn_constate: dn_constate })
                        .eq('id', visiteCible.id);

                    console.log(`✅ Rétabli : ${nom_magasin} -> +${dn_gagne} Gagnés / +${dn_constate} Constatés`);
                    
                    // On simule la mise à jour en mémoire pour ne pas traiter la même ligne en boucle
                    visiteCible.dn_gagne = dn_gagne; 
                    compteurMaj++;
                }
            }
        }

        console.log(`\n🎉 Mission accomplie ! ${compteurMaj} visites ont été restaurées dans le dashboard.`);

    } catch (err) {
        console.error("🚨 Erreur lors du rattrapage :", err);
    }
}

rattraperExcelVersSupabase();
