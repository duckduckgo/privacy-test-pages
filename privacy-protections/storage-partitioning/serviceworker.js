// From: https://github.com/arthuredelstein/privacytests.org/blob/master/testing/out/tests/serviceWorker.js

let data; // undefined

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event) => {
    const scope = self.registration.scope;
    const shortPath = event.request.url.split(scope)[1];
    if (shortPath) {
        if (shortPath.startsWith('serviceworker-write?')) {
            data = (new URL(event.request.url)).searchParams.get('data');
            event.respondWith(new Response(''));
        } else if (shortPath === 'serviceworker-read') {
            event.respondWith(new Response(data));
        }
    }
});