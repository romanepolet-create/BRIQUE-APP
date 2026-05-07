// ==========================================
// 1. IMPORTS ET CONFIGURATION DE BASE
// ==========================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(express.json()); // 👈 INDISPENSABLE pour que la sauvegarde fonctionne !
const port = process.env.PORT || 3000;

// ==========================================
// 2. SÉCURITÉ ET MIDDLEWARES
// ==========================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: (req, res) => {
    console.log(`IP détectée : ${req.ip}`);
    if(req.ip === '::1' || req.ip === '127.0.0.1') {
      console.log("Connexion Admin détectée, limite ignorée");
      return true;
    }
    return false;
  }
});
app.use(limiter);

// Pour que le serveur comprenne le JSON et lise le dossier public
app.use(express.json()); 
app.use(express.static('public'));

// ==========================================
// 3. BRANCHEMENT DES ROUTES
// ==========================================
const routesBieres = require('./routes/bieres');
const routesLexique = require('./routes/lexique');
const routesDistrib = require('./routes/distrib');
const routesGeo = require('./routes/geo');
const routesRegion = require('./routes/region');
const routesProforma = require('./routes/proforma');

app.use('/api/bieres', routesBieres);
app.use('/api/lexique', routesLexique);
app.use('/api/distrib', routesDistrib);
app.use('/api/geo', routesGeo);
app.use('/api/region', routesRegion);
app.use('/api/proforma', routesProforma);


// ==========================================
// 4. LANCEMENT DU SERVEUR
// ==========================================
app.listen(port, () => {
  console.log(`✅ Serveur modulaire en ligne! Navigateur sur http://localhost:${port}`);
});

// ==========================================
// 4. LECTURE SUPABASE DISTRIB
// ==========================================

const { createClient } = require('@supabase/supabase-js');

// Ces clés se trouvent dans tes paramètres Supabase
const supabaseUrl = 'https://mtvzhpqticnxqcxsadkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dnpocHF0aWNueHFjeHNhZGtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyOTc1MCwiZXhwIjoyMDkzNjA1NzUwfQ.r2JXBf8hLrukjKOLQFlVqCBXDx8AjxlgVMGKir1a55U';
const supabase = createClient(supabaseUrl, supabaseKey);

// Ta route GET pour les distribs devient :
app.get('/api/distrib', async (req, res) => {
  const { data, error } = await supabase.from('distributeurs').select('*');
  if (error) return res.status(500).json(error);
  res.json(data);
});
