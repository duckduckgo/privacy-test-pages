/* globals storgeAPIs */

function storeData (randomNumber) {
    return Promise.all(storgeAPIs.map(api => {
        try {
            const result = api.store(randomNumber);

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

function retrieveData () {
    return Promise.all(storgeAPIs.map(api => {
        try {
            const result = api.retrive();

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

const match = location.search.match(/data=([0-9]+)/);

// if number passed in the url - store it
if (match) {
    const number = match[1];

    storeData(number)
        .then(result => {
            window.parent.postMessage(result, '*');
        });
} else {
// otherwise retrive the number
    retrieveData()
        .then(result => {
            window.parent.postMessage(result, '*');
        });
}
