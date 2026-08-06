async function chargerKPIs() {
  try {
  // On fera un appel à ton API Node.js plus tard, par exemple :
  // const reponse = await fetch('/api/dashboard/kpis');
  // const data = await reponse.json();
  // POUR L'INSTANT : Fausse donnée pour tester le design
    const data = {
      visites: 42,
      visitesM1: 38,
      dnInitiale: 120,
      dnFinale: 135,
      meaHl: 15.5,
      meaHlM1: 18.0,
      nbDirects: 14
    };

  // Mise à jour de l'HTML
    document.getElementById('kpi-visites').textContent = data.visites;
                
    const dnGagnee = data.dnFinale - data.dnInitiale;
    document.getElementById('kpi-dn').textContent = `+${dnGagnee}`;
    document.getElementById('evo-dn').textContent = `Base : ${data.dnInitiale} ➔ ${data.dnFinale}`;

    document.getElementById('kpi-mea').textContent = data.meaHl + ' HL';
    document.getElementById('kpi-directs').textContent = data.nbDirects;

  } catch(err) {
    console.error("Erreur chargement KPIs", err);
  }
}

document.addEventListener("DOMContentLoaded", chargerKPIs);
