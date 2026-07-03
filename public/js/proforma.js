// ==========================================
// MOTEUR PROFORMA (FRONT-END)
// ==========================================

// 🚨 CES DEUX LIGNES AVAIENT DISPARU : ELLES SONT INDISPENSABLES 🚨
let modeProforma = false;
let panierProforma = {}; 

// 1. On injecte l'interface (Bouton rouge + Panneau)
document.addEventListener("DOMContentLoaded", () => {
    const uiHTML = `
        <button id="btn-toggle-proforma" onclick="toggleModeProforma()" style="position: fixed; bottom: 20px; left: 20px; background-color: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 1000;">
            📄 Créer une Proforma
        </button>

        <div id="panneau-panier-proforma" style="display: none; position: fixed; bottom: 80px; left: 20px; width: 300px; background: white; border: 2px solid #002ab6; border-radius: 10px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 1000; max-height: 60vh; overflow-y: auto;">
            <h3 style="margin-top: 0; color: #002ab6;">🛒 Vos références</h3>
            <div id="liste-panier-proforma">
                <p style="color: gray; font-size: 0.9em;">Appuyez sur les '+' bleus pour ajouter des bières.</p>
            </div>
            <button onclick="validerProforma()" style="width: 100%; margin-top: 15px; background-color: #27ae60; color: white; border: none; padding: 10px; border-radius: 5px; font-weight: bold; cursor: pointer;">
                ✅ OK (Générer Excel)
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', uiHTML);
});

// 2. Allumer/éteindre le mode
window.toggleModeProforma = function() {
    modeProforma = !modeProforma;
    const btn = document.getElementById('btn-toggle-proforma');
    const panneau = document.getElementById('panneau-panier-proforma');
    const boutonsPlus = document.querySelectorAll('.btn-plus-proforma');

    if (modeProforma) {
        btn.style.backgroundColor = "#27ae60";
        btn.innerText = "❌ Quitter le mode Proforma";
        panneau.style.display = "block";
        boutonsPlus.forEach(b => b.style.display = "inline-block");
    } else {
        btn.style.backgroundColor = "#e74c3c";
        btn.innerText = "📄 Créer une Proforma";
        panneau.style.display = "none";
        boutonsPlus.forEach(b => b.style.display = "none");
    }
};

// 3. Ajouter 1 au panier (Bouton '+')
window.ajouterAuPanier = function(idBiere) {
    panierProforma[idBiere] = (panierProforma[idBiere] || 0) + 1;
    afficherPanier();
};

// 4. Saisie manuelle de la quantité
window.changerQtePanier = function(idBiere, qte) {
    const val = parseInt(qte);
    if (isNaN(val) || val <= 0) {
        delete panierProforma[idBiere];
    } else {
        panierProforma[idBiere] = val;
    }
    afficherPanier();
};

// 5. Mettre à jour l'affichage du panneau
window.afficherPanier = function() {
    const conteneur = document.getElementById('liste-panier-proforma');
    
    if (Object.keys(panierProforma).length === 0) {
        conteneur.innerHTML = "<p style='color: gray; font-size: 0.9em;'>Le panier est vide.</p>";
        return;
    }

    let html = "";
    setOuterBorder(donnees, 21, 0, 21, 14);

    
    for (const [idBiere, qte] of Object.entries(panierProforma)) {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 8px 0;">
                <span style="font-size: 0.9em; flex: 1;">${idBiere}</span>
                <input type="number" value="${qte}" onchange="changerQtePanier('${idBiere}', this.value)" style="width: 50px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
            </div>
        `;
    }
    conteneur.innerHTML = html;
};


//=========================================
// GÉNÉRATION EXCEL (Le bouton OK)
//=========================================

