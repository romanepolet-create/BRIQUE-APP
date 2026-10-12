window.chargerTourneeMemoire = async function() {
    genererJoursOuvres();
    afficherSliderJours();
    if (!window.emailActuelPourTournee) return;
    try {
        const { data, error } = await supabaseClient.from('tournees').select('magasins').eq('email', window.emailActuelPourTournee).maybeSingle();
        if (error) throw error;
        
        if (data && data.magasins) memoireGlobaleTournees = data.magasins;
        else {
            const backup = localStorage.getItem('brique_app_tournees');
            if (backup) memoireGlobaleTournees = JSON.parse(backup);
        }
        
        etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
        actualiserPanneauGPS();
        filtrerMagasins();
    } catch (erreur) {
        console.error("Erreur de chargement :", erreur);
        const backup = localStorage.getItem('brique_app_tournees');
        if (backup) memoireGlobaleTournees = JSON.parse(backup);
        etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
        actualiserPanneauGPS();
        filtrerMagasins();
    }
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


let chargementReussi = false;

window.sauvegarderTourneeMemoire = async function () {
   if (modeVisionnage) return;

    memoireGlobaleTournees[jourSelectionneId] = [...etapesItineraire];
    localStorage.setItem('brique_app_tournees', JSON.stringify(memoireGlobaleTournees));

    if (!window.emailActuelPourTournee) return;
    try {
        await supabaseClient.from('tournees').upsert({
            email: window.emailActuelPourTournee,
            magasins: memoireGlobaleTournees
        }, { onConflict: 'email' });
    } catch (erreur) {
        console.error("Erreur de sauvegarde", erreur);
    }
};
