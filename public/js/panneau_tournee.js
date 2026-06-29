// ==========================================
// OUTILS DE MÉMOIRE (SUPABASE)
// ==========================================

// 1. Charger la tournée au démarrage de la page
window.chargerTourneeMemoire = async function() {
    try {
        const response = await fetch('/api/tournee/charger');
        const data = await response.json();

        if (data.success && data.tournee) {
            console.log("✅ Tournée retrouvée en mémoire !");
            
            etapesItineraire = data.tournee.magasins; 
            
            actualiserPanneauGPS();
            filtrerMagasins(); 
        } else {
            console.log("ℹ️ Aucune tournée en mémoire, on commence à zéro.");
        }
    } catch (erreur) {
        console.error("Erreur lors du chargement de la tournée", erreur);
    }
};

// 2. Sauvegarder la tournée (La "Photo")
window.sauvegarderTourneeMemoire = async function() {
    try {
        await fetch('/api/tournee/sauvegarder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magasins: etapesItineraire }) 
        });
        
        if (!response.ok) throw new Error("Erreur " + response.status);
        
        console.log("💾 Tournée sauvegardée en arrière-plan !");
    } catch (erreur) {
        console.error("Erreur de sauvegarde", erreur);
    }
};
