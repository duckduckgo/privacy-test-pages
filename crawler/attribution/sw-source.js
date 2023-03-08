/* eslint-env serviceworker */

self.addEventListener('install', (evt) => {
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    console.log(self.location.href, navigator.userAgent);
    event.source.postMessage({ dave: self.location.href });
    self.registration.unregister();
});
