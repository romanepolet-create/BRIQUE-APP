const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialisation identique à votre route fonctionnelle
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ROUTE : Sauvegarder une remontée qualité
router.post('/remontee', async (req, res) => {
    const userId = req.session.userId;
    const email = req.session.email;
    
    // On vérifie la connexion comme dans votre route "tournee"
    if (!userId) return res.status(401).json({ error: "Non connecté" });

    const { reference, numero_lot, format, description } = req.body;

    if (!reference || !numero_lot || !format || !description) {
        return res.status(400).json({ error: "Tous les champs sont obligatoires." });
    }

    const { data, error } = await supabase
        .from('remontees_qualite')
        .insert([
            { 
                reference: reference, 
                numero_lot: numero_lot, 
                format: format, 
                description: description,
                user_email: email // On utilise l'email de la session
            }
        ]);

    // On retourne le message d'erreur Supabase exact s'il y en a une, comme dans votre exemple
    if (error) return res.status(500).json({ error: error.message });
    
    return res.json({ success: true, message: "Problème signalé avec succès !" });
});

// ROUTE : Récupérer toutes les remontées pour générer les grilles
router.get('/donnees', async (req, res) => {
    // Optionnel : vérifier si l'utilisateur est connecté
    if (!req.session.userId) return res.status(401).json({ error: "Non connecté" });

    const { data, error } = await supabase.from('remontees_qualite').select('*');
    
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, remontees: data });
});

module.exports = router;
