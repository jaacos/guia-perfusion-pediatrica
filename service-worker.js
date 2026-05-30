// ============================================================
//  SERVICE WORKER — Guía de Perfusión Pediátrica
//  Para actualizar la caché: cambia CACHE_VERSION (ej: 'v1.3')
// ============================================================

const CACHE_VERSION = 'v1.2';
const CACHE_NAME    = 'guia-perfusion-' + CACHE_VERSION;

const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// ---- INSTALL: precachear archivos esenciales ----
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando archivos esenciales');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => self.skipWaiting())   // activa el SW inmediatamente
    );
});

// ---- ACTIVATE: borrar cachés antiguas ----
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames =>
                Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Borrando caché antigua:', name);
                            return caches.delete(name);
                        })
                )
            )
            .then(() => self.clients.claim())  // toma control sin recargar
    );
});

// ---- FETCH: cache-first con fallback a red ----
self.addEventListener('fetch', event => {
    // Solo interceptamos peticiones GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;

                return fetch(event.request)
                    .then(response => {
                        // Solo cacheamos respuestas válidas del mismo origen
                        if (
                            !response ||
                            response.status !== 200 ||
                            response.type !== 'basic'
                        ) {
                            return response;
                        }

                        // Clonar antes de cachear (el stream solo se puede leer una vez)
                        const toCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, toCache));

                        return response;
                    })
                    .catch(() => {
                        // Sin red y sin caché: devolvemos index.html como fallback
                        return caches.match('./index.html');
                    });
            })
    );
});
