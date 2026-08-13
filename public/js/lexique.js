async function afficherSection(categorie) {
  const ecran = document.getElementById('ecran-affichage');
  //message d'attente
  ecran.innerHTML =
  "<p id='pappelserv'> Recherche dans les archive en cours...</p>";
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
          <div class="souscat">
            ${item.sousCategories.map(sous => {
            const descFille = formaterTexte(sous.desc);

            let sousAccordeon = "";
            if (sous.sousCategories) {
              sousAccordeon = `
              <div class="souscat2">
                 ${sous.sousCategories.map(sousSous => {
                  const descSousFille = formaterTexte(sousSous.desc);
                  return `
                   <details id="detsousSous">
                    <summary id="sumsousSous">▶ ${sousSous.mot.replace(/_/g, ' ')}</summary>
                    <p id="psousSous">${descSousFille}</p>
                  </details>
                   `;
                  }).join('')}
                </div>`;
               }

             return `
             <details id="detsous">
               <summary id="sumsous">▶ ${sous.mot.replace(/_/g, ' ')}</summary>
               <div id="descfille">
                 <p id="pdescfille">${descFille}</p>
                 ${sousAccordeon}
               </div>
             </details>`;
            }).join('')}
          </div>`;
          }
          return `
           <div class="definition">
             <h3 class="mot-cle">${titrePropre}</h3>
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


