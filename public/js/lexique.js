async function afficherSection(categorie) {
  const ecran = document.getElementById('ecran-affichage');
  //message d'attente
  ecran.innerHTML =
  "<p style='text-align: center; color: gray;'> Recherche dans les archive en cours...</p>";
  //appel au serveur
  const response = await fetch(`/api/lexique/${categorie}`);

  if (response.ok) {
    const donnees = await response.json();

    const formaterTexte = (texte) => {
      if(!texte) return "";
      return texte.replace(/([a-zA-ZÀ-ÿ_]+)\*/g, (match, motCapture) => {
        const motAffichage = motCapture.replace(/_/g,' ');
        return `<span class="wiki-link"
        onclick="ouvrirWiki('${motCapture}')">${motAffichage}*</span>`;
      });
    }

    //affiche data comme avant
    ecran.innerHTML = donnees.map(item => {
      const titrePropre = item.mot.replace(/_/g, ' ');
      const descPrincipale = formaterTexte(item.desc);

      //Niveau 1 (PA)
      let accordeon = "";
        if(item.sousCategories) {
          accordeon = `
          <div style="padding-left: 15px;
               border-left: 3px solid #ffcc00;
               margin-top: 10px;">
            ${item.sousCategories.map(sous => {
            const descFille = formaterTexte(sous.desc);

            let sousAccordeon = "";
            if (sous.sousCategories) {
              sousAccordeon = `
              <div style="padding-left: 10px; 
                          border-left: 3px solid #002ab6; 
                          margin-top: 10px;">
                 ${sous.sousCategories.map(sousSous => {
                  const descSousFille = formaterTexte(sousSous.desc);
                  return `
                   <details style="margin-bottom: 10px; 
                                   background: #eef2f7; 
                                   padding: 10px; 
                                   border-radius: 8px;">
                    <summary style="cursor: pointer; 
                           color: #002ab6; 
                           font-weight: bold; 
                           list-style: none;">
                            ▶ ${sousSous.mot.replace(/_/g, ' ')}
                           </summary>
                    <p style="font-size: 0.9em; 
                            margin-top: 8px;">${descSousFille}</p>
                  </details>
                   `;
                  }).join('')}
                </div>`;
               }

             return `
             <details style="margin-bottom: 15px; 
                             background: #f4f6f9; 
                             padding: 10px; 
                             border-radius: 8px; 
                             border-left: 3px solid #ffcc00;">
             <summary style="cursor: pointer; 
                             color: #002ab6; 
                             font-weight: bold; 
                             list-style: none; 
                             font-size: 1.1em;">
                             ▶ ${sous.mot.replace(/_/g, ' ')}
                             </summary>
      

                  <div style="margin-top: 10px;padding-left: 10px">
                    <p style="font-size: 0.95em;">${descFille}</p>
                ${sousAccordeon}
                </div>
              </details>`;
            }).join('')}
          </div>`;
          }
          return `
           <div class="definition">
             <h3 class="mot-cle" 
                 style="color:#002ab6; 
                 margin-bottom: 10px;">${titrePropre}</h3>
             <p>${descPrincipale}</p>
             ${accordeon}
           </div>
         `;
       }).join('');
    } else {
   //si erreur (fichier json manquant
    ecran.innerHTML = "<p style='color:red:'> Erreur: Impossible d'ouvrir ce chapitre.</p>";
  }
}
// --- FONCTIONS DU POPUP WIKI ---


