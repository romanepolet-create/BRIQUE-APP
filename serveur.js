// ==========================================
// 1. IMPORTS ET CONFIGURATION DE BASE
// ==========================================
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.use(express.json()); // 👈 INDISPENSABLE pour que la sauvegarde fonctionne !
const port = process.env.PORT || 3000;

const session = require('express-session');
app.use(session({
  secret: process.env.session_secret,
  resave: false,
  saveUninitialized: false,
  cookie: {secure: true}
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
const routesGms = require('./routes/gms');

app.use('/api/bieres', routesBieres);
app.use('/api/lexique', routesLexique);
app.use('/api/distrib', routesDistrib);
app.use('/api/geo', routesGeo);
app.use('/api/region', routesRegion);
app.use('/api/proforma', routesProforma);
app.use('/api/gms', routesGms);


// ==========================================
// 4. LANCEMENT DU SERVEUR
// ==========================================
app.listen(port, () => {
  console.log(`✅ Serveur modulaire en ligne! Navigateur sur http://localhost:${port}`);
});

function verifierBriqueHouse(req, res, next) {
  const { email, password } = req.body;

  if (req.session && req.session.email) {
    return next();
  }

  res.redirect('/login.html');
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if ( email || !email.endsWith('@briquehouse.fr')) {
    return res.status(403).json({ error: "Seules les adresses @briquehouse.fr sont autorisées."});
  }

//--- Faire base supa pour mdp pour email ---
  const motDePasseValide = true;

  if (motDePasseValide) {
    req.session.email = email;
    return res.json({ success: true });
  } else { 
    return res.status(401).json({ error: "Mot de passe incorrect." });
  }
});

app.use('/public/mapGMS.html, verifierBriqueHouse);
app.use('/desc.html, verifierBriqueHouse);
app.use('/distrib.html, verifierBriqueHouse);
app.use('/form.html, verifierBriqueHouse);
app.use('/gms.html, verifierBriqueHouse);
app.use('/index.html, verifierBriqueHouse);
app.use('/lexique.html, verifierBriqueHouse);
app.use('/manifest.html, verifierBriqueHouse);
app.use('/mapCHR.html, verifierBriqueHouse);
app.use('/sw.js, verifierBriqueHouse);

app.use('/api/bieres', verifierBriqueHouse);
app.use('/api/lexique', verifierBriqueHouse);
app.use('/api/distrib', verifierBriqueHouse);
app.use('/api/geo', verifierBriqueHouse);
app.use('/api/region', verifierBriqueHouse);
app.use('/api/proforma', verifierBriqueHouse);
app.use('/api/gms', verifierBriqueHouse);        

app.use('/public/js/desc.js', verifierBriqueHouse);      
app.use('/public/js/distrib.js', verifierBriqueHouse);
app.use('/public/js/form.js', verifierBriqueHouse);      
app.use('/public/js/gms.js', verifierBriqueHouse);      
app.use('/public/js/lexique.js', verifierBriqueHouse);      
app.use('/public/js/mapCHR.js', verifierBriqueHouse);      
app.use('/public/js/mapGMS.js', verifierBriqueHouse);      
app.use('/public/js/navbar.js', verifierBriqueHouse);      
app.use('/public/js/outils.js', verifierBriqueHouse);      
app.use('/public/js/pdf.js', verifierBriqueHouse);      
app.use('/public/js/proforma.js', verifierBriqueHouse);      

