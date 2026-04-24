// ==========================================
// 1. IMPORTS ET CONFIGURATION DE BASE
// ==========================================
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// 2. SÉCURITÉ ET MIDDLEWARES
// ==========================================
app.use(helmet({ contentSecurityPolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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


app.use('/api/bieres', routesBieres);
app.use('/api/lexique', routesLexique);
app.use('/api/distrib', routesDistrib);
app.use('/api/geo', routesGeo);
app.use('/api/region', routesRegion);

// ==========================================
// 4. LANCEMENT DU SERVEUR
// ==========================================
app.listen(port, () => {
  console.log(`✅ Serveur modulaire en ligne! Navigateur sur http://localhost:${port}`);
});
