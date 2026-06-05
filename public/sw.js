self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installation');
});

self.addEventListener('fetch', (e) => {
  // On répond avec la requête réseau classique pour faire taire l'avertissement
  e.respondWith(fetch(e.request));
});
