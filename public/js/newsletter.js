const ENSEIGNES_DIRECTES = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U", "MATCH", "LECLERC DRIVE", "U EXPRESS", "G 20", "AUTRES"];

// ==========================================
// TOUTES LES FONCTIONS DE CALCUL (Côté Client)
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
// CUISINE
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/newsletter');
        const { visitesBrutes, listeMagasins, objectifsData } = await response.json();
        
        const inputPeriode = document.getElementById('filtre-periode');
        const moisParam = req.headers.referer ? new URLSearchParams(req.headers.referer.split('?')[1]).get('month') : null;
        const moisActuel = moisParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;;
        
        const [anneeStr, moisStr] = moisActuel.split('-');
        const annee = parseInt(anneeStr, 10);
        const mois = parseInt(moisStr, 10) - 1;
        
        const firstDayThisMonth = new Date(annee, mois, 1).toISOString();
        const lastDayThisMonth = new Date(annee, mois + 1, 0, 23, 59, 59).toISOString();

        let nomMois = new Date(annee, mois, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        nomMois = nomMois.charAt(0).toUpperCase() + nomMois.slice(1);

        const now = new Date();
        const joursDansMois = new Date(annee, mois + 1, 0).getDate();
        let joursEcoules = 0;

        if (annee === now.getFullYear() && mois === now.getMonth()) {
            joursEcoules = now.getDate();
        } else if (new Date(annee, mois, 1) < now) {
            joursEcoules = joursDansMois;
        }
        
        const pctMois = Math.round((joursEcoules / joursDansMois) * 100);

        document.getElementById('date-subtitle').innerText = `Bilan ${nomMois} — Soit ${pctMois}% du mois écoulé`;

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

        for (const [email, obj] of Object.entries(OBJECTIFS_MOIS)) {
            const toutesVisitesEmail = visitesBrutes.filter(v => v.commercial_email === email && v.created_at <= lastDayThisMonth);
            const visMois = toutesVisitesEmail.filter(v => v.created_at >= firstDayThisMonth);
            const visPrec = toutesVisitesEmail.filter(v => v.created_at < firstDayThisMonth);

            const dnFinale = calculerScoreDNUnique(toutesVisitesEmail);
            const dnInitiale = calculerScoreDNUnique(visPrec);
            const actuelDN = dnFinale - dnInitiale;

            let dnConstate = 0;
            const magsMois = [...new Set(visMois.map(v => v.hubspot_id))];
            
            magsMois.forEach(idMag => {
                const maxConstate = Math.max(...visMois.filter(v => v.hubspot_id === idMag).map(v => parseInt(v.dn_constate) || 0));
                dnConstate += maxConstate;
            });

            let dnGagne = actuelDN - dnConstate;
            if (dnGagne < 0) {
                dnGagne = 0;
                dnConstate = actuelDN > 0 ? actuelDN : 0;
            }

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
            });
            
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
        // DOM - FRONT
        // ==========================================
        
        document.getElementById('tbody-perfs').innerHTML = statsCommerciaux.map((s, index) => {
            const bg = index % 2 !== 0 ? 'background-color: #fafafa;' : '';
            const dnBg = index % 2 !== 0 ? 'background-color: #fdf3f9;' : 'background-color: #fff9fc;'; 
            const checkboxOutil = ["Romane Polet", "Lorelei Duplat"].includes(s.nom) ? '☑️' : '◻️';
            
            return `
            <tr style="${bg}">
              <td style="padding: 10px 4px; border-bottom: 1px solid #f6ecf2; text-align: left; font-weight: 600; font-size: 11px;">${s.nom}</td>
              <td style="padding: 10px 4px; border-bottom: 1px solid #f6ecf2; text-align: center; color: #1f9d5c; font-size: 14px; font-weight: 700; ${dnBg}">${s.dnGagne}</td>
              <td style="padding: 10px 4px; border-bottom: 1px solid #f6ecf2; text-align: center; color: #b8862c; font-size: 14px; font-weight: 700; ${dnBg}">${s.dnConstate}</td>
              <td style="padding: 10px 4px; border-bottom: 1px solid #f6ecf2; text-align: center; ${dnBg}">
                <div style="font-size: 14px; font-weight: 700; color: #3a2233;">${s.dn.actuel}</div>
                <div style="font-size: 9px; color: ${s.dn.pct >= 100 ? '#1f9d5c' : (s.dn.pct === 'N/A' ? '#888' : '#d63a56')}; font-weight: 600;">(${s.dn.pct}%)</div>
              </td>
              <td style="padding: 10px 4px; border-bottom: 1px solid #f6ecf2; text-align: center;">
                <div style="font-size: 14px; font-weight: 700; color: #3a2233;">${s.mea.actuel}</div>
                <div style="font-size: 9px; color: ${s.mea.pct >= 100 ? '#1f9d5c' : (s.mea.pct === 'N/A' ? '#888' : '#d63a56')}; font-weight: 600;">(${s.mea.pct}%)</div>
              </td>
              <td style="padding: 10px 4px; border-bottom: 1px solid #f6ecf2; text-align: center;">
                <div style="font-size: 14px; font-weight: 700; color: #3a2233;">${s.direct.actuel}</div>
                <div style="font-size: 9px; color: ${s.direct.pct >= 100 ? '#1f9d5c' : (s.direct.pct === 'N/A' ? '#888' : '#d63a56')}; font-weight: 600;">(${s.direct.pct}%)</div>
              </td>
              <td style="padding: 10px 4px; border-bottom: 1px solid #f6ecf2; text-align: center; font-size: 16px;">${checkboxOutil}</td>
            </tr>`;
        }).join('');

        document.getElementById('tot-gagne').innerText = totalDnGagne;
        document.getElementById('tot-constate').innerText = totalDnConstate;
        
        document.getElementById('tot-dn-actuel').innerText = totalDnActuel;
        document.getElementById('tot-dn-pct').innerText = `(${pctGlobalDN}%)`;
        document.getElementById('tot-dn-pct').style.color = pctGlobalDN >= 100 ? '#1f9d5c' : (pctGlobalDN === 'N/A' ? '#888' : '#d63a56');

        document.getElementById('tot-mea-actuel').innerText = totalMeaActuel.toFixed(1);
        document.getElementById('tot-mea-pct').innerText = `(${pctGlobalMEA}%)`;
        document.getElementById('tot-mea-pct').style.color = pctGlobalMEA >= 100 ? '#1f9d5c' : (pctGlobalMEA === 'N/A' ? '#888' : '#d63a56');

        document.getElementById('tot-direct-actuel').innerText = totalDirectActuel;
        document.getElementById('tot-direct-pct').innerText = `(${pctGlobalDirect}%)`;
        document.getElementById('tot-direct-pct').style.color = pctGlobalDirect >= 100 ? '#1f9d5c' : (pctGlobalDirect === 'N/A' ? '#888' : '#d63a56');

        const meaHtml = topMEA.length > 0 
            ? topMEA.map(m => `
                <tr>
                  <td style="padding: 8px 6px; border-bottom: 1px solid #f6ecf2; text-align: left; color: #8c7385; font-size: 11.5px;">${m.commercial}</td>
                  <td style="padding: 8px 6px; border-bottom: 1px solid #f6ecf2; text-align: left; font-weight: 600;">${m.magasin}</td>
                  <td style="padding: 8px 6px; border-bottom: 1px solid #f6ecf2; text-align: right;"><span style="color: #c2137a; font-weight: 800; font-size: 14px;">${m.volume}</span></td>
                </tr>`).join('')
            : '<tr><td colspan="3" style="color: #888; text-align: center; padding: 10px;">Aucune MEA ce mois-ci.</td></tr>';
        document.getElementById('tbody-mea').innerHTML = meaHtml;

        const directsHtml = topDirects.length > 0
            ? topDirects.map(d => `
                <tr>
                  <td style="padding: 8px 6px; border-bottom: 1px solid #f6ecf2; text-align: left; color: #8c7385; font-size: 11.5px;">${d.commercial}</td>
                  <td style="padding: 8px 6px; border-bottom: 1px solid #f6ecf2; text-align: left;"><span style="background-color: #fdf3f9; color: #c2137a; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase;">${d.enseigne}</span></td>
                  <td style="padding: 8px 6px; border-bottom: 1px solid #f6ecf2; text-align: right; font-weight: 600;">${d.magasin}</td>
                </tr>`).join('')
            : '<tr><td colspan="3" style="color: #888; text-align: center; padding: 10px;">Aucun magasin direct ce mois-ci.</td></tr>';
        document.getElementById('tbody-directs').innerHTML = directsHtml;

    } catch (error) {
        console.error("Erreur de calcul ou de fetch :", error);
        document.getElementById('tbody-perfs').innerHTML = '<tr><td colspan="7" style="color:red; text-align:center;">Erreur lors du calcul.</td></tr>';
    }

    document.getElementById('copy-btn').addEventListener('click', () => {
        const container = document.getElementById('email-container');
        const range = document.createRange();
        range.selectNode(container);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        try {
            document.execCommand('copy');
            alert('Newsletter copiée avec succès ! (Ctrl+V dans la boite mail)');
        } catch (err) {
            alert('Erreur lors de la copie.');
        }
        window.getSelection().removeAllRanges();
    });
});


document.getElementById('filtre-periode').addEventListener('change', () => {
    const mois = document.getElementById('filtre-periode').value;
    if (mois) {
        const url = new URL(window.location);
        url.searchParams.set('month', mois);
        window.history.pushState({}, '', url);
        window.location.reload();
    }
});

const urlParams = new URLSearchParams(window.location.search);
if(urlParams.has('month')) {
    document.getElementById('filtre-periode').value = urlParams.get('month');
}
