const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const ENSEIGNES_DIRECTES = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U", "MATCH", "LECLERC DRIVE", "U EXPRESS", "G 20", "AUTRES"];

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
function calculerScoreDNUnique(visites) {
    const mapMagasins = {};
    visites.forEach(v => {
        if (!mapMagasins[v.hubspot_id] || v.created_at > mapMagasins[v.hubspot_id].created_at) {
            mapMagasins[v.hubspot_id] = v;
        }
    });
    return Object.values(mapMagasins).reduce((total, v) => total + (parseInt(v.score_dn) || 0), 0);
}

function formatEmailToName(email) {
    if (!email) return "Inconnu";
    if (email.toLowerCase() === 'jeanmichel.dole@briquehouse.fr') return "J-M Dole";
    return email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

// ==========================================
// ROUTE PRINCIPALE NEWSLETTER
// ==========================================
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        // 1. Définir le mois actuel pour filtrer la table objectifs (ex: "2026-10")
        const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 2. Récupérer TOUTES les données en parallèle (Visites, Magasins, Objectifs)
        const [resVisites, resMagasins, resObjectifs] = await Promise.all([
            supabase.from('dashboard_visites').select('*').limit(10000),
            supabase.from('GMS').select('hubspot_id, nom, enseigne'),
            supabase.from('objectifs_mensuels').select('*').eq('mois', moisActuel)
        ]);

        const visitesBrutes = resVisites.data || [];
        const listeMagasins = resMagasins.data || [];
        const objectifsData = resObjectifs.data || [];

        // 3. Reconstruire dynamiquement l'objet OBJECTIFS_MOIS
        const OBJECTIFS_MOIS = {};
        objectifsData.forEach(row => {
            OBJECTIFS_MOIS[row.email] = {
                nom: formatEmailToName(row.email),
                dn: parseFloat(row.obj_dn) || 0,
                mea: parseFloat(row.obj_mea) || 0,
                direct: parseFloat(row.obj_direct) || 0
            };
        });

        const statsCommerciaux = [];
        let topMEA = [];
        let topDirects = [];

        // 4. Calcul des performances pour chaque commercial
        for (const [email, obj] of Object.entries(OBJECTIFS_MOIS)) {
            const visMois = visitesBrutes.filter(v => v.commercial_email === email && v.created_at >= startOfMonth);
            const visPrec = visitesBrutes.filter(v => v.commercial_email === email && v.created_at < startOfMonth);
            const toutesVisitesEmail = visitesBrutes.filter(v => v.commercial_email === email);

            // SCORÉES
            const dnFinale = calculerScoreDNUnique(toutesVisitesEmail);
            const dnInitiale = calculerScoreDNUnique(visPrec);
            const actuelDN = dnFinale - dnInitiale;

            // CONSTATÉES
            let dnConstate = 0;
            const magsMois = [...new Set(visMois.map(v => v.hubspot_id))];
            
            magsMois.forEach(idMag => {
                const maxConstate = Math.max(...visMois.filter(v => v.hubspot_id === idMag).map(v => parseInt(v.dn_constate) || 0));
                dnConstate += maxConstate;
            });

            // GAGNÉES
            let dnGagne = actuelDN - dnConstate;
            
            if (dnGagne < 0) {
                dnGagne = 0;
                dnConstate = actuelDN > 0 ? actuelDN : 0;
            }

            // MEA
            const actuelMEA = visMois.reduce((tot, v) => tot + (parseFloat(v.volume_mea) || 0), 0);
            
            visMois.filter(v => parseFloat(v.volume_mea) > 0).forEach(v => {
                const mag = listeMagasins.find(m => String(m.hubspot_id) === String(v.hubspot_id));
                topMEA.push({
                    commercial: obj.nom,
                    magasin: mag ? mag.nom : v.hubspot_id,
                    volume: parseFloat(v.volume_mea)
                });
            });

            // DIRECTS
            let actuelDirect = 0;
            const MagsDirects = [...new Set(toutesVisitesEmail.filter(v => ENSEIGNES_DIRECTES.includes(v.enseigne)).map(v => v.hubspot_id))];
            
            MagsDirects.forEach(idMag => {
                const dnF = calculerScoreDNUnique(toutesVisitesEmail.filter(v => v.hubspot_id === idMag));
                const dnI = calculerScoreDNUnique(visPrec.filter(v => v.hubspot_id === idMag));
                const aEteVisiteCeMois = visMois.some(v => v.hubspot_id === idMag);

                if (dnI === 0 && dnF > 0 && aEteVisiteCeMois) {
                    actuelDirect++;
                }

                if (dnF > 0) {
                    const mag = listeMagasins.find(m => String(m.hubspot_id) === String(idMag));
                    topDirects.push({
                        commercial: obj.nom,
                        enseigne: mag ? mag.enseigne : (visMois.find(v => v.hubspot_id === idMag).enseigne || "Direct"),
                        magasin: mag ? mag.nom : idMag
                    });
                }
            })
            
            if (email !== "leo.blanchet@briquehouse.fr") {
                statsCommerciaux.push({
                    nom: obj.nom,
                    dnGagne: dnGagne,
                    dnConstate: dnConstate,
                    dn: { actuel: actuelDN, pct: obj.dn > 0 ? Math.round((actuelDN / obj.dn) * 100) : 'N/A' },
                    mea: { actuel: actuelMEA.toFixed(1), pct: obj.mea > 0 ? Math.round((actuelMEA / obj.mea) * 100) : 'N/A' },
                    direct: { actuel: actuelDirect, pct: obj.direct > 0 ? Math.round((actuelDirect / obj.direct) * 100) : 'N/A' }
                });
            }
        }

        topMEA.sort((a, b) => b.volume - a.volume);

        const joursEcoules = now.getDate();
        const joursDansMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const pctMois = Math.round((joursEcoules / joursDansMois) * 100);
        const dateFr = now.toLocaleDateString('fr-FR');

        // ==========================================
        // CALCUL DES TOTAUX GLOBAUX
        // ==========================================
        let totalDnGagne = 0, totalDnConstate = 0, totalDnActuel = 0;
        let totalMeaActuel = 0, totalDirectActuel = 0;
        let objGlobalDN = 0, objGlobalMEA = 0, objGlobalDirect = 0;

        statsCommerciaux.forEach(s => {
            totalDnGagne += s.dnGagne;
            totalDnConstate += s.dnConstate;
            totalDnActuel += s.dn.actuel;
            totalMeaActuel += parseFloat(s.mea.actuel);
            totalDirectActuel += s.direct.actuel;
        });

        Object.entries(OBJECTIFS_MOIS).forEach(([email, obj]) => {
            if (email !== "leo.blanchet@briquehouse.fr") {
                objGlobalDN += obj.dn;
                objGlobalMEA += obj.mea;
                objGlobalDirect += obj.direct;
            }
        });

        const pctGlobalDN = objGlobalDN > 0 ? Math.round((totalDnActuel / objGlobalDN) * 100) : 'N/A';
        const pctGlobalMEA = objGlobalMEA > 0 ? Math.round((totalMeaActuel / objGlobalMEA) * 100) : 'N/A';
        const pctGlobalDirect = objGlobalDirect > 0 ? Math.round((totalDirectActuel / objGlobalDirect) * 100) : 'N/A';

        // ==========================================
        // GÉNÉRATION HTML
        // ==========================================
        const html = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 30px 0; font-family: 'Segoe UI', Arial, sans-serif;">
          <tr>
            <td align="center">
              
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5; color: #3a2233; text-align: left; border-collapse: collapse;">
                <tr>
                  <td>
                    
                    <!-- HEADER -->
                    <div style="background: linear-gradient(120deg, #e41b19, #f3b0cf); color: #ffffff; padding: 22px 24px 26px;">
                      <div style="font-size: 11px; letter-spacing: .12em; opacity: .85; text-transform: uppercase; margin-bottom: 10px;">🍻 PILOTAGE COMMERCIAL GMS</div>
                      <h1 style="margin: 0 0 4px; font-size: 19px; letter-spacing: .03em; font-weight: 700; color: #ffffff;">Newsletter GMS</h1>
                      <p style="font-size: 12.5px; opacity: .9; margin: 0; color: #ffffff;">Suivi de l'activité et des objectifs de croissance nette</p>
                      <p style="font-size: 11.5px; opacity: .8; margin: 6px 0 0; font-style: italic; color: #ffffff;">${dateFr} — Soit${pctMois}% du mois écoulé</p>
                    </div>

                    <!-- TABLE 1 : PERFS GENERALES -->
                    <div style="padding: 18px 24px 6px;">
                      <p style="font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #c2137a; margin: 0 0 10px;">● Les Perfs Générales</p>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <thead>
