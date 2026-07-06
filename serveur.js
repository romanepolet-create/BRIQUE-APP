// ==========================================
// 1. IMPORTS ET CONFIGURATION DE BASE
// ==========================================
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
app.use(express.json()); 
const port = process.env.PORT || 3000;

const session = require('express-session');
app.use(session({
  secret: process.env.session_secret || 'brique-house-cle-de-secours-2026!',
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}
}));

// ==========================================
// 2. SÉCURITÉ ET MIDDLEWARES
// ==========================================
app.use(helmet({ contentSecurityPolicy: false }));

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

function verifierBriqueHouse(req, res, next) {
  if (req.session && req.session.email) {
    return next();
  }
  res.redirect('/login.html');
}
// ==========================================
// 3. BRANCHEMENT DES ROUTES
// ==========================================

const routesAuth = require('./routes/auth');
app.use('/api/auth', routesAuth);

const routesBieres = require('./routes/bieres');
const routesLexique = require('./routes/lexique');
const routesDistrib = require('./routes/distrib');
const routesGeo = require('./routes/geo');
const routesRegion = require('./routes/region');
const routesProforma = require('./routes/proforma');
const routesGms = require('./routes/gms');
const routesTournee = require('./routes/tournee');

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    xlsxVisite = process.env.GSHEET_VISITE,
    dossierVisite = process.env.GDOSSIER_VISITE
  });
});

app.use('/api/bieres', verifierBriqueHouse, routesBieres);
app.use('/api/lexique', verifierBriqueHouse, routesLexique);
app.use('/api/distrib', verifierBriqueHouse, routesDistrib);
app.use('/api/geo', verifierBriqueHouse, routesGeo);
app.use('/api/region', verifierBriqueHouse, routesRegion);
app.use('/api/proforma', verifierBriqueHouse, routesProforma);
app.use('/api/gms', verifierBriqueHouse, routesGms);
app.use('/api/tournee', verifierBriqueHouse, routesTournee);

app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.use(verifierBriqueHouse);

app.use(express.static('public'));

// ==========================================
// 4. LANCEMENT DU SERVEUR
// ==========================================
app.listen(port, () => {
  console.log(`✅ Serveur modulaire en ligne! Navigateur sur http://localhost:${port}`);
});
