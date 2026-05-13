<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="/css/style.css">
  <title>Formulaire Sales - CHR</title>
</head>
<body>
  <nav class="navbar">
    <div class="logo">🍻 Brique App</div>
    <ul class="nav-links">
      <li> <a href="/"> Accueil</a></li>
      <li> <a href="/lexique.html" class="active">Glossaire</a></li>
      <li> <a href="/desc.html">Bières BH</a></li>
      <li> <a href="/distrib.html" class="active">Distributeurs</a></li>
      <li> <a href="/gms.html">Espace GMS</a></li>
    </ul>
  </nav>
  <h1>Les Typeforms de commandes & PLV</h1>
  <div id="liste" class="grid">
    <p>Chargement des Typeforms</p>
  </div>

  <button onclick="document.getElementById('zone-typeform').style.display='block'" class="btn-form" style="display: inline-block">
    📝 Formulaire de Commande
  </button>
  <button onclick="document.getElementById('zone-typeform').style.display='block'" class="btn-form" style="display: inline-block"> 
    📝Formulaire PLV
  </button>

  <div id="zone-typeform" style="display: none; 
                                 margin-top: 20px; 
                                 border: 2px solid #002ab6;
                                 border-radius: 10px;
                                 overflow: hіdden;">  
  <iframe
   src="https://briquehouse.typeform.com/to/HgMDQAeN"
   width="100%"
   height="600px"
   frameborder="0"
   allow="camera; microphone; autoplay; encrypted-media;">
  </iframe>
<div>
</body>
</html>
