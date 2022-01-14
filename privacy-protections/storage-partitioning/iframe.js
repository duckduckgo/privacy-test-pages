/* globals storageAPIs */

function storeData (key, filterFunc) {
    const apis = storageAPIs.filter(filterFunc);
    console.log('store', apis);
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

function retrieveData (key, filterFunc) {
    const apis = storageAPIs.filter(filterFunc);
    console.log('retrieve', apis);
    return Promise.all(apis.map(api => {
        try {
            const result = api.retrieve(key);

            if (result instanceof Promise) {
                return result
                    .then(value => ({
                        api: api.name,
                        value: value
                    }))
                    .catch(e => ({
                        api: api.name,
                        value: null,
                        error: e.message
                    }));
            } else {
                return Promise.resolve({
                    api: api.name,
                    value: result
                });
            }
        } catch (e) {
            return Promise.resolve({
                api: api.name,
                value: null,
                error: e.message ? e.message : e
            });
        }
    }));
}

document.addEventListener('DOMContentLoaded', () => {
    const url = new URL(window.location.href);
    const mode = url.searchParams.get('mode');
    const sessionId = url.searchParams.get('sessionId');

    // Filter tests by API types
    let apiTypes = url.searchParams.get('apiTypes');
    let filterFunc = () => true;
    if (apiTypes !== null) {
        apiTypes = JSON.parse(apiTypes);
        filterFunc = api => apiTypes.includes(api.type);
    }

    if (mode === 'store') {
        storeData(sessionId, filterFunc)
            .then(result => {
                window.parent.postMessage(result, '*');
            });
    } else if (mode === 'retrieve') {
        retrieveData(sessionId, filterFunc)
            .then(result => {
                window.parent.postMessage(result, '*');
            });
    } else {
        console.error(`Unknown mode ${mode}`);
    }
});
