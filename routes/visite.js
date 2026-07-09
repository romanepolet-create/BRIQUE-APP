const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const GOOGLE_SHEET_ID = process.env.GSHEET_VISITE; 
const DRIVE_PARENT_FOLDER_ID = process.env.GSHEET_VISITE;

const auth = new google.auth.GoogleAuth({
  keyFile: './config/google-credentials.json', // Chemin vers votre clé d'accès Google
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ],
});

// =========================================================================
// ROUTE PRINCIPALE : SOUMISSION DU RAPPORT DE VISITE
// =========================================================================
router.post('/soumettre', upload.single('photo'), async (req, res) => {
  try {
    const data = req.body;
    
    const aujourdhui = new Date();
    const dateJourDrive = `${String(aujourdhui.getDate()).padStart(2, '0')}-${String(aujourdhui.getMonth() + 1).padStart(2, '0')}-${aujourdhui.getFullYear()}`;

    const HHMM = `${String(aujourdhui.getHours()).padStart(2, '0')}${String(aujourdhui.getMinutes()).padStart(2, '0')}`;
    const codeVisite = `${data.hubspot_id}_${dateJourDrive.replace(/-/g, '')}_${HHMM}`;
    
    const nomOngletSheet = `${String(aujourdhui.getMonth() + 1).padStart(2, '0')}-${aujourdhui.getFullYear()}`; // MM-YYYY
    const dateVisiteTexte = aujourdhui.toLocaleString('fr-FR');

    let lienPhotoDrive = "Pas de MEA / Pas de photo";

    // ---------------------------------------------------------------------
    // 1. GESTION DE LA PHOTO SUR GOOGLE DRIVE (Si MEA coché OUI et photo présente)
    // ---------------------------------------------------------------------
    if (data.mea_status === "OUI" && req.file) {
      const drive = google.drive({ version: 'v3', auth });
      
      // A. Recherche ou création du dossier du jour [DD-MM-YYYY]
      let folderId = await obtenirOuCreerDossierDrive(drive, dateJourDrive, DRIVE_PARENT_FOLDER_ID);
      
      // B. Upload du fichier photo renommé selon le Code Visite
      const fileMetadata = {
        name: `${codeVisite}_1.jpg`, // Votre nomenclature validée
        parents: [folderId]
      };
      const media = {
        mimeType: req.file.mimetype,
        body: require('stream').Readable.from(req.file.buffer)
      };
      
      const fileDrive = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
      });
      
      lienPhotoDrive = fileDrive.data.webViewLink; // Lien hypertexte pour le Google Sheet
    }

    // ---------------------------------------------------------------------
    // 2. ENREGISTREMENT DANS LE GOOGLE SHEET (Gestion automatique des onglets mensuels)
    // ---------------------------------------------------------------------
    const sheets = google.sheets({ version: 'v4', auth });
    await verifierOuCreerOngletMensuel(sheets, GOOGLE_SHEET_ID, nomOngletSheet);

    const val = (ref) => data[ref] ? data[ref] : "NON";
    
    const ligneData = [
      codeVisite,
      data.hubspot_id,
      data.enseigne,
      data.nom_magasin,
      dateVisiteTexte,
      data.nb_canettes || 0,
      data.nb_cave || 0,

      val('ref_LB33'), val('ref_NQ33'), val('ref_YT33'), val('ref_Uacid33'),
      val('ref_LB75'), val('ref_NQ75'), val('ref_YT75'), val('ref_SH75'), val('ref_TC75'), val('ref_ML75'),
      val('ref_LB44'), val('ref_NQ44'), val('ref_YT44'), val('ref_ML44'),
      val('ref_ephemeres'),

      data.mea_status,
      data.mea_volume || "",
      lienPhotoDrive
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${nomOngletSheet}!A:K`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [ligneData] }
    });

    // ---------------------------------------------------------------------
    // 3. SAUVEGARDE DU DERNIER ÉTAT DANS SUPABASE (Pour pré-remplissage historique)
    // ---------------------------------------------------------------------
    // On utilise un .upsert() basé sur l'id_hubspot : si le magasin a déjà été visité,
    // on met simplement à jour les compteurs, sinon on crée la ligne.
    const { error: supabaseError } = await supabase
      .from('historique_visites')
      .upsert({
        hubspot_id: data.hubspot_id,
        nb_canettes: parseInt(data.nb_canettes) || 0,
        nb_cave: parseInt(data.nb_cave) || 0,
        derniere_visite: aujourdhui.toISOString()
      }, { onConflict: 'hubspot_id' });

    if (supabaseError) throw supabaseError;

    res.status(200).json({ success: true, message: "Rapport envoyé avec succès !", codeVisite });

  } catch (err) {
    console.error("Erreur critique lors de la soumission du rapport :", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// FONCTIONS OUTILS (DRIVE & SHEETS)
// =========================================================================
async function obtenirOuCreerDossierDrive(drive, folderName, parentId) {
  const query = `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const response = await drive.files.list({ q: query, fields: 'files(id)' });
  
  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  } else {
    const fileMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
    const folder = await drive.files.create({ resource: fileMetadata, fields: 'id' });
    return folder.data.id;
  }
}

async function verifierOuCreerOngletMensuel(sheets, spreadsheetId, sheetName) {
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const tabExists = metadata.data.sheets.some(s => s.properties.title === sheetName);
  
  if (!tabExists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{ addSheet: { properties: { title: sheetName } } }]
      }
    });
    const enTetes = [
      "Code Visite", 
      "ID Hubspot", 
      "Enseigne", 
      "Nom Magasin", 
      "Date Visite", 
      "Nb Canettes", 
      "Nb Cave", 
      "LB33", 
      "NQ33", 
      "YT33", 
      "U acid33",
      "LB75", 
      "NQ75", 
      "YT75", 
      "SH75", 
      "TC75", 
      "ML75", 
      "ephemeres",
      "LB44", 
      "NQ44", 
      "YT44", 
      "ML44",
      "MEA", 
      "Volume MEA", 
      "Lien Photo"
    ];
    
     await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1:Z1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [enTetes] }
     });
  }
}

module.exports = router;
