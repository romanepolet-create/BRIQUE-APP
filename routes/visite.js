const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer'); // Pour gérer l'envoi de la photo

// Configuration de Multer en mémoire (plus simple pour envoyer directement à Google Drive)
const upload = multer({ storage: multer.memoryStorage() });

// Configuration Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ID de votre Google Sheet central
const GOOGLE_SHEET_ID = "VOTRE_ID_GOOGLE_SHEET"; 
// ID du dossier parent dans Google Drive où créer les dossiers du jour
const DRIVE_PARENT_FOLDER_ID = "VOTRE_ID_DOSSIER_DRIVE_PARENT";

// Authentification Google (via un fichier de clé de compte de service JSON)
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
router.post('/api/visite/soumettre', upload.single('photo'), async (req, res) => {
  try {
    const data = req.body; // Contient id_hubspot, enseigne, nom, produits, canettes, cave, etc.
    const codeVisite = `VISITE_${Date.now()}`; // Génération du code unique de visite
    
    // Obtenir les dates formatées à la française
    const aujourdhui = new Date();
    const dateJourDrive = `${String(aujourdhui.getDate()).padStart(2, '0')}-${String(aujourdhui.getMonth() + 1).padStart(2, '0')}-${aujourdhui.getFullYear()}`; // DD-MM-YYYY
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

    // Préparation de la ligne à insérer
    // Adapter selon l'ordre exact de vos colonnes produits
    const ligneData = [
      codeVisite,
      data.id_hubspot,
      data.enseigne,
      data.nom_magasin,
      dateVisiteTexte,
      data.ref_LB33 || "NON", // Exemple pour vos colonnes produits
      data.ref_LB75 || "NON",
      data.ref_LB44 || "NON",
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
        hubspot_id: data.id_hubspot,
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
    // Optionnel : Ajouter la ligne d'en-tête ici si l'onglet vient d'être créé
  }
}

module.exports = router;
