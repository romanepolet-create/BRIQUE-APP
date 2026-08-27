async function chargerKPIs() {
  try {
  // On fera un appel à ton API Node.js plus tard, par exemple :
  const reponse = await fetch('/api/dashboard/kpis');
  const data = await reponse.json();
    
  if (!resultat.success) {
      console.error("Erreur renvoyée par le serveur :", resultat.error);
      return; // On arrête là si erreur
    }
    
    const data = resultat;

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
