/*
 * Portions of the code derived from privacytests.org source code (https://github.com/arthuredelstein/privacytests.org)
 * Copyright 2018 Arthur Edelstein
 * MIT License (https://mit-license.org/)
 */

let data; // undefined

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event) => {
    const scope = self.registration.scope;
    const url = new URL(event.request.url);
    const shortPath = url.href.split(scope)[1];
    if (shortPath) {
        if (shortPath.startsWith('serviceworker-write?')) {
            data = url.searchParams.get('data');
            event.respondWith(new Response(''));
        } else if (shortPath === 'serviceworker-read') {
            event.respondWith(new Response(data));
        }
    }
});
