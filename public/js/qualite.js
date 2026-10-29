// --- DONNÉES DE RÉFÉRENCE ---
const gammeForever = ["La Bagarre", "Yankee Trouble", "Mick Lager", "New Queen In Town", "Triple Chuc", "Shiny Hoppy", "Young Pug", "Accro Blanche"];
const gammeExperimentales = ["Double Bagarre", "Sanguin’ale", "Bière de Noël", "Brique Blonde"];
const allReferences = [...gammeForever, ...gammeExperimentales];

let donneesLots = []; // Devient une variable vide remplie par Supabase

document.addEventListener('DOMContentLoaded', () => {
    initModal();
    chargerDonnees(); // Au lieu de initGrids(), on appelle la BDD
});

// --- CHARGEMENT DEPUIS LA BDD ---
async function chargerDonnees() {
    try {
        const res = await fetch('/api/qualite/donnees');
        const result = await res.json();

        if (result.success) {
            const lotsMap = {};
            // Tout est considéré conforme par défaut
            const baseFormats = { "33cl": "Conforme", "44cl": "Conforme", "75cl": "Conforme", "20L": "Conforme", "30L": "Conforme" };

            // On regroupe les problèmes par Référence + Numéro de lot
            result.remontees.forEach(row => {
                const key = `${row.reference}-${row.numero_lot}`;
                
                if (!lotsMap[key]) {
                    lotsMap[key] = {
                        reference: row.reference,
                        lot: row.numero_lot,
                        formats: { ...baseFormats },
                        remontees: 0
                    };
                }
                
                // Le format ciblé par la remontée passe en Non Conforme
                if (row.format && lotsMap[key].formats[row.format]) {
                    lotsMap[key].formats[row.format] = "Non Conforme";
                }
                lotsMap[key].remontees += 1;
            });

            // On transforme l'objet en tableau pour la fonction initGrids
            donneesLots = Object.values(lotsMap);
            initGrids(); // On dessine les grilles
        }
    } catch (error) {
        console.error("Erreur lors du chargement des données", error);
    }
}

// --- GESTION DE LA MODALE & DU FORMULAIRE ---
function initModal() {
    const modal = document.getElementById('modal-issue');
    const btnOpen = document.getElementById('btn-add-issue');
    const btnClose = document.querySelector('.close-modal');
    const form = document.getElementById('form-issue');

    // Remplir les selects du formulaire
    const optForever = document.getElementById('opt-forever');
    gammeForever.forEach(beer => optForever.innerHTML += `<option value="${beer}">${beer}</option>`);
    
    const optExp = document.getElementById('opt-experimentales');
    gammeExperimentales.forEach(beer => optExp.innerHTML += `<option value="${beer}">${beer}</option>`);

    // Ouvrir / Fermer
    btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => { if(e.target === modal) modal.classList.add('hidden'); });

    // Soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('form-feedback');
        feedback.textContent = "Envoi en cours...";
        feedback.className = "feedback-msg";

        const formData = {
            reference: document.getElementById('reference').value,
            numero_lot: document.getElementById('numero_lot').value,
            format: document.getElementById('format').value,
            description: document.getElementById('description').value
        };

        try {
            const response = await fetch('/api/qualite/remontee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();

            if (result.success) {
                feedback.textContent = result.message;
                feedback.classList.add('success');
                
                // 👈 AJOUTEZ CETTE LIGNE POUR ACTUALISER L'AFFICHAGE
                chargerDonnees(); 

                setTimeout(() => {
                    modal.classList.add('hidden');
                    form.reset();
                    feedback.textContent = "";
                    feedback.className = "feedback-msg";
                }, 2000);
            } else {
                feedback.textContent = result.error;
                feedback.classList.add('error');
            }
        } catch (err) {
            feedback.textContent = "Erreur de connexion au serveur.";
            feedback.classList.add('error');
        }
    });
}

// --- GESTION DE L'AFFICHAGE (1 CARTE PAR RÉFÉRENCE) ---
function initGrids() {
    const container = document.getElementById('references-container');
    container.innerHTML = '';
    container.className = 'lots-grid'; // On applique directement la grille au conteneur

    allReferences.forEach(ref => {
        // On récupère tous les lots pour cette référence
        const lotsForRef = donneesLots.filter(d => d.reference === ref);
        if (lotsForRef.length === 0) return; // S'il n'y a pas de lot, on passe

        // Création de la carte
        const card = document.createElement('div');
        card.className = 'lot-card';

        // Création des options du menu déroulant (N° de lot)
        const optionsLots = lotsForRef.map(l => `<option value="${l.lot}">Lot n°${l.lot}</option>`).join('');
        
        // Le lot affiché par défaut (le premier de la liste)
        const initialLot = lotsForRef[0];

        // Structure HTML de la carte
        card.innerHTML = `
            <div class="lot-header">
                <h3 class="card-ref-title">${ref}</h3>
                <select class="card-lot-selector">
                    ${optionsLots}
                </select>
            </div>
            <div class="card-body">
                <!-- Le contenu (formats/remontées) sera injecté ici par JS -->
            </div>
        `;
        
        container.appendChild(card);
        
        // Éléments interactifs de la carte
        const bodyContainer = card.querySelector('.card-body');
        const selector = card.querySelector('.card-lot-selector');
        
        // Fonction pour mettre à jour l'intérieur de la carte quand on change de lot
        const updateCardBody = (lotData) => {
            let formatsHtml = '';
            for (const [format, statut] of Object.entries(lotData.formats)) {
                let statClass = statut.toLowerCase() === 'conforme' ? 'status-conforme' : (statut.toLowerCase() === 'nd' ? 'status-nd' : 'status-non-conforme');
                formatsHtml += `
                    <li class="format-item">
                        <span class="format-volume">${format}</span>
                        <span class="status-badge ${statClass}">${statut}</span>
                    </li>
                `;
            }
            bodyContainer.innerHTML = `
                <ul class="format-list">${formatsHtml}</ul>
                <div class="lot-footer">
                    <span>Remontées :</span>
                    <span class="remontees-count ${lotData.remontees > 0 ? 'alert' : 'ok'}">${lotData.remontees}</span>
                </div>
            `;
        };

        // 1er affichage
        updateCardBody(initialLot);

        // Mise à jour au changement du menu déroulant
        selector.addEventListener('change', (e) => {
            const selectedLotNum = e.target.value;
            const selectedLotData = lotsForRef.find(l => l.lot === selectedLotNum);
            updateCardBody(selectedLotData);
        });
    });
}