window.validerProforma = async function() {
    if (Object.keys(panierProforma).length === 0) {
        alert("La proforma est vide !");
        return;
    }

    const btn = document.querySelector('#panneau-panier-proforma button');
    btn.innerText = "⏳ Génération...";

    try {
        const [resBieres, resProforma] = await Promise.all([
            fetch('/api/bieres'),
            fetch('/api/proforma') 
        ]);

        const bieresDB = await resBieres.json();
        const proformaDB = await resProforma.json();

       
        //STYLES

        const sBord = {
          top: {style:"medium"}, bottom: {style: "medium"},
          left: {style: "medium"}, right: {style: "medium"}
        };

        const sEnteteBleu = {
          font: {
            name: "Lexend Deca", 
            sz: 10, 
            bold: true, 
            color: {rgb: "FFFFFF"}
          }, fill: {
            fgColor: { rgb: "002AB6" }
          }, alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true 
          } 
        };

        const sTitreSection = {
          font : {
            name: "Lexend Deca",
            sz: 11,
            bold: true,
            color: { rgb: "002AB6" }
          }, fill: { fgColor: { rgb: "F3B0CF"}
          }, alignment: {vertical: "center"
          }
        };

        const sNormal = { 
          font: {
            name: "Lexend Deca",
            sz: 10
          }
        };

        const sParagraphe = {
          font: {
            name: "Lexend Deca",
            sz: 9
          }, alignment: {horizontal: "left",
                         vertical: "top",
                         wrapText: true
                        }
        };

        const sReste = {
          font: {
            name: "Lexend Deca",
            sz: 10
          }, alignment: {horizontal: "center", vertical: "center"}
        };


        const sGras = {
          font: {
            name: "Lexend Deca",
            sz: 9,
            bold: true
          } 
        };

        const sChiffre = {
          font: {
            name: "Lexend Deca",
            sz: 9
          }, alignment: {horizontal: "right"
          }, numFmt: "0.00"
        };

        const sAdresse = {
          font: {
            name: "Lexend Deca",
            sz: 10},
          alignment: {
            horizontal: "right",
            vertical: "bottom"}
        };

        const donnees = Array(150).fill(null).map(() => Array(15).fill(null).map(() => ({v: "", s: {}})));
        const merges = [];

        const setCell = (r, c, v, s) => { 
          if (!donnees[r] || !donnees[r][c]) return;
          if (typeof v === "string" && !isNaN(v) && v !== "") {
              donnees[r][c].v = Number(v);
          } else {
            donnees[r][c].v = v;
          }
          if (s) Object.assign(donnees[r][c].s, s);
        };

        
        function setOuterBorder(grille, r1, c1, r2, c2, style = 'thin') {
         for (let r = r1; r <= r2; r++) {
           for (let c = c1; c <= c2; c++) {
             if (!grille[r][c]) grille[r][c] = { v: "", s: {} };
             if (!grille[r][c].s) grille[r][c].s = {};
             if (!grille[r][c].s.border) grille[r][c].s.border = {};

             const bord = grille[r][c].s.border;
             grille[r][c].s.border = {
               top:    r === r1 ? { style } : bord.top,
               bottom: r === r2 ? { style } : bord.bottom,
               left:   c === c1 ? { style } : bord.left,
               right:  c === c2 ? { style } : bord.right
             };
           }
         }
       }

//=================================
//PREPARATION GRILLE
//=================================
      //EN TETE
      setCell(0, 0,'Commande Proforma n°',{font: {bold: true, sz:10, color: "black"}});
      setCell(0, 2, '...................................................', {font: {sz: 10}});
      setCell(0, 10,'BRIQUE HOUSE BREWERY',{font:{bold: true, sz:14}});
      
      //ADRESSES
      setCell(5, 0, 'ADRESSE DE LIVRAISON', sAdresse, sBord);
      setCell(9, 0, 'ADRESSE DU SIEGE SOCIAL', sAdresse, sBord);
      setCell(5, 7, 'ADRESSE DE FACTURATION', sAdresse, sBord);

      //INFOS DOC
              
        const dateAujourdhui = new Date().toLocaleDateString('fr-FR');
        const d = new Date(); d.setMonth(d.getMonth() + 1);
        const dateEcheance = d.toLocaleDateString('fr-FR');
        const libre = "..........................................................."
      //Question
      setCell(14, 0, "N° de document", sNormal);
      setCell(15, 0, "Date", sNormal);
      setCell(16, 0, "N° de client", sNormal);
      setCell(17, 0, "Mode de paiement", sNormal);
      setCell(18, 0, "Date d'échéance", sNormal);
      setCell(19, 0, "Code Magasin", sNormal);
      //---
      setCell(14, 7, "Commande n°", sNormal)
      setCell(15, 7, "Votre Interlocuteur", sNormal);
      setCell(16, 7, "", sNormal);
      setCell(17, 7, "Votre référence", sNormal);
      setCell(18, 7, "Mode de livraison", sNormal);
      setCell(19, 7, "N° de TVA", sNormal);
      //Réponse
      setCell(14, 2, libre, sNormal);
      setCell(15, 2, dateAujourdhui, sNormal);
      setCell(16, 2, libre, sNormal);
      setCell(17, 2, libre, sNormal);
      setCell(18, 2, dateEcheance, sNormal);
      setCell(19, 2, libre, sNormal);
      //---
      setCell(14, 12, libre, sNormal);
      setCell(15, 12, libre, sNormal);
      setCell(16, 12, "", sNormal);
      setCell(17, 12, libre, sNormal);
      setCell(18, 12, libre, sNormal);
      setCell(19, 12, libre, sNormal);

//TABLEAU DE PRODUITS
      const colonnes = [
        "N°", 
        "Désignation", 
        "",
        "Qté", 
        "Unité", 
        "Qté UV",
        "P.U. brut HT", 
        "Montant brut HT", 
        "TVA", 
        "Degré",
        "Vol. unité", 
        "Accises", 
        "Ecotaxe", 
        "P.U. net", 
        "Total HT"
      ]
      colonnes.forEach((txt, i) => setCell(21, i, txt, sEnteteBleu, sBord));

        let totalHT = 0;
        let totalAccises = 0;
        let totalEco = 0;
        let ligneIdx = 22;

        for (const [id, qte] of Object.entries(panierProforma)) {
            const cleanId = id.trim().toLowerCase();
            const biere = bieresDB.find(b => b.id.trim().toLowerCase() === cleanId);
            const finance = proformaDB.find(p => 
                p.id.trim().toLowerCase() === cleanId || 
                p.designation.trim().toLowerCase() === cleanId
        );

            if (biere && finance) {
                const qteUV = qte * biere.nombre;
                const vol = id.includes("75cl")?0.75 : (id.includes("44cl") ? 0.44 : 0.33);
                const mntBrut = qteUV * finance.PUbrutHT
                const mntAccise = qteUV * finance.accise;
                const mntEco = qteUV * finance.eco;
                const mntNet = qteUV * finance.PUnetHTVA
                

           
                totalHT += mntNet ;
                totalAccises += mntAccise;
                totalEco += mntEco;

                const ligne = [
                  ligneIdx - 22,
                  finance.designation,
                  "",
                  qte, 
                  "cartons", 
                  qteUV,
                  finance.PUbrutHT, 
                  mntBrut.toFixed(2), 
                  "01", 
                  biere.degre + "°",
                  vol, 
                  mntAccise.toFixed(2), 
                  mntEco.toFixed(2), 
                  finance.PUnetHTVA, 
                  mntNet.toFixed(2)
                ];
                ligne.forEach((val, i) => setCell(ligneIdx, i, val, sNormal));
                merges.push({s: {r: ligneIdx, c: 1}, e: {r: ligneIdx, c: 2}});
                ligneIdx++;
            }
        }

        const unVvingt = totalHT * 1.20
        const vingtPcent = totalHT * 0.20


        const rTT = ligneIdx + 1;
        setCell(rTT, 1, "TOTAL", sGras);
        setCell(rTT, 11, totalAccises.toFixed(2), sChiffre);
        setCell(rTT, 12, totalEco.toFixed(2), sChiffre);
        setCell(rTT, 14, totalHT.toFixed(2), sChiffre);

        const rT = rTT+1;

//===========
//TABLEAU TVA
//===========
        
        //TVA
        setCell(rT+1, 0, "TVA", sEnteteBleu, sBord)
        //Base
        setCell(rT+2, 0,"BASE", sGras, sBord)
        //=029
        setCell(rT+3, 0, totalHT.toFixed(2), sChiffre)
        //=SOMME soit =A33
        setCell(rT+5, 0, totalHT.toFixed(2), sChiffre, sBord)
        //=SOMME soit =D33
        setCell(rT+5, 3, vingtPcent.toFixed(2), sChiffre, sBord)
        //Taux
        setCell(rT+2, 1, "Taux", sNormal, sBord)
        //01
        setCell(rT+3, 1, "01", sNormal)
        //20(%)
        setCell(rT+3, 2, 20, sNormal)
        //Montant
        setCell(rT+2, 3, "Montant", sNormal, sBord)
        //=A33*C33
        setCell(rT+3, 3, vingtPcent.toFixed(2), sChiffre)
       
//============
//TABLEAU AUTRES TAXES
//============


        //Autres Taxes
        setCell(rT+1, 6, "Autres Taxes", sEnteteBleu, sBord);
        //Taxes Accises
        setCell(rT+2, 6, "Taxes Accises", sNormal);
        //=L29
        setCell(rT+2, 8, totalAccises.toFixed(2) , sChiffre);
        //Eco-Taxes
        setCell(rT+3, 6, "Eco-Taxes", sNormal);
        //=M29
        setCell(rT+3, 8, totalEco.toFixed(2), sChiffre);

//================
//TABLEAU RESUME
//================

        //Total HT EUR
        setCell(rT+2, 11, "Total HT EUR", sNormal, sBord);
        //TVA
        setCell(rT+3, 11, "TVA", sNormal, sBord)
        //Total TTC EUR
        setCell(rT+4, 11, "Total TTC EUR", sBord);
        //=O29
        setCell(rT+2, 13, totalHT.toFixed(2), sChiffre, sBord);
        //=D39
        setCell(rT+3, 13, vingtPcent.toFixed(2), sChiffre, sBord);
        //=SOMME
        setCell(rT+4, 13, unVvingt.toFixed(2), sChiffre, sBord);


//==============
//TABLEAU PAIEMENT
//==============
        //Paiement
        setCell(rT+6, 11, "PAIEMENT", sEnteteBleu, sBord);
        //rep IBAN
        setCell(rT+7, 12, libre, sNormal, sBord);
        //rep BIC
        setCell(rT+8, 12, libre, sNormal, sBord)
        //Date d'échéance
        setCell(rT+9, 11, "Date d'échéance", sNormal, sBord);
        //=C20
        setCell(rT+9, 13, dateEcheance, sNormal, sBord);
        //IBAN
        setCell(rT+7, 11, "IBAN", sNormal, sBord);
        //BIC
        setCell(rT+8, 11, "BIC", sNormal, sBord);


//===============
//LE RESTE
//===============

        const texteLegal = [
        "Toute commande passée à notre société est soumise à nos conditions générales de vente.",
        "Réserve de propriété : en application des dispositions de la loi n°80.335 du 12 mai 1980, les biens vendus demeurent la propriété du vendeur jusqu'à complet paiement",
        "Aucun escompte ne sera accordé en cas de paiement anticipé.",
        "Une indemnité pour frais de recouvrement de 40 EUR et des intérêts de retard (3 fois le taux d'intérêt légal) sont décomptés dès le lendemain de l'échéance de la facture." ].join('\n');

        //Paragraphe
        setCell(rT+11, 0, texteLegal, sParagraphe);                     

        //BHB - 91...
        setCell(rT+15, 0, "BRIQUE HOUSE BREWERY -  91 Rue de la Croix Waresquel - 59273 FRETIN - tel : 06 30 90 97 05", sReste);
        //SIRET...
        setCell(rT+16, 0, "SIRET : 85055928700014 - N° TVA : FR 44 850 559 287 - ACTIVITE (NAF / APE) : 1105Z - Fabrication de bière", sReste);



      setOuterBorder(donnees, 5, 0, 8, 5); // Bloc: ADRESSE DE LIVRAISON
      setOuterBorder(donnees, 9, 0, 12, 5); // Bloc: ADRESSE DU SIEGE SOCIAL
      setOuterBorder(donnees, 5, 7, 12, 14); // Bloc: ADRESSE DE FACTURATION
      setOuterBorder(donnees, 14, 0, 19, 14); // Bloc: INFOS DOC (N° client, Date, etc.)

      // --- CADRES DU TABLEAU PRINCIPAL ---
      setOuterBorder(donnees, 21, 0, 21, 14); // Cadre autour de l'En-tête bleu des produits
      setOuterBorder(donnees, 22, 0, ligneIdx - 1, 14); // Cadre autour de la liste des bières
      setOuterBorder(donnees, rTT, 0, rTT, 14); // Cadre autour de la ligne TOTAL

      // --- CADRES DES TOTAUX ET PAIEMENT ---
      setOuterBorder(donnees, rT + 1, 0, rT + 5, 4); // Bloc: TVA
      setOuterBorder(donnees, rT + 1, 6, rT + 3, 9); // Bloc: AUTRES TAXES
      setOuterBorder(donnees, rT + 2, 11, rT + 4, 14); // Bloc: RESUME TTC
      setOuterBorder(donnees, rT + 6, 11, rT + 9, 14); // Bloc: PAIEMENT

      merges.push(       
        {s: {r: 0, c: 0}, e: {r: 1, c: 1}},
        {s: {r: 0, c: 2}, e: {r: 1, c: 4}},
        {s: {r: 0, c: 10}, e: {r: 1, c: 13}},
        {s: {r: 5, c: 0}, e: {r: 8, c: 5}},
        {s: {r: 9, c: 0}, e: {r: 12, c: 5}},
        {s: {r: 5, c: 7}, e: {r: 12, c: 14}},
        //
        {s: {r: 14, c: 0}, e: {r: 14, c: 1}},
        {s: {r: 14, c: 2}, e: {r: 14, c: 5}},
        {s: {r: 14, c: 7}, e: {r: 14, c: 11}},
        {s: {r: 14, c: 12}, e: {r: 14, c: 14}},
        {s: {r: 15, c: 0}, e: {r: 15, c: 1}},
        {s: {r: 15, c: 2}, e: {r: 15, c: 5}},
        {s: {r: 15, c: 7}, e: {r: 15, c: 11}},
        {s: {r: 15, c: 12}, e: {r: 15, c: 14}},
        {s: {r: 16, c: 0}, e: {r: 16, c: 1}},
        {s: {r: 16, c: 2}, e: {r: 16, c: 5}},
        {s: {r: 16, c: 7}, e: {r: 16, c: 11}},
        {s: {r: 16, c: 12}, e: {r: 16, c: 14}},
        {s: {r: 17, c: 0}, e: {r: 17, c: 1}},
        {s: {r: 17, c: 2}, e: {r: 17, c: 5}},
        {s: {r: 17, c: 7}, e: {r: 17, c: 11}},
        {s: {r: 17, c: 12}, e: {r: 17, c: 14}},
        {s: {r: 18, c: 0}, e: {r: 18, c: 1}},
        {s: {r: 18, c: 2}, e: {r: 18, c: 5}},
        {s: {r: 18, c: 7}, e: {r: 18, c: 11}},
        {s: {r: 18, c: 12}, e: {r: 18, c: 14}},
        {s: {r: 19, c: 0}, e: {r: 19, c: 1}},
        {s: {r: 19, c: 2}, e: {r: 19, c: 5}},
        {s: {r: 19, c: 7}, e: {r: 19, c: 11}},
        {s: {r: 19, c: 12}, e: {r: 19, c: 14}},
        {s: {r: 21, c: 1}, e: {r: 21, c: 2}},
        //
        {s: {r: rT+1, c: 0}, e: {r: rT+1, c: 4}},
        {s: {r: rT+5, c:3}, e: {r: rT+5, c: 4}},
        {s: {r: rT+2, c: 1}, e: {r: rT+2, c: 2}},
        {s: {r: rT+2, c: 3}, e: {r: rT+2, c: 4}},
        {s: {r: rT+3, c: 3}, e: {r: rT+3, c: 4}},
        {s: {r: rT+1, c: 6}, e: {r: rT+1, c: 9}},
        {s: {r: rT+2, c: 6}, e: {r: rT+2, c: 7}},
        {s: {r: rT+2, c: 8}, e: {r: rT+2, c: 9}},
        {s: {r: rT+3, c: 6}, e: {r: rT+3, c: 7}},
        {s: {r: rT+3, c: 8}, e: {r: rT+3, c: 9}},
        {s: {r: rT+2, c: 11}, e: {r: rT+2, c: 12}},
        {s: {r: rT+3, c: 11}, e: {r: rT+3, c: 12}},
        {s: {r: rT+4, c: 11}, e: {r: rT+4, c: 12}},
        {s: {r: rT+2, c: 13}, e: {r: rT+2, c: 14}},
        {s: {r: rT+3, c: 13}, e: {r: rT+3, c: 14}},
        {s: {r: rT+4, c: 13}, e: {r: rT+4, c: 14}},
        {s: {r: rT+6, c: 11}, e: {r: rT+6, c: 14}},
        {s: {r: rT+7, c: 12}, e: {r: rT+7, c: 14}},
        {s: {r: rT+8, c: 12}, e: {r: rT+8, c:14}},
        {s: {r: rT+9, c: 11}, e: {r: rT+9, c: 12}},
        {s: {r: rT+9, c: 13}, e: {r: rT+9, c: 14}},
        {s: {r: rT+11, c: 0}, e: {r: rT+13, c: 14}},
        {s: {r: rT+15, c: 0}, e: {r: rT+15, c: 14}},
        {s: {r: rT+16, c: 0}, e: {r: rT+16, c: 14}}
      );

        const feuille = XLSX.utils.aoa_to_sheet(donnees, { origin: "A1" });

        feuille['!merges'] = merges;

        feuille['!cols'] = [
          { wpx: 108 }, // colonne A
          { wpx: 100 }, // colonne B
          { wpx: 100 }, // colonne C
          { wpx: 50  }, // colonne D
          { wpx: 64  }, // colonne E
          { wpx: 50  }, // colonne F
          { wpx: 100 }, // colonne G
          { wpx: 63  }, // colonne H
          { wpx: 50  }, // colonne I
          { wpx: 50  }, // colonne J
          { wpx: 50  }, // colonne K
          { wpx: 60  }, // colonne L
          { wpx: 60  }, // colonne M
          { wpx: 92  }, // colonne N
          { wpx: 77  }, // colonne O
        ]


       //=========================
       //PARAMETRE D'IMPRESSION
       //=========================
       feuille['!printOptions'] = {
        gridLines: false,
        horizontalCentered : true
      };

      feuille['!pageSetup'] = {
        orientation : "portrait",
        fitToWidth: 1,
        fitToHeight: 999
      };

      if(!feuille['!views']) feuille['!views'] = [];
      feuille['!views'].push({ showGridLines: false });



        const classeur = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(classeur, feuille, "Proforma");
        
        XLSX.writeFile(classeur, `Proforma_BriqueHouse_${dateAujourdhui.replace(/\//g,'-')}.xlsx`);

        btn.innerText = "✅ OK (Générer Excel)";

    } catch (e) {
        console.error("Erreur Excel :", e);
        alert("Erreur lors de la génération. Vérifiez la console.");
        btn.innerText = "✅ OK (Générer Excel)";
    }
};
