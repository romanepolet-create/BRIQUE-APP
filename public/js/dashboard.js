let listeInitialeChargee = false;
let graphVisites = null;
let donneesGlobales = null;
let graphFlopDN = null;

// NOUVEAU : Variables pour Supabase et Objectifs dynamiques
let supabaseClient = null;
let objectifsDynamiques = {}; 

const ENSEIGNES_DIRECTES_GLOBALES = ["ITM PROXI", "ITM SM", "LECLERC", "LECLERC PROXI", "SUPER U", "G 20", "G20", "AUTRES", "LECLERC DRIVE", "MATCH", "U EXPRESS", "AUTRES"];
const MAX_DN_ENSEIGNE = {
    "AUCHAN HM": 7, "AUCHAN SM": 0, "CASINO": 4, "FRANPRIX": 2, "MONOPRIX": 4,
    "CRF HYPER": 7, "CRF MARKET": 7, "CRF PROXI": 7, "OTERA": 4, "ITM PROXI": 0,
    "ITM SM": 0, "LECLERC": 0, "LECLERC PROXI": 0, "SUPER U": 0, "U EXPRESS": 0,
    "MATCH": 0, "G 20": 0, "LECLERC DRIVE": 0, "NICOLAS": 4, "AUTRES": 0
};

const OBJECTIFS_PRIO = {
    "A": 0.95, "B": 0.90, "C": 0.85, "D": 0.65, "E": 0.42, "F": 0.30, "X": 0.10, "DRIVE": 0.00
};

// ==========================================
// INITIALISATION SUPABASE
// ==========================================
async function getSupabase() {
    if (!supabaseClient) {
        const reponse = await fetch('/api/config');
        const config = await reponse.json();
        supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    }
    return supabaseClient;
}

