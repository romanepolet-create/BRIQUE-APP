document.addEventListener('DOMContentLoaded', () => {
  const menuBurger = document.getElementById('menu-burger');
  const navLinks = document.getElementById('nav-links');

  if(menuBurger && navLinks) {
    menuBurger.addEventListener('click', () => {
      // Ajoute ou enlève la classe "active" à chaque clic
      navLinks.classList.toggle('active');
    
      // Changement d'icône
      if(navLinks.classList.contains('active')) {
        menuBurger.innerHTML = '✖'; // Une croix pour fermer
      } else {
        menuBurger.innerHTML = '☰'; // Le burger normal
      }
    });
  } else {
    console.error("BUG MENU : Il manque 'menu-burger' ou 'nav-links' dans le html"
  }
});
