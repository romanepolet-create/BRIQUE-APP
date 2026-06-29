// ==========================================
// OUTILS DE MÉMOIRE (SUPABASE)
// ==========================================

// 1. Charger la tournée au démarrage de la page
async function chargerTourneeMemoire() {
    try {
        const response = await fetch('/api/tournee/charger');
        const data = await response.json();

        if (data.success && data.tournee) {
            console.log("✅ Tournée retrouvée en mémoire !");
            // Ici, tu mets ta logique habituelle pour afficher les magasins à l'écran
            // Exemple : 
            // maListeDeMagasins = data.tournee.magasins;
            // rafraichirAffichagePanneau();
        } else {
            console.log("ℹ️ Aucune tournée en mémoire, on commence à zéro.");
            // On fait tout normalement (liste vide)
        }
    } catch (erreur) {
        console.error("Erreur lors du chargement de la tournée", erreur);
    }
}

// 2. Sauvegarder la tournée (La "Photo")
async function sauvegarderTourneeMemoire(listeActuelleDesMagasins) {
    try {
        await fetch('/api/tournee/sauvegarder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ magasins: listeActuelleDesMagasins })
        });
        console.log("💾 Tournée sauvegardée en arrière-plan !");
    } catch (erreur) {
        console.error("Erreur de sauvegarde", erreur);
    }
}
