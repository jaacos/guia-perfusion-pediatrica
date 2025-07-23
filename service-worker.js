const CACHE_VERSION = 'v1.2'; // Cambia este número para que sea nuevo, ej: 'v1.2' o '2025-07-23-2'
// El resto de tu código service-worker.js sigue aquí// Define un nombre para la caché actual.
const CACHE_NAME = 'guia-perfusion-pediatrica-v2'; // Incrementamos la versión para forzar la actualización

// Lista de archivos necesarios para que la aplicación funcione offline.
// Usamos rutas relativas para que funcione en cualquier subdirectorio (como en GitHub Pages).
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Evento 'install': Se dispara cuando el service worker se instala.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': Se dispara cada vez que la página solicita un recurso.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos una coincidencia en la caché, la devolvemos.
        if (response) {
          return response;
        }
        // Si no, intentamos obtenerla de la red.
        return fetch(event.request);
      }
    )
  );
});

// Evento 'activate': Se dispara cuando el service worker se activa.
// Limpia las cachés antiguas para evitar conflictos.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
