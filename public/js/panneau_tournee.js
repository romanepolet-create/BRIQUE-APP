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
