/* eslint-env serviceworker */

self.addEventListener('install', (evt) => {
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/service-worker-data')) {
        event.respondWith(new Response(location.search.replace('?data=', '')));
    }
});
