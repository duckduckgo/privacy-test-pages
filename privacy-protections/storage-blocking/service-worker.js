/* eslint-env serviceworker */
/* global cookieStore */

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
    if (event.request.url.includes('/service-worker-set-cookie')) {
        const url = new URL(event.request.url);
        if (globalThis.cookieStore) {
            cookieStore.set({
                name: url.searchParams.get('name'),
                value: url.searchParams.get('data'),
                expires: new Date('Wed, 21 Aug 2030 20:00:00 UTC').getTime()
            });
        }
        event.respondWith(new Response('OK'));
    }
});
