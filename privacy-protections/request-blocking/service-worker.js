self.addEventListener('install', (evt) => {
    console.log('The service worker is being installed.');
});

function reportSuccess(event, response) {
    // console.log('success', event.request, response);

    clients.get(event.clientId)
        .then((client) => {
            client.postMessage({
                msg: 'loaded',
                url: event.request.url
            });
        });


    return response;
}

function reportFailure(event, error) {
    // console.log('failure', event.request.url, event, error);

    clients.get(event.clientId)
        .then((client) => {
            client.postMessage({
                msg: 'blocked',
                url: event.request.url,
                error: error.toString()
            });
        });

    return error;
}

self.addEventListener('fetch', function (evt) {
    console.log('Service worker fetch', evt);
    
    evt.respondWith(
        fetch(evt.request)
            .then(reportSuccess.bind(null, evt))
            .catch(reportFailure.bind(null, evt))
    );
});
