self.addEventListener('install', (evt) => {
    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data.action && event.data.action === 'fetch') {
        fetch(event.data.url)
            .then(r => r.json())
            .then(data => {
                if (data.data.includes('fetch loaded')) {
                    event.source.postMessage('service worker fetch loaded 👍');
                    self.registration.unregister();
                }
            })
            .catch(() => {
                event.source.postMessage('service worker fetch failed');
                self.registration.unregister();
            })
    }
});