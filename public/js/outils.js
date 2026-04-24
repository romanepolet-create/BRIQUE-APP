function lierTexte(texte) {
  if (!texte) return "";
  return texte.replace(/([a-zA-ZÀ-ÿ_]+)\*/g, (match, motCapture) => {
    const motAffichage = motCapture.replace(/_/g, ' ');
    return `<span class="wiki-link" onclick="ouvrirWiki('${motCapture}')">${motAffichage}*</span>`;
  });
}

async function ouvrirWiki(motClique) {
  const motAffichage = motClique.replace(/_/g, ' ');
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('modal').style.display = 'block';
  document.getElementById('modal-titre').innerText = `Recherche de "${motAffichage}"...`;
  document.getElementById('modal-desc').innerText = "Veuillez patienter...";

  try {
    const motSecurise = encodeURIComponent(motClique);
    const response = await fetch(`/api/lexique/recherche/${motClique}`);
    if(response.ok) {
      const data = await response.json();
      document.getElementById('modal-titre').innerText = data.mot;
      document.getElementById('modal-desc').innerHTML = lierTexte(data.desc);
    } else {
      document.getElementById('modal-titre').innerText = "Oups !";
      document.getElementById('modal-desc').innerText = `Aucune définition trouvée pour le mot "${motAffichage}".`;
    }
  } catch (erreur) {
    console.error("Erreur du fetch:", erreur);
    document.getElementById('modal-titre').innerText = "Erreur";
    document.getElementById('modal-desc').innerText = "Impossible de joindre le serveur.";
  }
}

function fermerWiki() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('modal').style.display = 'none';
}
