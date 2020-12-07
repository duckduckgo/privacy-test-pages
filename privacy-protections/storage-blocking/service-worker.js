self.addEventListener('install', (evt) => {
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/service-worker-data')) {
        event.respondWith(new Response(location.search.replace('?data=', '')));
    }
});