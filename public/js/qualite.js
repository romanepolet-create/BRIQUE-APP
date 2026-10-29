// --- DONNÉES DE RÉFÉRENCE ---
const gammeForever = ["La Bagarre", "Yankee Trouble", "Mick Lager", "New Queen In Town", "Triple Chuc", "Shiny Hoppy", "Young Pug", "Accro Blanche"];
const gammeExperimentales = ["Double Bagarre", "Sanguin’ale", "Bière de Noël", "Brique Blonde"];
const allReferences = [...gammeForever, ...gammeExperimentales];

// Exemple de données simulées (À remplacer par un fetch(GET) sur votre BDD plus tard)
const donneesLots = [
    { reference: "La Bagarre", lot: "26092", formats: { "33cl": "ND", "44cl": "Conforme", "75cl": "ND", "20L": "Conforme", "30L": "ND" }, remontees: 0 },
    { reference: "La Bagarre", lot: "26093", formats: { "33cl": "Conforme", "44cl": "Conforme", "75cl": "ND", "20L": "Conforme", "30L": "Non Conforme" }, remontees: 2 },
    { reference: "Yankee Trouble", lot: "27010", formats: { "33cl": "Conforme", "44cl": "ND", "75cl": "ND", "20L": "Conforme", "30L": "Conforme" }, remontees: 0 }
];

document.addEventListener('DOMContentLoaded', () => {
    initModal();
    initGrids();
});

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
            const response = await fetch('/api/qualite/remontee'
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();

            if (result.success) {
                feedback.textContent = result.message;
                feedback.classList.add('success');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    form.reset();
                    feedback.textContent = "";
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

// --- GESTION DE L'AFFICHAGE PAR RÉFÉRENCE ---
function initGrids() {
    const container = document.getElementById('references-container');
    container.innerHTML = '';

    // On crée un bloc pour chaque bière qui possède des données
    allReferences.forEach(ref => {
        const lotsForRef = donneesLots.filter(d => d.reference === ref);
        if (lotsForRef.length === 0) return; // On ignore les bières sans lot actif

        const refSection = document.createElement('div');
        refSection.className = 'reference-section';

        // Extraction des numéros de lot pour le dropdown
        const optionsLots = lotsForRef.map(l => `<option value="${l.lot}">Lot n°${l.lot}</option>`).join('');

        refSection.innerHTML = `
            <div class="ref-header">
                <h2>${ref}</h2>
                <select class="lot-selector" data-ref="${ref}">
                    <option value="all">Tous les lots</option>
                    ${optionsLots}
                </select>
            </div>
            <div class="lots-grid" id="grid-${ref.replace(/\s+/g, '-')}">
                <!-- Les cartes seront injectées ici -->
            </div>
        `;
        container.appendChild(refSection);
        
        // Rendu initial (tous les lots)
        renderCards(ref, lotsForRef);
        
        // Event sur le dropdown pour filtrer
        const selector = refSection.querySelector('.lot-selector');
        selector.addEventListener('change', (e) => {
            const selectedLot = e.target.value;
            const filteredLots = selectedLot === 'all' 
                ? lotsForRef 
                : lotsForRef.filter(l => l.lot === selectedLot);
            renderCards(ref, filteredLots);
        });
    });
}

function renderCards(refName, lotsArray) {
    const gridId = `grid-${refName.replace(/\s+/g, '-')}`;
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';

    lotsArray.forEach(item => {
        let formatsHtml = '';
        for (const [format, statut] of Object.entries(item.formats)) {
            let statClass = statut.toLowerCase() === 'conforme' ? 'status-conforme' : (statut.toLowerCase() === 'nd' ? 'status-nd' : 'status-non-conforme');
            formatsHtml += `
                <li class="format-item">
                    <span class="format-volume">${format}</span>
                    <span class="status-badge ${statClass}">${statut}</span>
                </li>
            `;
        }

        grid.innerHTML += `
            <div class="lot-card">
                <div class="lot-header">
                    <span class="lot-number">Lot n°${item.lot}</span>
                </div>
                <ul class="format-list">${formatsHtml}</ul>
                <div class="lot-footer">
                    <span>Remontées :</span>
                    <span class="remontees-count ${item.remontees > 0 ? 'alert' : 'ok'}">${item.remontees}</span>
                </div>
            </div>
        `;
    });
}
