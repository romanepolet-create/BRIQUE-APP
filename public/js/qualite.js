let donneesGlobales = [];

document.addEventListener('DOMContentLoaded', () => {
    initModal();
    chargerDonnees();
});

// --- CHARGEMENT DEPUIS LA BDD ---
async function chargerDonnees() {
    try {
        const res = await fetch('/api/qualite/donnees');
        const result = await res.json();

        if (result.success) {
            donneesGlobales = result.remontees;
            initGrids();
        }
    } catch (error) {
        console.error("Erreur API:", error);
    }
}

// --- GESTION DE L'AFFICHAGE (1 CARTE PAR BIÈRE) ---
function initGrids() {
    const container = document.getElementById('references-container');
    container.innerHTML = '';

    // Extraire la liste unique des bières présentes dans la BDD
    const bieresUniques = [...new Set(donneesGlobales.map(d => d.biere))];

    bieresUniques.forEach(nomBiere => {
        // Lots pour cette bière
        const lots = donneesGlobales.filter(d => d.biere === nomBiere);
        
        const card = document.createElement('div');
        card.className = 'lot-card';

        const optionsLots = lots.map(l => `<option value="${l.lot}">Lot n°${l.lot} (Condi: ${l.condi || '?'})</option>`).join('');
        const lotParDefaut = lots[0]; // Le plus récent (car trié côté back)

        card.innerHTML = `
            <div class="lot-header">
                <h3 class="card-ref-title">${nomBiere}</h3>
                <select class="card-lot-selector">${optionsLots}</select>
            </div>
            <div class="card-body"></div>
        `;
        
        container.appendChild(card);
        
        const bodyContainer = card.querySelector('.card-body');
        const selector = card.querySelector('.card-lot-selector');
        
        const updateCardBody = (data) => {
            const decisionClass = data.Décision === 'OK' ? 'status-conforme' : 'status-non-conforme';
            bodyContainer.innerHTML = `
                <ul class="format-list">
                    <li class="format-item">
                        <span class="format-volume">Décision</span>
                        <span class="status-badge ${decisionClass}">${data.Décision || 'N/A'}</span>
                    </li>
                    <li class="format-item">
                        <span class="format-volume">pH Après</span>
                        <span style="font-weight:bold;">${data.pH_après || '-'}</span>
                    </li>
                    <li class="format-item">
                        <span class="format-volume">Carbo g/L</span>
                        <span style="font-weight:bold;">${data.Carbo_condi_gL || '-'}</span>
                    </li>
                </ul>
                <div class="lot-footer">
                    <span>Défauts :</span>
                    <span style="color:#991b1b; font-size:0.85rem;">${data.Défauts || 'Aucun'}</span>
                </div>
            `;
        };

        updateCardBody(lotParDefaut);

        selector.addEventListener('change', (e) => {
            // Attention : e.target.value est une string, on compare intelligemment
            const selectedLotData = lots.find(l => l.lot == e.target.value);
            updateCardBody(selectedLotData);
        });
    });
}

// --- GESTION DU FORMULAIRE ---
function initModal() {
    const modal = document.getElementById('modal-issue');
    const btnOpen = document.getElementById('btn-add-issue');
    const btnClose = document.querySelector('.close-modal');
    const form = document.getElementById('form-issue');

    // On préremplit la date du jour
    form.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];

    btnOpen.addEventListener('click', () => modal.classList.remove('hidden'));
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => { if(e.target === modal) modal.classList.add('hidden'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('form-feedback');
        feedback.textContent = "Envoi en cours...";
        feedback.className = "feedback-msg";

        // Collecte automatique de tous les champs du form
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/qualite/remontee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.success) {
                feedback.textContent = result.message;
                feedback.classList.add('success');
                chargerDonnees(); // Actualisation !
                setTimeout(() => {
                    modal.classList.add('hidden');
                    form.reset();
                    form.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];
                    feedback.textContent = "";
                    feedback.className = "feedback-msg";
                }, 1500);
            } else {
                feedback.textContent = result.error;
                feedback.classList.add('error');
            }
        } catch (err) {
            feedback.textContent = "Erreur serveur.";
            feedback.classList.add('error');
        }
    });
}
