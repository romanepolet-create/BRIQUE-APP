let chargementReussi = false; 

window.chargerTourneeMemoire = async function() {
    genererJoursOuvres();
    afficherSliderJours();
    
    const backup = localStorage.getItem('brique_app_tournees');
    if (backup) {
        try { memoireGlobaleTournees = JSON.parse(backup); } catch(e) {}
    }

    if (!window.emailActuelPourTournee) {
        etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
        actualiserPanneauGPS();
        filtrerMagasins();
        return;
    }

    try {
        const { data, error } = await supabaseClient.from('tournees').select('magasins').eq('email', window.emailActuelPourTournee).maybeSingle();

        if (error) throw error;
        
        let reparationNecessaire = false;

        if (data && data.magasins) {
            for (const jour in data.magasins) {
                const etapesCloud = data.magasins[jour];
                const etapesLocal = memoireGlobaleTournees[jour];

                if (Array.isArray(etapesCloud) && etapesCloud.length === 0 && Array.isArray(etapesLocal) && etapesLocal.length > 0) {
                    reparationNecessaire = true;
                } else {
                    memoireGlobaleTournees[jour] = etapesCloud;
                }
            }
        }


        const aujourdHui = new Date();
        aujourdHui.setHours(0, 0, 0, 0);

        for (const jour in memoireGlobaleTournees) {
            const dateJour = new Date(jour);
            if (!isNaN(dateJour)) {
                const diffJours = (aujourdHui - dateJour) / (1000 * 3600 * 24);
                
                if (diffJours > 7) {
                    delete memoireGlobaleTournees[jour];
                    reparationNecessaire = true;
                    console.log(`🧹 Nettoyage auto : Historique du ${jour} supprimé (> 7j)`);
                }
            }
        }
        

        
        chargementReussi = true; 
        etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];

        if (reparationNecessaire) {
            console.log("Données locales restaurées, réparation du Cloud en cours...");
            sauvegarderTourneeMemoire();
        }
        
    } catch (erreur) {
        console.error("Erreur de chargement Cloud :", erreur);
        chargementReussi = false; 
        afficherToast("⚠️ Mode hors-ligne : Sauvegarde Cloud suspendue.");
    }

    etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
    actualiserPanneauGPS();
    filtrerMagasins();
};
document.addEventListener("DOMContentLoaded", function() {
    const liste = document.getElementById('liste-tournee');
    
    if (liste) {
        new Sortable(liste, {
            animation: 150,
            delay: 100,
            delayOnTouchOnly: true,
            onEnd: function (evt) {
                const elementDeplace = etapesItineraire.splice(evt.oldIndex, 1)[0];
                etapesItineraire.splice(evt.newIndex, 0, elementDeplace);
                
                actualiserPanneauGPS();
                if (typeof sauvegarderTourneeMemoire === "function") {
                    sauvegarderTourneeMemoire();
                }
            }
        });
    }
});

let modeVisionnage = false;

window.ouvrirMenuEquipe = async function() {
    if (proprietaireActuel && normaliserTexte(proprietaireActuel) !== normaliserTexte("Leo Blanchet")) {
        afficherToast("❌ Accès réservé aux managers."); return;
    }
    try {
        const { data, error } = await supabaseClient.from('tournees').select('email, magasins');
        if (error) throw error;
        
        const tourneesValides = data.filter(t => t.email);

        window.tempTourneesEquipe = [];

        const EquipePopup = document.createElement("div");
        EquipePopup.id = "equipe-popup-container";
        EquipePopup.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:20px; border:2px solid black; z-index:9999; box-shadow:4px 4px 15px rgba(0,0,0,0.4); width:300px; text-align:center;";
        
        let boutonsHTML = tourneesValides.map((t, index) => {
            const nom = t.email.split('@')[0].replace('.', ' ').toUpperCase();
            window.tempTourneesEquipe[index] = t.magasins;
            
            return `<button type="button" onclick="chargerTourneeEquipe(${index}, '${nom}')" style="display:block; width:100%; margin-bottom:8px; padding:8px; background:#002ab6; color:white; border:none; cursor:pointer;">${nom}</button>`;
        }).join('');

        boutonsHTML += `<button onclick="this.parentElement.remove()" style="margin-top:10px; background:#dc3545; color:white; padding:5px 15px; border:none; cursor:pointer;">Fermer</button>`;
        EquipePopup.innerHTML = `<h3>👥 Tournées de l'équipe</h3>${boutonsHTML}`;
        document.body.appendChild(EquipePopup);
        document.body.appendChild(EquipePopup);
        } catch (err) {
        console.error("Erreur équipe :", err);
    }
};

