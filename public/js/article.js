function copierInfo(bouton, texte) {
  navigator.clipboard.writeText(texte).then(() => {
    const texteOriginal = bouton.innerHTML;

    bouton.innerHTML = "✅ Copié !";
    bouton.style.backgroundColor = "#4CAF50";
    bouton.style.color = "white";

    setTimeout(() => {
      bouton.innerHTML = texteOriginal;
      bouton.style.backgroundColor = "";
      bouton.style.color = "";
    }, 1500);
  }).catch(err => {
    console.error('Erreur lors de la copie : ', err);
  });
}

function genererPanneauSaisie(biere) {
  if (!biere) return "";

  return `
    <div class="panneau-saisie">
      <p style="margin-top: 0; font-size: 0.9em; color: #666;">
        <b>⚡ Station de saisie rapide :</b> Cliquez sur une info pour la copier.
      </p>
      <div class="badges-saisie">
        <button onclick="copierInfo(this, '${biere.id}')">🍺 Nom: <b>${biere.id}</b></button>
        <button on onclick="copierInfo(this, '${biere.codeArticleFournisseur}')">📦 Code Frs: <b>${biere.codeArticleFournisseur}</b></button>
        <button onclick="copierInfo(this, '${biere.UVC.Gencod}')">🛒 Gencod UVC: <b>${biere.UVC.Gencod}</b></button>
        <button onclick="copierInfo(this, '${biere.UD.Gencod}')">📦 Gencod Carton: <b>${biere.UD.Gencod}</b></button>
        <button onclick="copierInfo(this, '${biere.Nomenclature}')">⚖️ Douanes: <b>${biere.Nomenclature}</b></button>
        <button onclick="copierInfo(this, '${biere.UVC.poids}')">⚖️ Poids UVC: <b>${biere.UVC.poids} kg</b></button>
        <button onclick="copierInfo(this, '${biere.UVC.long}x${biere.UVC.larg}x${biere.UVC.hauteur}')">📏 Dim UVC: <b>${biere.UVC.long}x${biere.UVC.larg}x${biere.UVC.hauteur}</b></button>
      </div>
    </div>
  `;
}

