// ==========================================
// OUTILS DE MÉMOIRE (SUPABASE)
// ==========================================

// 1. Charger la tournée au démarrage de la page
window.chargerTourneeMemoire = async function() {
    genererJoursOuvres();
    afficherSliderJours();
    try {
        const response = await fetch('/api/tournee/charger');
        const data = await response.json();

        if (data.success && data.tournee) {
            if (Array.isArray(data.tournee.magasins)) {
                memoireGlobaleTournees[jourSelectionneId] = data.tournee.magasins;
            } else {
                memoireGlobaleTournees = data.tournee.magasins || {};
            }
            etapesItineraire = memoireGlobaleTournees[jourSelectionneId] || [];
            actualiserPanneauGPS();
            filtrerMagasins();
            }
    } catch (erreur) {
        console.error("Erreur de chargement :", erreur);
    }
};

window.sauvegarderTourneeMemoire = async function() {
    memoireGlobaleTournees[jourSelectionneId] = [...etapesItineraire];
    try {
        const response = await fetch('/api/tournee/sauvegarder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magasins: memoireGlobaleTournees }) 
        });
        
        if (!response.ok) throw new Error("Erreur " + response.status);
    } catch (erreur) {
        console.error("Erreur de sauvegarde", erreur);
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
    try {
        const response = await fetch('/api/tournee/equipe');
        if (response.status === 403) {
            afficherToast("❌ Accès réservé aux managers.");
            return;
        }
        const data = await response.json();
        
        const tourneesValides = data.tournees.filter(t => t.email);
        
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



const sauvegardeOriginale = window.sauvegarderTourneeMemoire;
window.sauvegarderTourneeMemoire = async function() {
    if (modeVisionnage) {
        console.log("Lecture seule : Sauvegarde bloquée.");
        return; 
    }
    await sauvegardeOriginale();
};
