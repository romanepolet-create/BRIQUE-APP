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



// ========================
// 5. NAV BAR
// ========================
// ==========================================
// MENU BURGER MOBILE
// ==========================================
const menuBurger = document.getElementById('menu-burger');
const navLinks = document.getElementById('nav-links');

if(menuBurger && navLinks) {
  menuBurger.addEventListener('click', () => {
    // Ajoute ou enlève la classe "active" à chaque clic
    navLinks.classList.toggle('active');
    
    // Petit bonus visuel : on change l'icône quand c'est ouvert
    if(navLinks.classList.contains('active')) {
      menuBurger.innerHTML = '✖'; // Une croix pour fermer
    } else {
      menuBurger.innerHTML = '☰'; // Le burger normal
    }
  });
}