window.chargerTourneeEquipe = function(index, nom) {
    const donnees = window.tempTourneesEquipe[index];
    memoireGlobaleTournees = donnees || {};
    etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
    
    modeVisionnage = true;
    
    const titreEl = document.getElementById('ma-tournee');
    if (titreEl) titreEl.innerHTML = `📍 Tournée de ${nom} <span style="color:red; font-size:10px;">(Lecture Seule)</span>`;
    
    afficherSliderJours();
    actualiserPanneauGPS();
    filtrerMagasins();
    
    document.getElementById('equipe-popup-container').remove();
};


window.sauvegarderTourneeMemoire = async function () {
    if (modeVisionnage) return;

    memoireGlobaleTournees[jourSelectionneId] = [...etapesItineraire];
    
    try {
        localStorage.setItem('brique_app_tournees', JSON.stringify(memoireGlobaleTournees));
    } catch (e) {
        console.warn("Stockage local inaccessible.");
    }

    if (!chargementReussi) {
        console.warn("Sauvegarde Cloud bloquée : risque d'écrasement des données.");
        return; 
    }

    if (!window.emailActuelPourTournee) return;
    
    try {
        const { data, error } = await supabaseClient.from('tournees').upsert({
            email: window.emailActuelPourTournee,
            magasins: memoireGlobaleTournees
        }, { onConflict: 'email' });
        
        if (error) {
            console.error("❌ Refus de Supabase :", error);
            afficherToast("Erreur de synchronisation Cloud !");
        } else {
            console.log("✅ Sauvegarde Cloud réussie !");
        }
    } catch (erreur) {
        console.error("Erreur critique de sauvegarde :", erreur);
    }
};

let modeSemaineActif = false;

window.toggleVueSemaine = function() {
    modeSemaineActif = !modeSemaineActif;
    let container = document.getElementById('agenda-semaine-overlay');
     const mapContainer = document.querySelector('.map-container'); 


    if (!container) {
        container = document.createElement('div');
        container.id = 'agenda-semaine-overlay';
        document.body.appendChild(container);
    }

    if (modeSemaineActif) {
        document.body.classList.add('agenda-ouvert');
        if (mapContainer) mapContainer.style.height = 'calc(100vh - 80px - 45vh)';

        renderAgendaSemaine();
        setTimeout(() => { if (typeof map !== 'undefined') map.invalidateSize(); }, 350);
    } else {
        document.body.classList.remove('agenda-ouvert');
        if (mapContainer) mapContainer.style.height = 'calc(100vh - 80px)';
 
         setTimeout(() => { if (typeof map !== 'undefined') map.invalidateSize(); }, 350);
    }
}

window.renderAgendaSemaine = function() {
    const container = document.getElementById('agenda-semaine-overlay');
    const joursAffiches = joursOuvres.slice(0, 6);

    let html = `
        <div id="modal-h-calendar">
            <h2 id="h-modal-calendar">📆 Agenda Brique APP</h2>
            <button onclick="toggleVueSemaine()" id="btn-fullScreen-calendar">✖</button>
        </div>
        <table class="agenda-table">
            <thead>
                <tr>${joursAffiches.map(jour => `<th>${jour.label}</th>`).join('')}</tr>
            </thead>
            <tbody>
                <tr>
    `;


    joursAffiches.forEach(jour => {
        const etapes = memoireGlobaleTournees[jour.id] || [];

        html += `<td><ul class="agenda-sortable-list" data-jour="${jour.id}">`;

        etapes.forEach((etape, index) => {
            if (!etape.masque) {
                html += `
                <li class='etape-calendar' data-index="${index}">
                    <strong>${index + 1}.${etape.nom}</strong><br>
                </li>
            `
            }
        });

        html += `</ul></td>`;
    });

    html += `
                </tr>
            </tbody>
        </table>
    `;

    container.innerHTML = html;

    const listes = document.querySelectorAll('.agenda-sortable-list');
    listes.forEach(ul => {
        new Sortable(ul, {
            group: 'agenda-semaine',
            animation: 150,
            forceFallback: true,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                const idJourDepart = evt.from.dataset.jour;
                const idJourArrivee = evt.to.dataset.jour;
                const ancienIndex = evt.oldIndex;
                const nouvelIndex = evt.newIndex;

                if (idJourDepart === idJourArrivee && ancienIndex === nouvelIndex) return

                if (!memoireGlobaleTournees[idJourDepart]) memoireGlobaleTournees[idJourDepart] = [];
                const magasinDeplace = memoireGlobaleTournees[idJourDepart].splice(ancienIndex, 1)[0];

                if (!memoireGlobaleTournees[idJourArrivee]) memoireGlobaleTournees[idJourArrivee] = [];
                memoireGlobaleTournees[idJourArrivee].splice(nouvelIndex, 0, magasinDeplace);

                if (idJourDepart === jourSelectionneId || idJourArrivee === jourSelectionneId) {
                    etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
                    actualiserPanneauGPS();
                }

                sauvegarderTourneeMemoire();
                renderAgendaSemaine(); 
            }
        });
    });
};