// ==========================================
// MATHS
// ==========================================
function formatEmailToName(email) {
    if (!email || email === 'general') return "Général";
    if (email.toLowerCase() === 'jeanmichel.dole@briquehouse.fr') return "J-M Dole";
    return email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

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
async function chargerDonneesEtAfficher(filtreEmail = 'general', forceRefresh = false) {
    try {
        const inputPeriode = document.getElementById('filtre-periode');
        const moisActuel = inputPeriode && inputPeriode.value ? inputPeriode.value : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        
        const [anneeStr, moisStr] = moisActuel.split('-');
        const annee = parseInt(anneeStr, 10);
        const mois = parseInt(moisStr, 10) - 1;
        
        const firstDayThisMonth = new Date(annee, mois, 1).toISOString();
        const lastDayThisMonth = new Date(annee, mois + 1, 0, 23, 59, 59).toISOString();

        let nomMois = new Date(annee, mois, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        nomMois = nomMois.charAt(0).toUpperCase() + nomMois.slice(1);

        if (forceRefresh) objectifsDynamiques = {};

        // 1. On charge les objectifs dynamiques du mois EN PREMIER
        if (Object.keys(objectifsDynamiques).length === 0) {
            const supa = await getSupabase();
            const { data: objData } = await supa.from('objectifs_mensuels').select('*').eq('mois', moisActuel);
            if (objData) {
                objData.forEach(row => {
                    objectifsDynamiques[row.email.toLowerCase()] = {
                        obj_dn: parseFloat(row.obj_dn),
                        obj_mea: parseFloat(row.obj_mea),
                        obj_direct: parseFloat(row.obj_direct)
                    };
                });
            }
        }

        if (!donneesGlobales) {
            const reponse = await fetch(`/api/dashboard/data?nocache=${new Date().getTime()}`); 
            donneesGlobales = await reponse.json();
            if (!donneesGlobales.success) throw new Error("Erreur serveur");
            
            initialiserMenuDeroulant(donneesGlobales, filtreEmail);
        }

        const { visitesBrutes } = donneesGlobales;
        
        let visitesFiltrees = visitesBrutes;
        let magasinsFiltres = donneesGlobales.listeMagasins || [];

        magasinsFiltres = magasinsFiltres.filter(m => m.Propriétaire !== "Vacant" && m.Propriétaire !== "Vacant Nord");

        if (filtreEmail !== 'general') {
            visitesFiltrees = visitesBrutes.filter(v => v.commercial_email === filtreEmail);
            const nomCommercialFormate = formatEmailToName(filtreEmail).toLowerCase();
            magasinsFiltres = magasinsFiltres.filter(m => (m.Propriétaire || "").toLowerCase() === nomCommercialFormate);
        }

        const visitesMois = visitesFiltrees.filter(v => v.created_at >= firstDayThisMonth && v.created_at <= lastDayThisMonth);
        const visitesPrec = visitesFiltrees.filter(v => v.created_at < firstDayThisMonth);
        const visitesFiltreesJusquaFin = visitesFiltrees.filter(v => v.created_at <= lastDayThisMonth);
        const av8h30 = visitesMois.filter(v => {
            const d = new Date(v.created_at);
            return d.getHours() < 7 || (d.getHours() === 7 && d.getMinutes() < 30);
        });

        document.getElementById('titre-commercial').textContent = `Résumé de l'activité : ${formatEmailToName(filtreEmail)}`;
        
        if(document.getElementById('titre-perf-generale')) {
            const btnHtml = document.getElementById('titre-perf-generale').innerHTML.split('<button')[1] ? '<button' + document.getElementById('titre-perf-generale').innerHTML.split('<button')[1] : '';
            document.getElementById('titre-perf-generale').innerHTML = `Performance Générale (${nomMois}) \n ${btnHtml}`;
        }
        if(document.getElementById('titre-focus-dn')) document.getElementById('titre-focus-dn').textContent = `🎯 Focus DN : Top Opportunités (${nomMois})`;
        if(document.getElementById('titre-focus-mea')) document.getElementById('titre-focus-mea').textContent = `🍺 Focus MEA : Détail des réalisations (${nomMois})`;
        if(document.getElementById('titre-focus-direct')) document.getElementById('titre-focus-direct').textContent = `🏪 Focus Direct (${nomMois})`;
        if(document.getElementById('titre-productivite')) document.getElementById('titre-productivite').textContent = `⏱️ Productivité (${nomMois})`;
        if(document.getElementById('titre-fond-rayon')) document.getElementById('titre-fond-rayon').textContent = `🛒 Fond de Rayon (${nomMois})`;
        
        if(document.getElementById('detail-visites-titre')) document.getElementById('detail-visites-titre').textContent = `📍 Détail des Visites (${nomMois})`;
        if(document.getElementById('detail-DN-titre')) document.getElementById('detail-DN-titre').textContent = `📊 Détail des DN (${nomMois})`;
        if(document.getElementById('detail-directs-titre')) document.getElementById('detail-directs-titre').textContent = `📦 Détail des Directs (${nomMois})`;

        // ==========================================
        // KPIs
        // ==========================================
        document.getElementById('kpi-visites').textContent = visitesMois.length;
        document.getElementById('visiteAvOpen').textContent = av8h30.length;

        const kpiVisitesElement = document.getElementById('kpi-visites');
        const carteVisites = kpiVisitesElement.parentNode;
        const visiteAvOpen = document.getElementById('visiteAvOpen');

        carteVisites.style.cursor = 'pointer';
        carteVisites.style.transition = '0.2s';
        carteVisites.onmouseover = () => carteVisites.style.transform = 'translateY(-2px)';
        carteVisites.onmouseout = () => carteVisites.style.transform = 'translateY(0)';

        if (!document.getElementById('visites-click-hint')) {
            const hint = document.createElement('div');
            hint.id = 'visites-click-hint';
            hint.innerHTML = '<i>👆 Cliquez pour voir le détail</i>';
            hint.style.fontSize = '12px';
            hint.style.color = '#999';
            hint.style.marginTop = '8px';
            kpiVisitesElement.parentNode.insertBefore(hint, visiteAvOpen.nextSibling);
        }
        
        carteVisites.onclick = () => ouvrirModalVisites(visitesMois, donneesGlobales.listeMagasins);
        
        const dnInitiale = calculerScoreDNUnique(visitesPrec);
        const dnFinale = calculerScoreDNUnique(visitesFiltreesJusquaFin);
        const dnGagnee = dnFinale - dnInitiale;
        document.getElementById('kpi-dn').textContent = dnGagnee >= 0 ? `+${dnGagnee}` : dnGagnee;
        document.getElementById('evo-dn').textContent = `Base : ${dnInitiale} ➔ ${dnFinale}`;

        const kpiDnElement = document.getElementById('kpi-dn');
        const carteDn = kpiDnElement.parentNode;

        carteDn.style.cursor = 'pointer';
        carteDn.style.transition = '0.2s';
        carteDn.onmouseover = () => carteDn.style.transform = 'translateY(-2px)';
        carteDn.onmouseout = () => carteDn.style.transform = 'translateY(0)';

        if (document.getElementById('dn-click-hint')) {
            const hint = document.getElementById('dn-click-hint');
            hint.innerHTML = '<i>👆 Cliquez pour voir le détail</i>';
            hint.style.fontSize = '12px';
            hint.style.color = '#999';
            hint.style.marginTop = '8px';
            kpiDnElement.parentNode.insertBefore(hint, kpiDnElement.nextSibling);
        }
        
        carteDn.onclick = () => ouvrirModalDN(visitesMois, visitesPrec, donneesGlobales.listeMagasins);

        const meaHl = visitesMois.reduce((tot, v) => tot + (parseFloat(v.volume_mea) || 0), 0);
        document.getElementById('kpi-mea').textContent = parseFloat(meaHl.toFixed(2)) + ' HL';
        
        if(document.getElementById('evo-visites')) {
            document.getElementById('evo-visites').textContent = `Réalisées en ${nomMois}`;
            document.getElementById('evo-visites').className = "kpi-evolution evolution-neutral";
        }
        if(document.getElementById('evo-mea')) {
            document.getElementById('evo-mea').textContent = `Volume en ${nomMois}`;
            document.getElementById('evo-mea').className = "kpi-evolution evolution-neutral";
        }

        const mapDirects = {};
        visitesFiltreesJusquaFin.forEach(v => {
            if (ENSEIGNES_DIRECTES_GLOBALES.includes(v.enseigne)) {
                if (!mapDirects[v.hubspot_id] || v.created_at > mapDirects[v.hubspot_id].created_at) {
                    mapDirects[v.hubspot_id] = v;
                }
            }
        });

        const directsMois = [];
        const directsHisto = [];

        Object.values(mapDirects).forEach(v => {
            const dnF = calculerScoreDNUnique(visitesFiltreesJusquaFin.filter(vis => vis.hubspot_id === v.hubspot_id));
            const dnI = calculerScoreDNUnique(visitesPrec.filter(vis => vis.hubspot_id === v.hubspot_id));
            const estNouveauDirectCeMois = (dnI === 0 && dnF > 0 && v.created_at >= firstDayThisMonth && v.created_at <= lastDayThisMonth);;

            if (estNouveauDirectCeMois) {
                directsMois.push(v);
            } else if (dnF > 0) {
                directsHisto.push(v);
            }
        });

        const kpiDirectsElement = document.getElementById('kpi-directs');
        const evoDirectsElement = document.getElementById('evo-directs');
        const carteDirects = kpiDirectsElement.parentNode;

        kpiDirectsElement.textContent = directsMois.length + directsHisto.length; 
        evoDirectsElement.textContent = `Dont ${directsMois.length} gagnés en ${nomMois}`;

        carteDirects.style.cursor = 'pointer';
        carteDirects.style.transition = '0.2s';
        carteDirects.onmouseover = () => carteDirects.style.transform = 'translateY(-2px)';
        carteDirects.onmouseout = () => carteDirects.style.transform = 'translateY(0)';

        if (!document.getElementById('directs-click-hint')) {
            const hint = document.createElement('div');
            hint.id = 'directs-click-hint';
            hint.innerHTML = '<i>👆 Cliquez pour voir le détail</i>';
            hint.style.fontSize = '12px';
            hint.style.color = '#999';
            hint.style.marginTop = '8px';
            hint.style.marginBottom = '8px';
            carteDirects.insertBefore(hint, evoDirectsElement);
        }

        carteDirects.onclick = () => ouvrirModalDirects(directsMois, directsHisto, donneesGlobales.listeMagasins);

        // ==========================================
        // GENERATION (On passe objectifsDynamiques !)
        // ==========================================
        genererTableauPerformance(donneesGlobales.visitesBrutes, objectifsDynamiques, firstDayThisMonth, lastDayThisMonth);
        genererFocusDN(magasinsFiltres, visitesFiltreesJusquaFin);
        genererFocusMEA(visitesFiltrees, firstDayThisMonth, lastDayThisMonth);
        genererFocusDirect(magasinsFiltres, visitesFiltreesJusquaFin);
        genererProductivite(donneesGlobales.visitesBrutes, firstDayThisMonth, lastDayThisMonth);
        genererFondRayon(donneesGlobales.visitesBrutes, firstDayThisMonth, lastDayThisMonth, Object.keys(objectifsDynamiques));

    } catch (err) {
        console.error("Erreur Dashboard:", err);
    }
}

function calculerObjectifDNDynamique(emailCommercial, listeMagasins) {
    const nomCommercial = formatEmailToName(emailCommercial).toLowerCase();
    const parcCommercial = listeMagasins.filter(m => (m.Propriétaire || "").toLowerCase() === nomCommercial);
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

function genererTableauPerformance(toutesVisites, objectifs, start, end) {
    const tbody = document.getElementById('tbody-performance');
    if (!tbody) return;

    tbody.innerHTML = '';
    const emailsAvecObjectifs = Object.keys(objectifs);
    const commerciauxMails = [...new Set(toutesVisites.map(v => v.commercial_email))]
        .filter(email => email && emailsAvecObjectifs.includes(email.toLowerCase()));
        
    const enseignesDirectes = ENSEIGNES_DIRECTES_GLOBALES;

    const visPeriodeGlob = toutesVisites.filter(v => v.created_at >= start && v.created_at <= end);
    const visPrecGlob = toutesVisites.filter(v => v.created_at < start);
    const visJusquaFinGlob = toutesVisites.filter(v => v.created_at <= end);

    const mapInit = {};
    visPrecGlob.forEach(v => { if (!mapInit[v.hubspot_id] || v.created_at > mapInit[v.hubspot_id].created_at) mapInit[v.hubspot_id] = v });

    const mapFin = {};
    visJusquaFinGlob.forEach(v => { if (!mapFin[v.hubspot_id] || v.created_at > mapFin[v.hubspot_id].created_at) mapFin[v.hubspot_id] = v; });

    const mapDernierVisiteurPeriode = {};
    visPeriodeGlob.forEach(v => {
        if (!mapDernierVisiteurPeriode[v.hubspot_id] || v.created_at > mapDernierVisiteurPeriode[v.hubspot_id].created_at) {
            mapDernierVisiteurPeriode[v.hubspot_id] = v.commercial_email;
        }
    });

    const dnGagneeParCommercial = {};
    const directsGagnesParCommercial = {};

    Object.keys(mapFin).forEach(id => {
        const dnI = mapInit[id] ? (parseInt(mapInit[id].score_dn) || 0) : 0;
        const dnF = parseInt(mapFin[id].score_dn) || 0;
        const email = mapDernierVisiteurPeriode[id];
        
        if (email) { 
            if (dnF - dnI !== 0) {
                dnGagneeParCommercial[email] = (dnGagneeParCommercial[email] || 0) + (dnF - dnI);
            }
            if (enseignesDirectes.includes(mapFin[id].enseigne) && dnI === 0 && dnF > 0) {
                directsGagnesParCommercial[email] = (directsGagnesParCommercial[email] || 0) + 1;
            }
        }
    });


    let totalActuelDN = 0, totalObjDN = 0;
    let totalActuelMEA = 0, totalObjMEA = 0;
    let totalActuelDirect = 0, totalObjDirect = 0;

     const rendreCell = (actuel, objectif, unit = "") => {
        const actuelClean = parseFloat(Number(actuel).toFixed(2));

        if (objectif === null || objectif === undefined || objectif === 0) return `<span style="color:#999; font-size:12px;">Non défini</span><br><b>${actuelClean}</b>`;

         if (vuePourcentage) {
             const pct = Math.round((actuelClean / objectif) * 100);
             const col = pct >= 100 ? 'green' : (pct > 50 ? 'orange': 'red');
             return `<b style="color:${col};">${pct}%</b><br><span style="font-size:12px; color:#666;">(Obj: ${objectif})</span>`;
         } else {
             const reste = parseFloat((objectif - actuelClean).toFixed(2));
             return `<b>${reste <= 0 ? '✅ Atteint' : reste + ' ' + unit}</b><br><span style="font-size:12px; color:#666;">(Actuel: ${actuelClean})</span>`;
         }
    };


    commerciauxMails.forEach(email => {
        const visMois = toutesVisites.filter(v => v.commercial_email === email && v.created_at >= start && v.created_at <= end);
        
        const actuelDN = dnGagneeParCommercial[email] || 0;
        const actuelMEA = visMois.reduce((tot, v) => tot + (parseFloat(v.volume_mea) || 0), 0);
        const actuelDirect = directsGagnesParCommercial[email] || 0;

        // On utilise les objectifs dynamiques récupérés
        const obj = objectifs[(email || "").toLowerCase()] || { obj_dn: null, obj_mea: null, obj_direct: null };

        totalActuelDN += actuelDN;
        totalObjDN += (obj.obj_dn || 0);
        totalActuelMEA += actuelMEA;
        totalObjMEA += (obj.obj_mea || 0);
        totalActuelDirect += actuelDirect;
        totalObjDirect += (obj.obj_direct || 0);

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


    let actuelDNHors = 0;
    let actuelDirectHors = 0;
    
    Object.entries(dnGagneeParCommercial).forEach(([email, val]) => {
        if (!commerciauxMails.includes(email)) actuelDNHors += val;
    });
    Object.entries(directsGagnesParCommercial).forEach(([email, val]) => {
        if (!commerciauxMails.includes(email)) actuelDirectHors += val;
    });

    const visitesHorsSecteur = toutesVisites.filter(v => !commerciauxMails.includes(v.commercial_email));
    const visMoisHors = visitesHorsSecteur.filter(v => v.created_at >= start && v.created_at <= end);
    const actuelMEAHors = visMoisHors.reduce((tot, v) => tot + (parseFloat(v.volume_mea) || 0), 0);

    if (actuelDNHors !== 0 || actuelMEAHors > 0 || actuelDirectHors > 0) {
        totalActuelDN += actuelDNHors;
        totalActuelMEA += actuelMEAHors;
        totalActuelDirect += actuelDirectHors;

        const trHors = document.createElement('tr');
        trHors.style.borderBottom = "1px solid #eee";
        trHors.style.backgroundColor = "#fafafa";
        trHors.innerHTML = `
            <td style="padding: 12px; text-align: left; color: #888;"><i>Autres (Hors secteur)</i></td>
            <td style="padding: 12px;">${rendreCell(actuelDNHors, 0)}</td>
            <td style="padding: 12px;">${rendreCell(actuelMEAHors, 0, "HL")}</td>
            <td style="padding: 12px;">${rendreCell(actuelDirectHors, 0, "Mag.")}</td>
        `;
        tbody.appendChild(trHors);
    }
    

    if (commerciauxMails.length > 0 || actuelDNHors > 0) {
        const trTotal = document.createElement('tr');
        trTotal.style.borderTop = "3px solid #002ab6";
        trTotal.style.backgroundColor = "#f4f7f6";
        trTotal.innerHTML = `
            <td style="padding: 12px; text-align: left; color:#e41b19"><b>Total</b></td>
            <td style="padding: 12px;">${rendreCell(totalActuelDN, parseFloat(totalObjDN.toFixed(2)))}</td>
            <td style="padding: 12px;">${rendreCell(totalActuelMEA, parseFloat(totalObjMEA.toFixed(2)), "HL")}</td>
            <td style="padding: 12px;">${rendreCell(totalActuelDirect, parseFloat(totalObjDirect.toFixed(2)), "Mag.")}</td>
        `;

        tbody.appendChild(trTotal);
    }

    const btnBascule = document.getElementById('btn-bascule-perf');
    if (btnBascule) {
        const newBtn = btnBascule.cloneNode(true);
        btnBascule.parentNode.replaceChild(newBtn, btnBascule);
        newBtn.addEventListener('click', () => {
            vuePourcentage = !vuePourcentage;
            newBtn.textContent = vuePourcentage ? "🔄 Voir le Reste à faire" : "🔄 Voir les Pourcentages";
            genererTableauPerformance(toutesVisites, objectifs, start, end);
        });
    }
}

function initialiserMenuDeroulant(data, defaultFiltre) {
    if (listeInitialeChargee) return;
    const selectFiltre = document.getElementById('filtre-commercial');
    if (!selectFiltre) return;

    selectFiltre.innerHTML = '<option value="general">🌍 Général (Tous)</option>';
    
    // On utilise les clés de la base de données
    const emailsActifs = Object.keys(objectifsDynamiques);

    data.listeCommerciaux.forEach(email => {
        if (email && emailsActifs.includes(email.toLowerCase())) {
            selectFiltre.add(new Option(`👤 ${formatEmailToName(email)}`, email));
        }
    });

    if (defaultFiltre !== 'general' && !emailsActifs.includes(defaultFiltre.toLowerCase())) {
        selectFiltre.value = 'general';
    } else {
        selectFiltre.value = defaultFiltre;
    }
    
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
            Priorité: mag.Priorité || "N/A",
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
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><b>${opp.nom_magasin || opp.hubspot_id} - ${opp.Priorité}</b></td>
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

document.addEventListener("DOMContentLoaded", () => {
    const inputPeriode = document.getElementById('filtre-periode');
    if (inputPeriode) {
        inputPeriode.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        inputPeriode.addEventListener('change', () => {
            chargerDonneesEtAfficher(document.getElementById('filtre-commercial').value, true);
        });
    }
    
    chargerDonneesEtAfficher('general');

    // Fermeture des modals
    const closeDN = document.getElementById('close-modal-dn');
    const closeVisites = document.getElementById('close-modal-visites');
    const closeDirects = document.getElementById('close-modal-directs');

    if (closeDN) closeDN.onclick = () => document.getElementById('modal-detail-dn').style.display = 'none';
    if (closeVisites) closeVisites.onclick = () => document.getElementById('modal-detail-visites').style.display = 'none';
    if (closeDirects) closeDirects.onclick = () => document.getElementById('modal-detail-directs').style.display = 'none';

    window.onclick = (event) => {
        const modalDN = document.getElementById('modal-detail-dn');
        const modalVisites = document.getElementById('modal-detail-visites');
        const modalDirects = document.getElementById('modal-detail-directs');
        if (event.target === modalDN) modalDN.style.display = 'none';
        if (event.target === modalVisites) modalVisites.style.display = 'none';
        if (event.target === modalDirects) modalDirects.style.display = 'none';
    };
});



// ==========================================
// FOCUS MEA
// ==========================================
function genererFocusMEA(visites, start, end) {
    const tbody = document.getElementById('tbody-focus-mea');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let visitesMEA = visites.filter(v => v.created_at >= start && v.created_at <= end && (parseFloat(v.volume_mea) > 0));

    visitesMEA.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (visitesMEA.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #666;">Aucune MEA réalisée ce mois-ci.</td></tr>';
        return;
    }

    visitesMEA.forEach(v => {
        const dateFormatee = new Date(v.created_at).toLocaleDateString('fr-FR');
        
        // On récupère les infos du magasin
        const magInfo = donneesGlobales.listeMagasins.find(m => String(m.hubspot_id) === String(v.hubspot_id));
        const nomMagasin = magInfo ? magInfo.nom : v.hubspot_id;
        
        // 👇 On extrait la priorité ici !
        const priorite = magInfo && magInfo.Priorité ? magInfo.Priorité : "N/A";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; color: #888;">#${v.id || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${dateFormatee}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <b>${nomMagasin} - ${priorite}</b><br>
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
    const enseignesDirectes = ENSEIGNES_DIRECTES_GLOBALES;;
    
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
function genererProductivite(toutesVisites, start, end) {
    const tbody = document.getElementById('tbody-productivite');
    if (!tbody) return;
    
    const visitesMois = toutesVisites.filter(v => v.created_at >= start && v.created_at <= end);

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



// ===========================
// DÉTAIL DN
// ===========================
function ouvrirModalDN(visitesMois, visitesPrec, listeMagasins) {
    const storeIds = [...new Set([...visitesMois.map(v => v.hubspot_id), ...visitesPrec.map(v => v.hubspot_id)])];
    const details = [];

    storeIds.forEach(id => {
        const visitesCeMois = visitesMois.filter(v => v.hubspot_id === id);
         if (visitesCeMois.length === 0) return; 
        
        const dnFin = calculerScoreDNUnique(visitesMois.filter(v => v.hubspot_id === id));
        const dnInit = calculerScoreDNUnique(visitesPrec.filter(v => v.hubspot_id === id));
        const diff = dnFin - dnInit;

        if (diff !== 0) {
            const magInfo = listeMagasins?.find(m => String(m.hubspot_id) === String(id));
            details.push({
                nom: magInfo ? magInfo.nom : id,
                enseigne: magInfo ? magInfo.enseigne : "",
                diff: diff
            });
        }
    });

    details.sort((a, b) => b.diff - a.diff);

    const tbody = document.getElementById('tbody-detail-dn');
    tbody.innerHTML = '';

    if (details.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px; color: #666;">Aucune évolution de DN ce mois-ci.</td></tr>';
    } else {
        details.forEach(d => {
            const couleur = d.diff > 0 ? '#28a745' : '#dc3545';
            const signe = d.diff > 0 ? '+' : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <b>${d.nom}</b><br>
                    <span style="font-size: 11px; color: #888;">${d.enseigne}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    <b style="color: ${couleur}; font-size: 16px; background: ${couleur}15; padding: 4px 10px; border-radius: 12px;">${signe}${d.diff}</b>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('modal-detail-dn').style.display = 'flex';
}


// ===========================
// DÉTAIL VISITES
// ===========================
function ouvrirModalVisites(visitesMois, listeMagasins) {
    const tbody = document.getElementById('tbody-detail-visites');
    if (!tbody) return;
    tbody.innerHTML = '';

    const visitesTriees = [...visitesMois].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (visitesTriees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 20px; color: #666;">Aucune visite ce mois-ci.</td></tr>';
    } else {
        visitesTriees.forEach(v => {
            const magInfo = listeMagasins?.find(m => String(m.hubspot_id) === String(v.hubspot_id));
            const nom = magInfo ? magInfo.nom : v.hubspot_id;
            const enseigne = magInfo ? magInfo.enseigne : (v.enseigne || "");
            
            const dateFormatee = new Date(v.created_at).toLocaleDateString('fr-FR');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <b>${nom}</b><br>
                    <span style="font-size: 11px; color: #888;">${enseigne}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 13px; color: #333;">
                    ${dateFormatee}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('modal-detail-visites').style.display = 'flex';
}

// ===========================
// DÉTAIL DIRECTS (Vendeurs)
// ===========================
function ouvrirModalDirects(directsMois, directsHisto, listeMagasins) {
    const tbody = document.getElementById('tbody-detail-directs');
    if (!tbody) return;
    tbody.innerHTML = '';

    const creerLigne = (v, isHisto) => {
        const magInfo = listeMagasins?.find(m => String(m.hubspot_id) === String(v.hubspot_id));
        const nom = magInfo ? magInfo.nom : v.hubspot_id;
        const enseigne = magInfo ? magInfo.enseigne : (v.enseigne || "");
        const dateFormatee = new Date(v.created_at).toLocaleDateString('fr-FR');

        const tr = document.createElement('tr');
        tr.className = isHisto ? 'direct-row direct-row-histo' : 'direct-row';

        tr.innerHTML = `
            <td>
                <b class="direct-nom">${nom}</b><br>
                <span class="direct-enseigne">${enseigne}</span>
            </td>
            <td class="direct-date">
                ${dateFormatee}
            </td>
        `;
        return tr;
    };

    if (directsMois.length === 0 && directsHisto.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="chargement">Aucun magasin direct actif.</td></tr>';
    } else {
        directsMois.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(v => {
            tbody.appendChild(creerLigne(v, false));
        });

        if (directsMois.length > 0 && directsHisto.length > 0) {
            const trSep = document.createElement('tr');
            trSep.className = 'direct-separator';
            trSep.innerHTML = `<td colspan="2">||</td>`;
            tbody.appendChild(trSep);
        }

        directsHisto.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(v => {
            tbody.appendChild(creerLigne(v, true));
        });
    }

    document.getElementById('modal-detail-directs').style.display = 'flex';
}




// ==========================================
// FOND DE RAYON (Sales / Hors Secteur / Total)
// ==========================================

const matriceGMS = {
  "AUCHAN HM": {obligatoire: ["LB75", "NQ75", "YT75", "ML75", "LB33", "NQ33",  "YT33"], facultatif: [], direct: ["LB44", "NQ44", "YT44", "ML44", "SH75", "TC75", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"]},
  "AUCHAN SM": { obligatoire: [], facultatif: ["LB75", "NQ75", "YT75", "ML75", "LB33", "NQ33", "YT33"], direct: ["SH75", "TC75", "LB44", "NQ44", "YT44", "ML44", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] }, 
  "CASINO": { obligatoire: ["LB44", "NQ44", "YT44", "LB33"], facultatif: [], direct: ["LB75", "NQ75", "ML75", "YT75", "SH75", "TC75", "ML44", "NQ33", "YT33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "FRANPRIX": { obligatoire: ["LB44", "YT44"], facultatif: [], direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "NQ44", "ML44", "LB33", "NQ33", "YT33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "MONOPRIX": { obligatoire: ["LB75", "LB44", "NQ44", "YT44"], facultatif: [], direct: ["NQ75", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "NQ33", "YT33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "CRF HYPER": { obligatoire: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"], facultatif: [], direct: ["SH75", "NQ44", "YT44", "LB33", "NQ33", "YT33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "CRF MARKET": { obligatoire: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"], facultatif: [], direct: ["NQ44", "YT44", "SH75", "LB33", "NQ33", "YT33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "CRF PROXI": { obligatoire: [], facultatif: ["LB75", "ML75", "NQ75", "YT75", "TC75", "LB44", "ML44"], direct: ["SH75", "NQ44", "YT44", "LB33", "NQ33", "YT33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "ITM PROXI": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "ITM SM": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "LECLERC": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "LECLERC PROXI": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "OTERA": { obligatoire: ["LB44", "NQ44", "YT44", "ML44"], facultatif: [], direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "LB33", "NQ33", "YT33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "SUPER U": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "G 20": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "U EXPRESS": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "LECLERC DRIVE": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "MATCH": { obligatoire: [], facultatif: [], direct: ["LB44", "LB75", "NQ44", "NQ75", "YT44", "YT75", "SH75", "TC75", "ML75", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "NICOLAS": { obligatoire: ["NQ33", "YT33", "ML44", "LB44"], facultatif: [], direct: ["LB75", "ML75", "TC75", "NQ75", "SH75", "YT75", "NQ44","YT44", "LB33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] },
  "AUTRES": { obligatoire: [], facultatif: [], direct: ["LB75", "NQ75", "YT75", "SH75", "TC75", "ML75", "LB44", "NQ44", "YT44", "ML44", "LB33", "YT33", "NQ33", "UA33 (Ltd)", "DB44 (Ltd)", "SG44 (Ltd)", "SQP33 (Ltd)", "FT44 (Ltd)"] }
};

function calculerFacings(visite) {
    let totalFacings = 0;
    
    if (visite.details_produits) {
        let details = visite.details_produits;
        if (typeof details === 'string') {
            try { details = JSON.parse(details); } catch(e) { details = {}; }
        }
        
        const cles = Object.keys(details);
        if (cles.length > 0) {
            cles.forEach(key => {
                const facingSaisi = parseInt(details[key].facings) || 0;
                if (facingSaisi > 0) {
                    totalFacings += facingSaisi;
                } else {
                    totalFacings += 1;
                }
            });
            return totalFacings;
        }
    }
    
    return parseInt(visite.score_dn) || 0;
}

function genererFondRayon(toutesVisites, start, end, emailsAvecObjectifs) {
    const tbody = document.getElementById('tbody-fond-rayon');
    if (!tbody) return;
    tbody.innerHTML = '';

    const commerciauxMails = [...new Set(toutesVisites.map(v => v.commercial_email))]
        .filter(email => email && emailsAvecObjectifs.includes(email.toLowerCase()));

    const visJusquaFinGlob = toutesVisites.filter(v => v.created_at <= end);
    const mapFin = {};
    
    visJusquaFinGlob.forEach(v => {
        if (!mapFin[v.hubspot_id] || v.created_at > mapFin[v.hubspot_id].created_at) {
            mapFin[v.hubspot_id] = v;
        }
    });

    const statsParCommercial = {};
    commerciauxMails.forEach(email => {
        statsParCommercial[email] = { mags: 0, dn: 0, dnPourCentNum: 0, maxOblig: 0, facings: 0 };
    });

    const statsHors = { mags: 0, dn: 0, dnPourCentNum: 0, maxOblig: 0, facings: 0 };
    const statsTotal = { mags: 0, dn: 0, dnPourCentNum: 0, maxOblig: 0, facings: 0 };

    Object.values(mapFin).forEach(visite => {
        const dnActuelle = parseInt(visite.score_dn) || 0;
        
        if (dnActuelle > 0) {
            const enseignePropre = visite.enseigne ? visite.enseigne.toUpperCase() : "AUTRES";
            const maxStore = (matriceGMS[enseignePropre] || matriceGMS["AUTRES"]).obligatoire.length;
            
            const facings = calculerFacings(visite);
            const email = visite.commercial_email;
            
            let cible;
            if (commerciauxMails.includes(email)) {
                cible = statsParCommercial[email];
            } else {
                cible = statsHors;
            }

            cible.mags++;
            cible.dn += dnActuelle;
            cible.facings += facings;
            if (maxStore > 0) {
                cible.dnPourCentNum += dnActuelle;
                cible.maxOblig += maxStore;
            }

            statsTotal.mags++;
            statsTotal.dn += dnActuelle;
            statsTotal.facings += facings;
            if (maxStore > 0) {
                statsTotal.dnPourCentNum += dnActuelle;
                statsTotal.maxOblig += maxStore;
            }
        }
    });

    const renderRow = (titre, data, isBold = false) => {
        const dnPct = data.maxOblig > 0 ? Math.round((data.dnPourCentNum / data.maxOblig) * 100) : null;        
        const facingParDN = data.dn > 0 ? (data.facings / data.dn).toFixed(2) : "0.00";

        const tr = document.createElement('tr');
        if (isBold) {
            tr.style.borderTop = "3px solid #002ab6";
            tr.style.backgroundColor = "#f4f7f6";
        } else {
            tr.style.borderBottom = "1px solid #eee";
        }
        
        tr.innerHTML = `
            <td style="padding: 12px; text-align: left;">${isBold ? `<b style="color:#e41b19">${titre}</b>` : `<b>${titre}</b>`}</td>
            <td style="padding: 12px; font-weight: bold;">${data.mags}</td>
            <td style="padding: 12px; font-weight: bold;">${data.dn}</td>
            <td style="padding: 12px;">${dnPct}%</td>
            <td style="padding: 12px; font-weight: bold;">${data.facings}</td>
            <td style="padding: 12px; font-weight: bold; color: #002ab6;">${facingParDN}</td>
        `;
        tbody.appendChild(tr);
    };

    commerciauxMails.forEach(email => {
        renderRow(formatEmailToName(email), statsParCommercial[email]);
    });

    if (statsHors.mags > 0) renderRow("<i>Autres (Hors secteur)</i>", statsHors);
    
    if (commerciauxMails.length > 0 || statsHors.mags > 0) {
        renderRow("Total", statsTotal, true);
    }
}
