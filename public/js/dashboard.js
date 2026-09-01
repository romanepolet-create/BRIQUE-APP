let listeInitialeChargee = false;
let graphVisites = null;
let donneesGlobales = null;

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
        if (filtreEmail !== 'general') {
            visitesFiltrees = visitesBrutes.filter(v => v.commercial_email === filtreEmail);
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
        // TABLEAU PERF GLOBAL
        // ==========================================
        genererTableauPerformance(donneesGlobales.visitesBrutes, objectifs, firstDayThisMonth);

    } catch (err) {
        console.error("Erreur Dashboard:", err);
    }
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

document.addEventListener("DOMContentLoaded", () => chargerDonneesEtAfficher('general'));
