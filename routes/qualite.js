const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.get('/donnees', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Non connecté" });

    const { data, error } = await supabase
        .from('remontees_qualite')
        .select('*')
        .order('date', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, remontees: data });
});

router.post('/remontee', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Non connecté" });

    const parseNum = (val) => (val === "" || val === undefined) ? null : parseFloat(val);
    const parseStr = (val) => (val === "" || val === undefined) ? null : val;

    const payload = {
        date: req.body.date || new Date().toISOString().split('T')[0],
        biere: req.body.biere,
        lot: parseNum(req.body.lot),
        condi: parseNum(req.body.condi),
        date_condi: parseStr(req.body.date_condi),
        tps_vieil: parseNum(req.body.tps_vieil),
        style: parseStr(req.body.style),
        
        Aspect: parseStr(req.body.Aspect),
        Arôme: parseStr(req.body.Arôme),
        Goût: parseStr(req.body.Goût),
        Corps: parseStr(req.body.Corps),
        
        Carbo_condi_gL: parseNum(req.body.Carbo_condi_gL),
        Carbonatation: parseStr(req.body.Carbonatation),
        Oxydation: parseStr(req.body.Oxydation),
        DO: parseNum(req.body.DO),
        EBC_avant: parseNum(req.body.EBC_avant),
        EBC: parseNum(req.body.EBC),
        Ecart_EBC: parseNum(req.body.Ecart_EBC),
        pH_avant: parseNum(req.body.pH_avant),
        pH_après: parseNum(req.body.pH_après),
        
        Défauts: parseStr(req.body.Défauts),
        Décision: parseStr(req.body.Décision),
        Commentaires: parseStr(req.body.Commentaires)
    };

    if (!payload.biere || !payload.lot) {
        return res.status(400).json({ error: "La bière et le lot sont obligatoires." });
    }

    const { error } = await supabase.from('remontees_qualite').insert([payload]);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, message: "Rapport qualité enregistré avec succès." });
});

module.exports = router;
