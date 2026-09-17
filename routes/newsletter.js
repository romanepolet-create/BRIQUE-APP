const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const OBJECTIFS_MOIS = {
    "arnaud.ladougne@briquehouse.fr": { nom: "Arnaud Ladougne", dn: 72, mea: 25, direct: 3 },
    "etienne.firmin@briquehouse.fr": { nom: "Etienne Firmin", dn: 33.5, mea: 11.5, direct: 1.4 },
    "romane.polet@briquehouse.fr": { nom: "Romane Polet", dn: 38.88, mea: 13.5, direct: 1.62 },
    "lorelei.duplat@briquehouse.fr": { nom: "Lorelei Duplat", dn: 10, mea: 2, direct: 0 }
};

const ENSEIGNES_DIRECTES = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U"];

function calculerScoreDNUnique(visites) {
    const mapMagasins = {};
    visites.forEach(v => {
        if (!mapMagasins[v.hubspot_id] || v.created_at > mapMagasins[v.hubspot_id].created_at) {
            mapMagasins[v.hubspot_id] = v;
        }
    });
    return Object.values(mapMagasins).reduce((total, v) => total + (parseInt(v.score_dn) || 0), 0);
}

// Quand quelqu'un visite l'URL, ce code s'exécute en direct !
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: visitesBrutes } = await supabase.from('dashboard_visites').select('*').limit(10000);
        const { data: listeMagasins } = await supabase.from('GMS').select('hubspot_id, nom, enseigne');

        const statsCommerciaux = [];
        let topMEA = [];
        let topDirects = [];

        for (const [email, obj] of Object.entries(OBJECTIFS_MOIS)) {
            const visMois = (visitesBrutes || []).filter(v => v.commercial_email === email && v.created_at >= startOfMonth);
            const visPrec = (visitesBrutes || []).filter(v => v.commercial_email === email && v.created_at < startOfMonth);
            const toutesVisitesEmail = (visitesBrutes || []).filter(v => v.commercial_email === email);

            const dnFinale = calculerScoreDNUnique(toutesVisitesEmail);
            const dnInitiale = calculerScoreDNUnique(visPrec);
            const actuelDN = dnFinale - dnInitiale;

            const actuelMEA = visMois.reduce((tot, v) => tot + (parseFloat(v.volume_mea) || 0), 0);
            
            visMois.filter(v => parseFloat(v.volume_mea) > 0).forEach(v => {
                const mag = listeMagasins.find(m => String(m.hubspot_id) === String(v.hubspot_id));
                topMEA.push({
                    commercial: obj.nom,
                    magasin: mag ? mag.nom : v.hubspot_id,
                    volume: parseFloat(v.volume_mea)
                });
            });

            let actuelDirect = 0;
            const magsDirects = [...new Set(visMois.filter(v => ENSEIGNES_DIRECTES.includes(v.enseigne)).map(v => v.hubspot_id))];
            magsDirects.forEach(idMag => {
                const dnF = calculerScoreDNUnique(toutesVisitesEmail.filter(v => v.hubspot_id === idMag));
                const dnI = calculerScoreDNUnique(visPrec.filter(v => v.hubspot_id === idMag));
                if (dnF - dnI > 0) {
                    actuelDirect++;
                    const mag = listeMagasins.find(m => String(m.hubspot_id) === String(idMag));
                    topDirects.push({
                        commercial: obj.nom,
                        enseigne: mag ? mag.enseigne : 'Direct',
                        magasin: mag ? mag.nom : idMag
                    });
                }
            });

            statsCommerciaux.push({
                nom: obj.nom,
                dn: { actuel: actuelDN, pct: obj.dn > 0 ? Math.round((actuelDN / obj.dn) * 100) : 'N/A' },
                mea: { actuel: actuelMEA.toFixed(1), pct: obj.mea > 0 ? Math.round((actuelMEA / obj.mea) * 100) : 'N/A' },
                direct: { actuel: actuelDirect, pct: obj.direct > 0 ? Math.round((actuelDirect / obj.direct) * 100) : 'N/A' }
            });
        }

        topMEA.sort((a, b) => b.volume - a.volume);

        const joursEcoules = now.getDate();
        const joursDansMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const pctMois = Math.round((joursEcoules / joursDansMois) * 100);
        const dateFr = now.toLocaleDateString('fr-FR');

        // Génération du HTML
        const html = `
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:22px; overflow:hidden; box-shadow:0 20px 45px -15px rgba(194,19,122,0.35); font-family:'Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif; color:#3a2233; text-align:left;">
          <div style="background:linear-gradient(120deg, #c2137a, #e6339c); color:#ffffff; padding:22px 24px 26px; position:relative;">
            <div style="font-size:11px; letter-spacing:.12em; opacity:.85; text-transform:uppercase; margin-bottom:10px;">🍻 PILOTAGE COMMERCIAL GMS</div>
            <h1 style="margin:0 0 4px; font-size:19px; letter-spacing:.03em; font-weight:700; color:#ffffff;">Newsletter GMS</h1>
            <p style="font-size:12.5px; opacity:.9; margin:0; color:#ffffff;">Suivi de l'activité et des objectifs de croissance nette</p>
            <p style="font-size:11.5px; opacity:.8; margin:6px 0 0; font-style:italic; color:#ffffff;">${dateFr} — Soit ${pctMois}% du mois écoulé</p>
          </div>

          <div style="padding:18px 24px 6px;">
            <p style="font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#c2137a; margin:0 0 10px;">● Les Perfs Générales</p>
            <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
              <thead>
                <tr>
                  <th style="text-align:left; color:#8c7385; font-weight:600; font-size:10.5px; text-transform:uppercase; padding:6px; border-bottom:1px solid #f1dde9;">Commercial</th>
                  <th style="text-align:center; color:#8c7385; font-weight:600; font-size:10.5px; text-transform:uppercase; padding:6px; border-bottom:1px solid #f1dde9;">DN Gagnées<br><span style="font-size:9px; text-transform:none;">(Net)</span></th>
                  <th style="text-align:center; color:#8c7385; font-weight:600; font-size:10.5px; text-transform:uppercase; padding:6px; border-bottom:1px solid #f1dde9;">Volumes MEA<br><span style="font-size:9px; text-transform:none;">(HL)</span></th>
                  <th style="text-align:center; color:#8c7385; font-weight:600; font-size:10.5px; text-transform:uppercase; padding:6px; border-bottom:1px solid #f1dde9;">Directs<br><span style="font-size:9px; text-transform:none;">(Vendeurs)</span></th>
                </tr>
              </thead>
              <tbody>
                ${statsCommerciaux.map((s, index) => {
                    const bg = index % 2 !== 0 ? 'background:#fdf3f9;' : '';
                    return `
                    <tr style="${bg}">
                      <td style="padding:12px 6px; border-bottom:1px solid #f6ecf2; text-align:left; font-weight:600;">${s.nom}</td>
                      <td style="padding:12px 6px; border-bottom:1px solid #f6ecf2; text-align:center;">
                        <div style="font-size:15px; font-weight:700; color:#3a2233;">${s.dn.actuel}</div>
                        <div style="font-size:10px; color:${s.dn.pct >= 100 ? '#1f9d5c' : (s.dn.pct === 'N/A' ? '#888' : '#d63a56')}; font-weight:600;">(${s.dn.pct}%)</div>
                      </td>
                      <td style="padding:12px 6px; border-bottom:1px solid #f6ecf2; text-align:center;">
                        <div style="font-size:15px; font-weight:700; color:#3a2233;">${s.mea.actuel}</div>
                        <div style="font-size:10px; color:${s.mea.pct >= 100 ? '#1f9d5c' : (s.mea.pct === 'N/A' ? '#888' : '#d63a56')}; font-weight:600;">(${s.mea.pct}%)</div>
                      </td>
                      <td style="padding:12px 6px; border-bottom:1px solid #f6ecf2; text-align:center;">
                        <div style="font-size:15px; font-weight:700; color:#3a2233;">${s.direct.actuel}</div>
                        <div style="font-size:10px; color:${s.direct.pct >= 100 ? '#1f9d5c' : (s.direct.pct === 'N/A' ? '#888' : '#d63a56')}; font-weight:600;">(${s.direct.pct}%)</div>
                      </td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="height:1px; background:#f1dde9; margin:12px 24px 0;"></div>

          <div style="padding:18px 24px 6px;">
            <p style="font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#c2137a; margin:0 0 10px;">● Mise en avant (HL)</p>
            <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
              ${topMEA.map(m => `
              <tr>
                <td style="padding:8px 6px; border-bottom:1px solid #f6ecf2; text-align:left; color:#8c7385; font-size:11.5px;">${m.commercial}</td>
                <td style="padding:8px 6px; border-bottom:1px solid #f6ecf2; text-align:left; font-weight:600;">${m.magasin}</td>
                <td style="padding:8px 6px; border-bottom:1px solid #f6ecf2; text-align:right;"><span style="color:#c2137a; font-weight:800; font-size:14px;">${m.volume}</span></td>
              </tr>`).join('')}
              ${topMEA.length === 0 ? '<tr><td colspan="3" style="color:#888; text-align:center; padding:10px;">Aucune MEA ce mois-ci.</td></tr>' : ''}
            </table>
          </div>

          <div style="height:1px; background:#f1dde9; margin:12px 24px 0;"></div>

          <div style="padding:18px 24px 22px;">
            <p style="font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#c2137a; margin:0 0 10px;">● Magasins Vendeurs en Direct</p>
            <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
              ${topDirects.map(d => `
              <tr>
                <td style="padding:8px 6px; border-bottom:1px solid #f6ecf2; text-align:left; color:#8c7385; font-size:11.5px;">${d.commercial}</td>
                <td style="padding:8px 6px; border-bottom:1px solid #f6ecf2; text-align:left;"><span style="display:inline-block; padding:3px 8px; border-radius:4px; font-weight:600; font-size:10px; background:#fdf3f9; color:#c2137a; text-transform:uppercase;">${d.enseigne}</span></td>
                <td style="padding:8px 6px; border-bottom:1px solid #f6ecf2; text-align:right; font-weight:600;">${d.magasin}</td>
              </tr>`).join('')}
              ${topDirects.length === 0 ? '<tr><td colspan="3" style="color:#888; text-align:center; padding:10px;">Aucun magasin direct ce mois-ci.</td></tr>' : ''}
            </table>
          </div>

          <div style="text-align:center; font-size:10.5px; color:#8c7385; padding:0 24px 20px;">
            Généré automatiquement par Brique App
          </div>
        </div>
        `;

        // On envoie le HTML directement au navigateur !
        res.send(html);

    } catch (err) {
        console.error("Erreur génération newsletter:", err);
        res.status(500).send("Erreur lors de la génération de la newsletter");
    }
});

module.exports = router;
