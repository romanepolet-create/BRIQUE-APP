async function chargerKPIs() {
  try {
  const reponse = await fetch('/api/dashboard/kpis');
  const resultat = await reponse.json();
    
  if (!resultat.success) {
      console.error("Erreur renvoyée par le serveur :", resultat.error);
      return;
    }
    
    const data = resultat;

    const titre = document.getElementById('titre-commercial');
    if (titre) titre.textContent = `Résumé de l'activité de ${data.emailCommercial}`;

    document.getElementById('kpi-visites').textContent = data.visites;
                
    const dnGagnee = data.dnFinale - data.dnInitiale;
    const dnSigne = dnGagnee >= 0 ? `+${dnGagnee}` : dnGagnee;
    document.getElementById('kpi-dn').textContent = `+${dnGagnee}`;
    document.getElementById('evo-dn').textContent = `Base : ${data.dnInitiale} ➔ ${data.dnFinale}`;

    document.getElementById('kpi-mea').textContent = data.meaHl + ' HL';
    document.getElementById('kpi-directs').textContent = data.nbDirects;

  } catch(err) {
    console.error("Erreur chargement KPIs", err);
  }
}

document.addEventListener("DOMContentLoaded", chargerKPIs);
