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
