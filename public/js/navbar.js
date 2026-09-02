const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'css/styleNavBar.css';
document.head.appendChild(link);

fetch('/nav.html')
  .then(response => response.text())
  .then(data => {
      document.getElementById('nav-placeholder').innerHTML = data;

      const menuBurger = document.getElementById('menu-burger');
      const navLinks = document.getElementById('nav-links');

      if(menuBurger && navLinks) {
        menuBurger.addEventListener('click', () => {
          navLinks.classList.toggle('active');
          
          if(navLinks.classList.contains('active')) {
            menuBurger.innerHTML = '✖';
          } else {
            menuBurger.innerHTML = '☰';
          }
        });
      } else {
        console.error("BUG MENU : Il manque 'menu-burger' ou 'nav-links' dans le html");
      }
  })
  .catch(error => console.error("Erreur de chargement du menu :", error));
