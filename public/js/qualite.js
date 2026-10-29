const lotsData = [
    {
        reference: "La Bagarre",
        lot: "26092",
        formats: {
            "33cl": "ND",
            "44cl": "Conforme",
            "75cl": "ND",
            "20L": "Conforme"
        },
        remontees: 0
    },
    {
        reference: "Blonde Ale",
        lot: "26093",
        formats: {
            "33cl": "Conforme",
            "44cl": "ND",
            "75cl": "Non Conforme",
            "20L": "Conforme"
        },
        remontees: 2
    }
];

function getStatusClass(status) {
    const stat = status.toLowerCase();
    if (stat === 'conforme') return 'status-conforme';
    if (stat === 'nd') return 'status-nd';
    return 'status-non-conforme';
}

function renderLots() {
    const container = document.getElementById('lots-container');
    container.innerHTML = '';

    lotsData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'lot-card';

        let formatsHtml = '';
        for (const [format, statut] of Object.entries(item.formats)) {
            formatsHtml += `
                <li class="format-item">
                    <span class="format-volume">${format}</span>
                    <span class="status-badge ${getStatusClass(statut)}">${statut}</span>
                </li>
            `;
        }

        card.innerHTML = `
            <div class="lot-header">
                <h2>${item.reference}</h2>
                <span class="lot-number">Lot n°${item.lot}</span>
            </div>
            <ul class="format-list">
                ${formatsHtml}
            </ul>
            <div class="lot-footer">
                <span>Remontées client :</span>
                <span class="remontees-count ${item.remontees > 0 ? 'alert' : 'ok'}">${item.remontees}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', renderLots);
