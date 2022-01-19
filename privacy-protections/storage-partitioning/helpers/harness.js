/* exported accessStorageInIframe accessStorageInMainFrame */
/* globals storageAPIs */

function storeData (key, apis) {
    return Promise.all(apis.map(api => {
        try {
            const result = api.store(key);

            if (result instanceof Promise) {
                return result
                    .then(() => ({
                        api: api.name,
                        value: 'OK'
                    }))
                    .catch(e => ({
                        api: api.name,
                        value: e.message
                    }));
            } else {
                return Promise.resolve({
                    api: api.name,
                    value: 'OK'
                });
            }
        } catch (e) {
            return Promise.resolve({
                api: api.name,
                value: e.message ? e.message : e
            });
        }
    }));
}

function retrieveData (key, apis) {
    return Promise.all(apis.map(api => {
        try {
            const result = api.retrieve(key);

            if (result instanceof Promise) {
                return result
                    .then(value => ({
                        api: api.name,
                        type: api.type,
                        value: value
                    }))
                    .catch(e => ({
                        api: api.name,
                        type: api.type,
                        value: null,
                        error: e.message
                    }));
            } else {
                return Promise.resolve({
                    api: api.name,
                    type: api.type,
                    value: result
                });
            }
        } catch (e) {
            return Promise.resolve({
                api: api.name,
                type: api.type,
                value: null,
                error: e.message ? e.message : e
            });
        }
    }));
}

function accessStorageInIframe (frameOrigin, sessionId, mode, apiTypes) {
    return new Promise((resolve, reject) => {
        // Prepare arguments to pass to iframe
        const iframeURL = new URL('/privacy-protections/storage-partitioning/iframe.html', frameOrigin);
        if (!['store', 'retrieve'].includes(mode)) {
            reject(new Error(`Unrecognized mode ${mode} passed to function.`));
        }
        iframeURL.searchParams.set('mode', mode);
        iframeURL.searchParams.set('sessionId', sessionId);
        if (typeof apiTypes !== 'undefined') {
            iframeURL.searchParams.set('apiTypes', JSON.stringify(apiTypes));
        }

        const iframe = document.createElement('iframe');
        iframe.src = iframeURL.href;
        iframe.height = 1;
        iframe.width = 1;
        document.body.appendChild(iframe);

        window.addEventListener('message', event => {
            if (event.origin !== frameOrigin) {
                console.error(`Message from unexpected origin ${event.origin}`);
            }
            resolve(event.data);
        }, { capture: false, once: true });
    });
}

function accessStorageInMainFrame (sessionId, mode, apiTypes) {
    // Filter tests by API types
    let filterFunc = () => true;
    if (typeof apiTypes !== 'undefined') {
        filterFunc = api => apiTypes.includes(api.type);
    }
    const apis = storageAPIs.filter(filterFunc);

    if (mode === 'store') {
        return storeData(sessionId, apis);
    } else if (mode === 'retrieve') {
        return retrieveData(sessionId, apis);
    } else {
        throw new Error(`Unrecognized mode ${mode} passed to function.`);
    }
}
