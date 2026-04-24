async function chargerBieres() {
  const response = await fetch('/api/bieres');
  const bieres = await response.json();
  const container = document.getElementById('liste');

  const groupees = bieres.reduce((acc, b) => {
    const nomPropre = b.id.replace(/(33cl|75cl|CAN 44cl)/i, '').trim();

    if (!acc[nomPropre]) acc[nomPropre] = [];
    acc[nomPropre].push(b);
    return acc;
  }, {});

  container.innerHTML = Object.entries(groupees).map(([nom, formats]) => `
    <div class="card">
    <h3>${nom}</h3>
    <p>${formats[0].type}</p>
    <p class="degre">${formats[0].degre}%</p>
    <hr style="border: 0.5px solid #444; margin: 15px 0;">
    <div style="text-align: left;">
    ${formats.map(f => `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <span style="font-size: 0.9em;">${f.id.split(' ').pop()}: <strong>${f.prix}€</strong></span>
    <button onclick="voirDetails('${f.id}')" style="cursor: pointer; background:#ffcc00; border: none; padding: 4px 8px; border-radius: 4px; font-weight:bold;">i</button>
    </div>
    `).join('')}
    </div>
    </div>
  `).join('');
}
chargerBieres();

async function voirDetails(id) {
  const response = await fetch(`/api/bieres/${id}`);
  const biere = await response.json();

  if(response.ok) {
   alert(`Focus sur : ${biere.id}\nType : ${biere.type}\nDegré : ${biere.degre}%\nPrix HT par carton de ${biere.nombre} : ${biere.prix}€\nPMC : ${biere.PMC}€`);
  } else {
  alert(biere.erreur);
  }
}
