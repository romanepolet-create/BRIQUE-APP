let listeInitialeChargee = false;
let graphVisites = null;
let donneesGlobales = null;
let graphFlopDN = null;
const MAX_DN_ENSEIGNE = {
    "AUCHAN HM": 7,
    "AUCHAN SM": 0,
    "CASINO": 4,
    "FRANPRIX": 2,
    "MONOPRIX": 4,
    "CRF HYPER": 7,
    "CRF MARKET": 7,
    "CRF PROXI": 0,
    "OTERA": 4,
    "ITM PROXI": 0,
    "ITM SM": 0,
    "LECLERC": 0,
    "LECLERC PROXI": 0,
    "SUPER U": 0,
    "U EXPRESS": 0,
    "MATCH": 0,
    "G 20": 0,
    "LECLERC DRIVE": 0
};

const OBJECTIFS_PRIO = {
    "A": 0.95,
    "B": 0.90,
    "C": 0.85,
    "D": 0.65,
    "E": 0.42,
    "F": 0.30,
    "URB": 0.20,
    "X": 0.10,
    "DRIVE": 0.00
};

// ==========================================
// MATHS
// ==========================================
function formatEmailToName(email) {
    if (!email || email === 'general') return "Général";
    return email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

// DN TOTAL
function calculerScoreDNUnique(visites) {
    const mapMagasins = {};
    visites.forEach(v => {
        if (!mapMagasins[v.hubspot_id] || v.created_at > mapMagasins[v.hubspot_id].created_at) {
            mapMagasins[v.hubspot_id] = v;
        }
    });
    return Object.values(mapMagasins).reduce((total, v) => total + (parseInt(v.score_dn) || 0), 0);
}

// ==========================================
// API
// ==========================================
async function chargerDonneesEtAfficher(filtreEmail = 'general') {
    try {
        if (!donneesGlobales) {
            const reponse = await fetch('/api/dashboard/data'); 
            donneesGlobales = await reponse.json();
            if (!donneesGlobales.success) throw new Error("Erreur serveur");
            
            initialiserMenuDeroulant(donneesGlobales, filtreEmail);
        }

        const { visitesBrutes, objectifs } = donneesGlobales;

        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        let visitesFiltrees = visitesBrutes;
        let magasinsFiltres = donneesGlobales.listeMagasins || [];

        magasinsFiltres = magasinsFiltres.filter(m => m.Propriétaire !== "Vacant" && m.Propriétaire !== "Vacant Nord");

        if (filtreEmail !== 'general') {
            visitesFiltrees = visitesBrutes.filter(v => v.commercial_email === filtreEmail);
            
            const nomCommercialFormate = formatEmailToName(filtreEmail).toLowerCase();
            
            magasinsFiltres = magasinsFiltres.filter(m => {
                const proprietaire = (m.Propriétaire || "").toLowerCase();
                return proprietaire === nomCommercialFormate;
            });
        }

        const visitesMois = visitesFiltrees.filter(v => v.created_at >= firstDayThisMonth);
        const visitesPrec = visitesFiltrees.filter(v => v.created_at < firstDayThisMonth);

        // ==========================================
        // KPIs
        // ==========================================
        document.getElementById('titre-commercial').textContent = `Résumé de l'activité : ${formatEmailToName(filtreEmail)}`;
        
        document.getElementById('kpi-visites').textContent = visitesMois.length;
        
        const dnInitiale = calculerScoreDNUnique(visitesPrec);
        const dnFinale = calculerScoreDNUnique(visitesMois);
        const dnGagnee = dnFinale - dnInitiale;
        document.getElementById('kpi-dn').textContent = dnGagnee >= 0 ? `+${dnGagnee}` : dnGagnee;
        document.getElementById('evo-dn').textContent = `Base : ${dnInitiale} ➔ ${dnFinale}`;

        const meaHl = visitesMois.reduce((tot, v) => tot + (parseFloat(v.volume_mea) || 0), 0);
        document.getElementById('kpi-mea').textContent = parseFloat(meaHl.toFixed(2)) + ' HL';

        const enseignesDirectes = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U"];
        const nbDirects = new Set(visitesMois.filter(v => enseignesDirectes.includes(v.enseigne)).map(v => v.hubspot_id)).size;
        document.getElementById('kpi-directs').textContent = nbDirects;

        // ==========================================
        // GENERATION
        // ==========================================
        genererTableauPerformance(donneesGlobales.visitesBrutes, objectifs, firstDayThisMonth);
        genererFocusDN(magasinsFiltres, visitesFiltrees);
        genererFocusMEA(visitesFiltrees);
        genererFocusDirect(magasinsFiltres, visitesFiltrees);
        genererProductivite(visitesBrutes);

    } catch (err) {
        console.error("Erreur Dashboard:", err);
    }
}

// ==========================================
//OBJECTIFS SELON PRIO
// ==========================================

function calculerObjectifDNDynamique(emailCommercial, listeMagasins) {
    const nomCommercial = formatEmailToName(emailCommercial).toLowerCase();
    
    const parcCommercial = listeMagasins.filter(m => 
        (m.Propriétaire || "").toLowerCase() === nomCommercial
    );

    let objectifTotal = 0;
    
    parcCommercial.forEach(mag => {
        const maxObligatoire = MAX_DN_ENSEIGNE[mag.enseigne] || 0;
        const pourcentageObjectif = OBJECTIFS_PRIO[mag.Priorité] || 0; 
        
        objectifTotal += (maxObligatoire * pourcentageObjectif);
    });

    return Math.round(objectifTotal);
}

// ==========================================
// GESTION & AFFICHAGE
// ==========================================
let vuePourcentage = true;

function genererTableauPerformance(toutesVisites, objectifs, startOfMonth) {
    const tbody = document.getElementById('tbody-performance');
    if (!tbody) return;

    tbody.innerHTML = '';
    const commerciauxMails = [...new Set(toutesVisites.map(v => v.commercial_email))];
    const enseignesDirectes = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U"];

    commerciauxMails.forEach(email => {
        const visMois = toutesVisites.filter(v => v.commercial_email === email && v.created_at >= startOfMonth);
        const visPrec = toutesVisites.filter(v => v.commercial_email === email && v.created_at < startOfMonth);
        
        const actuelDN = calculerScoreDNUnique(visMois) - calculerScoreDNUnique(visPrec);
        const actuelMEA = visMois.reduce((tot, v) => tot + (parseFloat(v.volume_mea) || 0), 0);
        
        let actuelDirect = 0;
        const magsDirects = [...new Set(visMois.filter(v => enseignesDirectes.includes(v.enseigne)).map(v => v.hubspot_id))];
        magsDirects.forEach(idMag => {
            const dnFin = calculerScoreDNUnique(visMois.filter(v => v.hubspot_id === idMag));
            const dnInit = calculerScoreDNUnique(visPrec.filter(v => v.hubspot_id === idMag));
            if (dnFin - dnInit > 0) actuelDirect++;
        });

        const obj = objectifs.find(o => o.commercial_email === email) || {};

        const rendreCell = (actuel, objectif, unit = "") => {
            if (!objectif) return `<span style="color:#999; font-size:12px;">Non défini</span><br><b>${actuel}</b>`;
            if (vuePourcentage) {
                const pct = Math.round((actuel / objectif) * 100);
                const col = pct >= 100 ? 'green' : (pct > 50 ? 'orange' : 'red');
                return `<b style="color:${col};">${pct}%</b><br><span style="font-size:12px; color:#666;">(Obj: ${objectif})</span>`;
            } else {
                const reste = objectif - actuel;
                return `<b>${reste <= 0 ? '✅ Atteint' : reste + ' ' + unit}</b><br><span style="font-size:12px; color:#666;">(Actuel: ${actuel})</span>`;
            }
        };

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding: 12px; text-align: left;"><b>${formatEmailToName(email)}</b></td>
            <td style="padding: 12px;">${rendreCell(actuelDN, obj.obj_dn)}</td>
            <td style="padding: 12px;">${rendreCell(actuelMEA, obj.obj_mea, "HL")}</td>
            <td style="padding: 12px;">${rendreCell(actuelDirect, obj.obj_direct, "Mag.")}</td>
        `;
        tbody.appendChild(tr);
    });

    const btnBascule = document.getElementById('btn-bascule-perf');
    if (btnBascule) {
        const newBtn = btnBascule.cloneNode(true);
        btnBascule.parentNode.replaceChild(newBtn, btnBascule);
        newBtn.addEventListener('click', () => {
            vuePourcentage = !vuePourcentage;
            newBtn.textContent = vuePourcentage ? "🔄 Voir le Reste à faire" : "🔄 Voir les Pourcentages";
            genererTableauPerformance(toutesVisites, objectifs, startOfMonth); // On redessine juste le tableau !
        });
    }
}

function initialiserMenuDeroulant(data, defaultFiltre) {
    if (listeInitialeChargee) return;
    const selectFiltre = document.getElementById('filtre-commercial');
    if (!selectFiltre) return;

    selectFiltre.innerHTML = '<option value="general">🌍 Général (Tous)</option>';
    if (data.isAdmin) {
        data.listeCommerciaux.forEach(email => {
            selectFiltre.add(new Option(`👤 ${formatEmailToName(email)}`, email));
        });
    } else {
        selectFiltre.add(new Option(`👤 Mon activité`, data.emailConnecte));
        defaultFiltre = data.emailConnecte; // Force sur le commercial
    }
    
    selectFiltre.value = defaultFiltre;
    selectFiltre.addEventListener('change', (e) => chargerDonneesEtAfficher(e.target.value));
    listeInitialeChargee = true;
}




// ==========================================
// FOCUS DN
// ==========================================
function genererFocusDN(magasins, visites) {
    const dernieresVisites = {};
    visites.forEach(v => {
        if (!dernieresVisites[v.hubspot_id] || v.created_at > dernieresVisites[v.hubspot_id].created_at) {
            dernieresVisites[v.hubspot_id] = v;
        }
    });

    let opportunites = magasins.map(mag => {
        const maxPossible = MAX_DN_ENSEIGNE[mag.enseigne] ?? 15;
        
        const visiteMag = dernieresVisites[mag.hubspot_id];
        const dnActuelle = visiteMag ? (parseInt(visiteMag.score_dn) || 0) : 0;
        
        return {
            hubspot_id: mag.hubspot_id,
            nom_magasin: mag.nom,
            enseigne: mag.enseigne,
            dnManquante: maxPossible - dnActuelle,
            maxPossible: maxPossible
        };
    });

    const selectEnseigne = document.getElementById('filtre-enseigne');
    const enseignesUniques = [...new Set(opportunites.map(o => o.enseigne))].filter(Boolean).sort();
    
    const valeurActuelle = selectEnseigne.value;
    selectEnseigne.innerHTML = '<option value="toutes">🏪 Toutes les enseignes</option>';
    enseignesUniques.forEach(ens => selectEnseigne.add(new Option(ens, ens)));
    if (enseignesUniques.includes(valeurActuelle)) selectEnseigne.value = valeurActuelle;

    if (selectEnseigne.value !== 'toutes') {
        opportunites = opportunites.filter(o => o.enseigne === selectEnseigne.value);
    }

    opportunites = opportunites.filter(o => o.dnManquante > 0);

    opportunites.sort((a, b) => b.dnManquante - a.dnManquante);

    const tbody = document.getElementById('tbody-ranking-dn');
    tbody.innerHTML = '';
    if (opportunites.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 15px;">Aucun flop détecté 🎉</td></tr>';
    } else {
        opportunites.forEach(opp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><b>${opp.nom_magasin || opp.hubspot_id}</b></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; color: #666;">${opp.enseigne}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;"><b style="color: #dc3545;">${opp.dnManquante}</b> <span style="font-size:10px; color:#999;">/ ${opp.maxPossible}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    const top10 = opportunites.slice(0, 10);
    const labels = top10.map(o => (o.nom_magasin || o.hubspot_id).substring(0, 20) + '...');
    const dataFlops = top10.map(o => o.dnManquante);

    const ctx = document.getElementById('chartFlopDN').getContext('2d');
    if (graphFlopDN) graphFlopDN.destroy(); 
    
    graphFlopDN = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'DN à gagner (Flop)',
                data: dataFlops,
                backgroundColor: '#dc3545',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: { x: { beginAtZero: true, suggestedMax: 15 } }
        }
    });

    selectEnseigne.onchange = () => genererFocusDN(magasins, visites);
}

document.addEventListener("DOMContentLoaded", () => chargerDonneesEtAfficher('general'));




// ==========================================
// FOCUS MEA
// ==========================================
function genererFocusMEA(visites) {
    const tbody = document.getElementById('tbody-focus-mea');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    let visitesMEA = visites.filter(v => v.created_at >= firstDayThisMonth && (parseFloat(v.volume_mea) > 0));

    visitesMEA.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (visitesMEA.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #666;">Aucune MEA réalisée ce mois-ci.</td></tr>';
        return;
    }

    visitesMEA.forEach(v => {
        const dateFormatee = new Date(v.created_at).toLocaleDateString('fr-FR');
        
        const magInfo = donneesGlobales.listeMagasins.find(m => m.hubspot_id === v.hubspot_id);
        const nomMagasin = magInfo ? magInfo.nom : v.hubspot_id;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; color: #888;">#${v.id || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${dateFormatee}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <b>${nomMagasin}</b><br>
                <span style="font-size: 11px; color: #999;">${v.enseigne}</span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                <b style="color: #002ab6; font-size: 16px;">${v.volume_mea}</b> <span style="color: #666; font-size: 12px;">HL</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}




// ==========================================
// FOCUS DIRECT
// ==========================================
function genererFocusDirect(magasins, visites) {
    const enseignesDirectes = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U"];
    
    let parcDirect = magasins.filter(m => enseignesDirectes.includes(m.enseigne));

    const dernieresVisites = {};
    visites.forEach(v => {
        if (!dernieresVisites[v.hubspot_id] || v.created_at > dernieresVisites[v.hubspot_id].created_at) {
            dernieresVisites[v.hubspot_id] = v;
        }
    });

    let listeDirect = parcDirect.map(mag => {
        const visite = dernieresVisites[mag.hubspot_id];
        const dnActuelle = visite ? (parseInt(visite.score_dn) || 0) : 0;
        return {
            ...mag,
            vendeur: dnActuelle > 0,
            priorite: mag.Priorité || "Non def."
        };
    });

    const selectEnseigne = document.getElementById('filtre-enseigne-direct');
    const selectPrio = document.getElementById('filtre-prio-direct');
    
    const enseignesUniques = [...new Set(listeDirect.map(m => m.enseigne))].filter(Boolean).sort();
    const priosUniques = [...new Set(listeDirect.map(m => m.priorite))].filter(Boolean).sort();

    if (selectEnseigne.options.length === 1) {
        enseignesUniques.forEach(ens => selectEnseigne.add(new Option(ens, ens)));
    }
    if (selectPrio.options.length === 1) {
        priosUniques.forEach(prio => selectPrio.add(new Option(`Prio: ${prio}`, prio)));
    }

    if (selectEnseigne.value !== 'toutes') listeDirect = listeDirect.filter(m => m.enseigne === selectEnseigne.value);
    if (selectPrio.value !== 'toutes') listeDirect = listeDirect.filter(m => m.priorite === selectPrio.value);

    listeDirect.sort((a, b) => a.vendeur - b.vendeur);

    const tbody = document.getElementById('tbody-focus-direct');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (listeDirect.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 15px;">Aucun magasin direct trouvé.</td></tr>';
        return;
    }

    listeDirect.forEach(mag => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #eee;"><b>${mag.nom || mag.hubspot_id}</b></td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px;">${mag.enseigne}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px;">${mag.priorite}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                ${mag.vendeur 
                    ? '<span style="background: #28a745; color: white; padding: 3px 8px; border-radius: 10px; font-size: 11px;">✅ Vendeur</span>' 
                    : '<span style="background: #dc3545; color: white; padding: 3px 8px; border-radius: 10px; font-size: 11px;">❌ Non Vendeur</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });

    selectEnseigne.onchange = () => genererFocusDirect(magasins, visites);
    selectPrio.onchange = () => genererFocusDirect(magasins, visites);
}

// ==========================================
// PRODUCTIVITÉ
// ==========================================
function genererProductivite(toutesVisites) {
    const tbody = document.getElementById('tbody-productivite');
    if (!tbody) return;
    
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const visitesMois = toutesVisites.filter(v => v.created_at >= firstDayThisMonth);

    const statsCommerciaux = {};
    
    visitesMois.forEach(v => {
        const email = v.commercial_email || "Inconnu";
        
        if (!statsCommerciaux[email]) {
            statsCommerciaux[email] = { totalVisites: 0, joursUniques: new Set() };
        }
        
        statsCommerciaux[email].totalVisites++;
        
        const dateJour = v.created_at.split('T')[0];
        statsCommerciaux[email].joursUniques.add(dateJour);
    });

    tbody.innerHTML = '';
    if (Object.keys(statsCommerciaux).length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 15px; color:#666;">Aucune visite enregistrée ce mois-ci.</td></tr>';
        return;
    }

    Object.entries(statsCommerciaux).forEach(([email, data]) => {
        const nbJours = data.joursUniques.size;
        const moyenne = nbJours > 0 ? (data.totalVisites / nbJours).toFixed(1) : 0;
        
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding: 12px; text-align: left;"><b>${formatEmailToName(email)}</b></td>
            <td style="padding: 12px;">${data.totalVisites}</td>
            <td style="padding: 12px;">
                <b style="color: #002ab6; font-size: 15px;">${moyenne}</b> vis. / jour<br>
                <span style="font-size: 11px; color: #888;">(calculé sur ${nbJours} jours travaillés)</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
