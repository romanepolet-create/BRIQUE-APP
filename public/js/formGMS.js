// Fonction pour extraire les paramètres de l'URL
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id_hubspot: params.get('id_hubspot') || '',
    nom: params.get('nom') || 'Magasin Inconnu',
    enseigne: params.get('enseigne') || 'Inconnue'
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const infos = getURLParams();
  
  document.getElementById('hubspot_id').value = infos.id_hubspot;
  document.getElementById('nom_magasin').value = infos.nom;
  document.getElementById('enseigne').value = infos.enseigne;

  document.getElementById('store-info-badges').innerHTML = `
    <span class="info-badge">🏪 ${infos.enseigne}</span>
    <span class="info-badge">🆔 ${infos.id_hubspot || 'N/A'}</span>
  `;

  // Ici tu pourras appeler une fonction pour générer la matrice des bières selon infos.enseigne
  // genererMatriceProduits(infos.enseigne);
});

// Gérer l'affichage conditionnel de la section MEA
function toggleMEAFields() {
  const status = document.getElementById('mea_status').value;
  const detailsDiv = document.getElementById('mea_details');
  
  if (status === 'OUI') {
    detailsDiv.style.display = 'block';
  } else {
    detailsDiv.style.display = 'none';
  }
}

// Fonction fictive de soumission (à relier à ton backend / Google Sheets / Zapier / Make)
function soumettreFormulaire() {
  // Logique d'envoi des données + nommage de la photo (avec la date et code unique)
  alert("Le système d'envoi vers Google Sheets / Drive sera branché ici !");
}
