document.addEventListener('DOMContentLoaded', async() => {
      const urlParams = new URLSearchParams(window.location.search);
      const hubspot_id = urlParams.get('id_hubspot');

      if(!hubspot_id) return ;

      try { const resConfig = await fetch('/api/config');
      const config = await resConfig.json();
      const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
           
      const { data, error } = await supabase
        .from('historique_visites')
        .select('*')
        .eq('hubspot_id', hubspot_id)
        .maybeSingle();

      if (data) {
        const inputCanettes = document.getElementById('nb_canettes');
        const inputCave = document.getElementById('nb_cave');
        if(inputCanettes) inputCanettes.value = data.nb_canettes;
        if(inputCave) inputCave.value = data.nb_cave;

        setTimeout(() => {
        if (data.references) {
          for (const [key, value] of Object.entries(data.references)) {
            const checkbox = document.querySelector(`input[name="${key}"]`);
            if (checkbox) {
              const estCocheBDD = (value === "OUI" || value === "Gagné" || value === "Constaté");
              checkbox.checked = estCocheBDD;
              checkbox.dataset.initial = estCocheBDD ? 'true' : 'false';

            }
          }
        }
        }, 100);

        setTimeout(() => {
          if (data.presence_chef) {
              let presence = data.presence_chef;
              if (typeof presence === 'string') presence = JSON.parse(presence);
              ['LUN', 'MAR', 'MER', 'JEU', 'VEN'].forEach(jour => {
                  if (presence[jour]) {
                      const cbAM = document.querySelector(`input[name="pres_${jour}_AM"]`);
                      const cbPM = document.querySelector(`input[name="pres_${jour}_PM"]`);
                      if (cbAM) cbAM.checked = presence[jour].AM;
                      if (cbPM) cbPM.checked = presence[jour].PM;
                  }
              });
          }

          if (data.details_produits) {
              let details = data.details_produits;
              if (typeof details === 'string') details = JSON.parse(details);
              for (const [key, detail] of Object.entries(details)) {
                  const niv = document.getElementById(`niv_${key}`);
                  const fac = document.getElementById(`fac_${key}`);
                  const rpt = document.getElementById(`rpt_${key}`);
                  const cbMain = document.querySelector(`input[name="${key}"]`);
                  
                  if (cbMain && cbMain.checked) {
                      const divDetails = document.getElementById(`details_${key}`);
                      if (divDetails) divDetails.style.display = 'flex';
                      
                      if (niv) niv.value = detail.niveau || "";
                      if (fac) fac.value = detail.facings || "";
                      if (rpt) rpt.checked = (detail.rupture === "OUI");
                  }
              }
          }
        }, 150);
        
        console.log("Historique chargé avec succès !");
      }
    } catch (err) {
      console.error("Impossible de charger l'historique :", err);
    }
  });
