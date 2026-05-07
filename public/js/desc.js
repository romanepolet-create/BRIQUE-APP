async function afficher(idBiere) {
  const ecran = document.getElementById('ecran-affichage');
  ecran.innerHTML = "<p style='text-align: center; color: gray;'>Recherche dans le glossaire en cours...</p>";

  try {
   // 1. On va lire le fichier JSON local en entier
    const response = await fetch('/api/lexique/desc');

    if (response.ok) {
      const toutesLesBieres = await response.json();
                              
      // 2. On fouille dans le tableau pour trouver la bière qui correspond au bouton cliqué (ex: 'LB')
      const biere = toutesLesBieres.find(b => b.id === idBiere);

      if (biere) {
        // 3. On construit l'affichage HTML
        let html = `<div class="definition">`;

        const titrePropre = biere.b.replace(/_/g, ' ');
        html +=`
        <div style="position: relative ; border-bottom: 3px solid #e67e22">
        <a class="mot-cle" 
           href="/images/pdf/${biere.id}.pdf" 
           target="_blank" 
           download style="background-color: #002ab6; 
                           color: white; 
                           padding: 5px 8px; 
                           margin-right: 5px;
                           border-radius: 8px; 
                           text-decoration: none; 
                           font-weight: bold; 
                           font-family: 'Lexend Deca', sans-serif; 
                           font-size: 0.9em; 
                           box-shadow: 0 4px 6px rgba(0,0,0,0.1);">📥</a>

        <h2 class="mot-cle">${titrePropre}</h2>
                </div> `;
        
        if (biere.détail) html += `
        <div>
        <p style="font-size: 0.9em; color: gray;"><em>${biere.détail}</em></p>`;
        if (biere.desc) html += `<p><strong>${lierTexte(biere.desc)}</strong></p>`;
        if (biere.type) html += `<p>${lierTexte(biere.type)}</p>`;
        if (biere.ie) html += `<p>${lierTexte(biere.ie)}</p>`;
        if (biere.app) html += `<p>${lierTexte(biere.app)}</p>`;
        if (biere.nez) html += `<p>${lierTexte(biere.nez)}</p>`;
        if (biere.bouche) html += `<p>${lierTexte(biere.bouche)}</p>`;
        if (biere.houblon) html += `<p>${lierTexte(biere.houblon)}</p>
        <div>
        `;
        
        html += `</div>`;

        ecran.innerHTML = html;
 
      } else {
        ecran.innerHTML = "<p style='color:red;'>Erreur: Impossible de lire le fichier desc.json.</p>";
      }
    } else {
      ecran.innerHTML = "<p style='color:red;'>Erreur: Cette bière n'est pas dans l'encyclopédie.</p>";
    }
  } catch (erreur) {
    console.error(erreur);
    ecran.innerHTML = "<p style='color:red;'>Erreur de chargement.</p>";
  }
}
