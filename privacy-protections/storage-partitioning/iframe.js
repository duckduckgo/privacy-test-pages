function storeData (key, apis) {
    return Promise.all(Object.entries(apis).map(([apiName, api]) => {
        try {
            const result = api.store(key);

            if (result instanceof Promise) {
                return result
                    .then(() => ({
                        api: apiName,
                        value: 'OK'
                    }))
                    .catch(e => ({
                        api: apiName,
                        value: e.message
                    }));
            } else {
                return Promise.resolve({
                    api: apiName,
                    value: 'OK'
                });
            }
        } catch (e) {
            return Promise.resolve({
                api: apiName,
                value: e.message ? e.message : e
            });
        }
    }));
}

function retrieveData (key, apis) {
    return Promise.all(Object.entries(apis).map(([apiName, api]) => {
        try {
            const result = api.retrieve(key);

            if (result instanceof Promise) {
                return result
                    .then(value => ({
                        api: apiName,
                        value: value
                    }))
                    .catch(e => ({
                        api: apiName,
                        value: null,
                        error: e.message
                    }));
            } else {
                return Promise.resolve({
                    api: apiName,
                    value: result
                });
            }
        } catch (e) {
            return Promise.resolve({
                api: apiName,
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
    let apis = testAPIs;
    let apiTypes = url.searchParams.get('apiTypes');
    if (apiTypes !== null) {
        apiTypes = JSON.parse(apiTypes);
        apis = Object.fromEntries(
            Object.entries(apis).filter(([apiName, api]) => apiTypes.includes(api.type))
        );
    }

    if (mode === 'store') {
        storeData(sessionId, apis)
            .then(result => {
                window.parent.postMessage(result, '*');
            });
    } else if (mode === 'retrieve') {
        retrieveData(sessionId, apis)
            .then(result => {
                window.parent.postMessage(result, '*');
            });
    } else {
        console.error(`Unknown mode ${mode}`);
    }
});
