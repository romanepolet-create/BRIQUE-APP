let listeInitialeChargee = false;

function formatEmailToName(email) {
    if (!email || email === 'general') return "Général";
    const namePart = email.split('@')[0]; 
    const parts = namePart.split('.'); 
    return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
}

async function chargerKPIs(filtreRequis = 'general') {
  try {
    const reponse = await fetch(`/api/dashboard/kpis?filtre=${filtreRequis}`);
    const data = await reponse.json();
    
    if (!data.success) {
      console.error("Erreur renvoyée par le serveur :", data.error);
      return;
    }
    
    const nomAffiche = filtreRequis === 'general' ? 'Général' : formatEmailToName(filtreRequis);
    document.getElementById('titre-commercial').textContent = `Résumé de l'activité : ${nomAffiche}`;

    const selectFiltre = document.getElementById('filtre-commercial');
    if (!listeInitialeChargee) {
      selectFiltre.innerHTML = '';
        
      selectFiltre.add(new Option('🌍 Général (Tous)', 'general'));

      if (data.isAdmin) {
        data.listeCommerciaux.forEach(email => {
            selectFiltre.add(new Option(`👤 ${formatEmailToName(email)}`, email));
        });
      } else {
        selectFiltre.add(new Option(`👤 Mon activité (${formatEmailToName(data.emailConnecte)})`, data.emailConnecte));
      }

      selectFiltre.value = filtreRequis;
      selectFiltre.addEventListener('change', (e) => {
        chargerKPIs(e.target.value);
      });

      listeInitialeChargee = true;
    }

    document.getElementById('kpi-visites').textContent = data.visites;
                
    const dnGagnee = data.dnFinale - data.dnInitiale;
    const dnSigne = dnGagnee >= 0 ? `+${dnGagnee}` : dnGagnee;
    document.getElementById('kpi-dn').textContent = dnSigne;
    document.getElementById('evo-dn').textContent = `Base : ${data.dnInitiale} ➔ ${data.dnFinale}`;

    document.getElementById('kpi-mea').textContent = data.meaHl + ' HL';
    document.getElementById('kpi-directs').textContent = data.nbDirects;

  } catch(err) {
    console.error("Erreur chargement KPIs", err);
  }
}

document.addEventListener("DOMContentLoaded", () => chargerKPIs('general'));
