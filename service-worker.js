// ============================================================
//  SERVICE WORKER — Guía de Perfusión Pediátrica  v2.0
//
//  ESTRATEGIA:
//  · index.html / navegación  →  NETWORK-FIRST
//      (si hay red, siempre se sirve la versión más reciente;
//       si no hay red, se sirve la copia en caché → funciona offline)
//  · resto (iconos, manifest)  →  CACHE-FIRST
//
//  Para forzar limpieza de caché: cambia CACHE_VERSION (ej: 'v2.1')
// ============================================================
const CACHE_VERSION = 'v2.1';
const CACHE_NAME    = 'guia-perfusion-ped-' + CACHE_VERSION;
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// ---- INSTALL: precachear archivos esenciales ----
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// ---- ACTIVATE: borrar cachés antiguas ----
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names =>
                Promise.all(
                    names
                        .filter(n => n !== CACHE_NAME)
                        .map(n => caches.delete(n))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ---- FETCH ----
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const isHTML =
        event.request.mode === 'navigate' ||
        event.request.destination === 'document' ||
        event.request.url.endsWith('index.html') ||
        event.request.url.endsWith('/');

    if (isHTML) {
        // NETWORK-FIRST: la app siempre intenta traer la última versión
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const toCache = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, toCache));
                    return response;
                })
                .catch(() => caches.match(event.request)
                    .then(cached => cached || caches.match('./index.html')))
        );
        return;
    }

    // CACHE-FIRST para el resto de recursos
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const toCache = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, toCache));
                }
                return response;
            });
        })
    );
});
