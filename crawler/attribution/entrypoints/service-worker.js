// this is an entry point to set up a service worker. The actual API call is in sw-source.js
navigator.serviceWorker.addEventListener('message', (e) => {
    window.addResult('Navigator.prototype.userAgent', 'service worker', e.data.serviceWorkerUrl, e.data.serviceWorkerUrl);
});
navigator.serviceWorker.register('./sw-source.js', { scope: './' })
    .then(registration => {
        if (registration.active) {
            registration.active.postMessage({ doit: true });
        } else if (registration.installing) {
            registration.installing.addEventListener('statechange', (event) => {
                if (event.target.state === 'activated' && registration.active) {
                    registration.active.postMessage({ doit: true });
                }
            });
        }
    })
    .catch((error) => {
        console.error('Registration failed with ' + error);
    });
