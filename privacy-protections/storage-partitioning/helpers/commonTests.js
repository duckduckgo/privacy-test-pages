/* exported testAPIs */
/* globals FIRST_PARTY_HOSTNAME */

const timeout = 1000; // ms; used for cross-tab communication APIs

function getURL (path, params = {}) {
    const url = new URL(`/partitioning/${path}`, window.location.origin);
    for (const [name, value] of Object.entries(params)) {
        url.searchParams.set(name, value);
    };
    return url;
}

const sleepMs = (timeMs) => new Promise(
    (resolve, reject) => setTimeout(resolve, timeMs)
);

const loadSubresource = async (tagName, url) => {
    const element = document.createElement(tagName);
    document.body.appendChild(element);
    const resultPromise = new Promise((resolve, reject) => {
        element.addEventListener('load', resolve, { once: true });
        element.addEventListener('error', reject, { once: true });
    });
    element.src = url;
    try {
        return await resultPromise;
    } catch (e) {
        // some sort of loading error happened
        return e;
    }
};

// Validates storage APIs which return the value of the token stored in
// the storage container within each test context. E.g.,
//
// document.cookie
//     same-site: [ { "value": "51c69e1b" }, { "value": "51c69e1b" } ]
//    cross-site: [ { "value": "fd10f7f5d2cf" }, { "value": "fd10f7f5d2cf" } ]
function validateStorageAPI (sameSites, crossSites, sessionId) {
    if (
        (sameSites.every(v => v.error === 'Unsupported')) &&
        (crossSites.every(v => v.error === 'Unsupported'))
    ) {
        return 'unsupported';
    }

    if (sameSites[0].value !== sessionId) {
        if (sameSites[0].value === null && typeof sameSites[0].error !== 'undefined') {
            return 'error';
        }
        return 'fail';
    }

    if (
        (sameSites.length === 0) ||
        (crossSites.length !== sameSites.length) ||
        (!sameSites.every(v => v.value === sameSites[0].value)) ||
        (!crossSites.every(v => v.value === crossSites[0].value)) ||
        (!crossSites.every(v => v.value !== sameSites[0].value))
    ) {
        return 'fail';
    }
    return 'pass';
}

// Validates the results returned by Cache APIs. These return a count of the
// number of requests the server has received upon each pageload. E.g.,
//
// Iframe Cache
//     same-site: [ { "value": "1" }, { "value": "1" } ]
//    cross-site: [ { "value": "2" }, { "value": "2" } ]
function validateCacheAPI (sameSites, crossSites) {
    if (
        (sameSites.every(v => v.error === 'No requests received')) &&
        (crossSites.every(v => v.error === 'No requests received'))
    ) {
        return 'unsupported';
    } else if (
        (sameSites.length > 0) &&
        (crossSites.length === sameSites.length) &&
        (sameSites.every(v => v.value === sameSites[0].value)) &&
        (crossSites.every(v => v.value === crossSites[0].value)) &&
        (crossSites.every(v => v.value === sameSites[0].value + 1))
    ) {
        return 'pass';
    } else if (
        (sameSites.every(v => v.value === sameSites[0].value)) &&
        (crossSites.every(v => v.value === crossSites[0].value)) &&
        (crossSites.every(v => v.value === sameSites[0].value))
    ) {
        return 'fail';
    }
    return 'error';
}

// we are using same set of tests for main frame and an iframe
// we want to set 'Lax' in the main frame for the cookie not to be suspicious
// we want to set 'None' in an iframe for cookie to be accessible to us
const sameSite = (window !== window.top) ? 'none' : 'lax';

const testAPIs = {
    'document.cookie': {
        type: 'storage',
        store: (data) => {
            document.cookie = `partition_test=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC; Secure; SameSite=${sameSite}`;
        },
        retrieve: () => {
            const match = document.cookie.match(/partition_test=([0-9a-z-]+)/);
            if (!match) {
                return null;
            }
            return match[1];
        },
        validate: validateStorageAPI
    },
    'HTTP Cookie': {
        type: 'storage',
        store: async (data) => {
            // Request a page that will send an HTTPOnly 'set-cookie' response header storing the provided data.
            await fetch(getURL('set-cookie', {
                cookieName: 'partition_test_http',
                cookieValue: data
            }));
        },
        retrieve: async () => {
            // Test if we now send a requests with a 'cookie' header containing the secret.
            const response = await fetch(getURL('reflect-headers'));
            const cookie = (await response.json()).cookie;
            return cookie ? cookie.match(/partition_test_http=([\w-]+)/)[1] : null;
        },
        validate: validateStorageAPI
    },
    'Cookie Store API': {
        type: 'storage',
        store: (data) => {
            if (!window.cookieStore) {
                throw new Error('Unsupported');
            }
            window.cookieStore.set({
                name: 'partition_test',
                value: data,
                expires: 'Wed, 21 Aug 2030 20:00:00 UTC',
                sameSite: sameSite
            });
        },
        retrieve: async () => {
            if (!window.cookieStore) {
                throw new Error('Unsupported');
            }
            const cookie = await window.cookieStore.get('partition_test');
            if (!cookie) {
                return null;
            }
            return cookie.value;
        },
        validate: validateStorageAPI
    },
    localStorage: {
        type: 'storage',
        store: (data) => {
            localStorage.setItem('partition_test', data);
        },
        retrieve: () => {
            return localStorage.getItem('partition_test');
        },
        validate: validateStorageAPI
    },
    sessionStorage: {
        type: 'storage',
        store: (data) => {
            sessionStorage.setItem('partition_test', data);
        },
        retrieve: () => {
            return sessionStorage.getItem('partition_test');
        },
        validate: validateStorageAPI
    },
    IndexedDB: {
        type: 'storage',
        store: (data) => {
            return DB('partition_test').then(db => Promise.all([db.deleteAll(), db.put({ id: data })])).then(() => 'OK');
        },
        retrieve: () => {
            return DB('partition_test').then(db => db.getAll()).then(data => {
                if (!data[0]) {
                    return null;
                }
                return data[0].id;
            });
        },
        validate: validateStorageAPI
    },
    WebSQL: {
        type: 'storage',
        store: (data) => {
            let res, rej;
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject; });

            const db = window.openDatabase('partition_test', '1.0', 'partition_test', 2 * 1024 * 1024);

            db.transaction(tx => {
                tx.executeSql('CREATE TABLE IF NOT EXISTS partition_test (value)', [], () => {
                    tx.executeSql('DELETE FROM partition_test;', [], () => {
                        tx.executeSql('INSERT INTO partition_test (value) VALUES (?)', [data], () => res(), (sql, e) => rej('err - insert ' + e.message));
                    }, (sql, e) => rej('err - delete ' + e.message));
                }, (sql, e) => rej('err - create ' + e.message));
            });

            return promise;
        },
        retrieve: () => {
            if (!window.openDatabase) {
                throw new Error('Unsupported');
            }
            let res, rej;
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject; });

            const db = window.openDatabase('partition_test', '1.0', 'data', 2 * 1024 * 1024);

            db.transaction(tx => {
                tx.executeSql('SELECT * FROM partition_test', [], (tx, d) => {
                    res(d.rows[0].value);
                }, (sql, e) => rej('err - select ' + e.message));
            });

            return promise;
        },
        validate: validateStorageAPI
    },
    'Cache API': {
        type: 'storage',
        store: (data) => {
            return caches.open('partition_test').then((cache) => {
                const res = new Response(data, {
                    status: 200
                });

                return cache.put('/partition_test/cache-api-response', res);
            });
        },
        retrieve: () => {
            return caches.open('partition_test').then((cache) => {
                return cache.match('/partition_test/cache-api-response')
                    .then(r => {
                        if (!r) {
                            return null;
                        }
                        return r.text();
                    });
            });
        },
        validate: validateStorageAPI
    },
    // Tests below here are inspired by: https://github.com/arthuredelstein/privacytests.org/
    ServiceWorker: {
        type: 'storage',
        store: async (data) => {
            if (!navigator.serviceWorker) {
                throw new Error('Unsupported');
            }
            await navigator.serviceWorker.register('serviceworker.js');

            // Wait until the new service worker is controlling the current context
            await new Promise(resolve => {
                if (navigator.serviceWorker.controller) return resolve();
                navigator.serviceWorker.addEventListener('controllerchange', () => resolve());
            });

            await fetch(`serviceworker-write?data=${data}`);
        },
        retrieve: async () => {
            if (!navigator.serviceWorker) {
                throw new Error('Unsupported');
            }
            if (!navigator.serviceWorker.controller) {
                throw new Error('No service worker controller for this context.');
            }
            const response = await fetch('serviceworker-read');
            return await response.text();
        },
        validate: validateStorageAPI
    },
    BroadcastChannel: {
        type: 'communication',
        store: (data) => {
            const bc = new BroadcastChannel('partition_test');
            bc.onmessage = (event) => {
                if (event.data === 'request') {
                    bc.postMessage(data);
                }
            };
        },
        retrieve: () => {
            return new Promise((resolve, reject) => {
                if (!window.BroadcastChannel) {
                    reject(new Error('Unsupported'));
                }
                const bc = new BroadcastChannel('partition_test');
                bc.onmessage = (event) => {
                    if (event.data !== 'request') {
                        resolve(event.data);
                    }
                };
                bc.postMessage('request');
                setTimeout(() => {
                    reject(new Error(`No BroadcastChannel message received within timeout ${timeout}`));
                }, timeout);
            });
        },
        validate: validateStorageAPI
    },
    SharedWorker: {
        type: 'communication',
        store: (data) => {
            try {
                const worker = new SharedWorker('helpers/sharedworker.js');
                worker.port.start();
                worker.port.postMessage(data);
            } catch (e) {
                throw new Error('Unsupported');
            }
        },
        retrieve: () => {
            return new Promise((resolve, reject) => {
                if (!window.SharedWorker) {
                    reject(new Error('Unsupported'));
                }
                const worker = new SharedWorker('helpers/sharedworker.js');
                worker.port.start();
                worker.port.onmessage = (e) => {
                    if (typeof e.data === 'undefined') {
                        resolve(null);
                    }
                    resolve(e.data);
                };
                worker.port.postMessage('request');
                setTimeout(() => {
                    reject(new Error(`No Shared Worker message received within timeout ${timeout}`));
                }, timeout);
            });
        },
        validate: validateStorageAPI
    },
    'Web Locks API': {
        type: 'communication',
        store: async (key) => {
            if (!navigator.locks) {
                throw new Error('Unsupported');
            }
            navigator.locks.request(key, () => new Promise(() => {}));
            const queryResult = await navigator.locks.query();
            return queryResult.held[0].clientId;
        },
        retrieve: async () => {
            if (!navigator.locks) {
                throw new Error('Unsupported');
            }
            const queryResult = await navigator.locks.query();
            return queryResult.held[0].name;
        },
        validate: validateStorageAPI
    },
    'Fetch Cache': {
        type: 'cache',
        store: async (data) => {
            await fetch(getURL('resource', { fileType: 'fetch', key: data }),
                { cache: 'force-cache' }
            );
        },
        retrieve: async (data) => {
            await fetch(getURL('resource', { fileType: 'fetch', key: data }),
                { cache: 'force-cache' }
            );
            const countResponse = await fetch(getURL('ctr', { fileType: 'fetch', key: data }),
                { cache: 'reload' }
            );
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'XMLHttpRequest Cache': {
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.addEventListener('load', resolve, { once: true });
            req.open('GET', getURL('resource', { fileType: 'xhr', key: key }));
            req.setRequestHeader('Cache-Control', 'max-age=604800');
            req.send();
        }),
        retrieve: async (key) => {
            const req = new XMLHttpRequest();
            const xhrLoadPromise = new Promise((resolve, reject) => {
                req.addEventListener('load', resolve, { once: true });
            });
            req.open('GET', getURL('resource', { fileType: 'xhr', key: key }));
            req.setRequestHeader('Cache-Control', 'max-age=604800');
            req.send();
            await xhrLoadPromise;
            const countResponse = await fetch(
                getURL('ctr', { fileType: 'xhr', key: key }), { cache: 'reload' });
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'Iframe Cache': {
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            iframe.addEventListener('load', () => resolve(key), { once: true });
            iframe.src = getURL('resource', { fileType: 'page', key: key });
        }),
        retrieve: async (key) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            const iframeLoadPromise = new Promise((resolve, reject) => {
                iframe.addEventListener('load', resolve, { once: true });
            });
            const address = getURL('resource', { fileType: 'page', key: key });
            iframe.src = address;
            await iframeLoadPromise;
            const countResponse = await fetch(
                getURL('ctr', { fileType: 'page', key: key }), { cache: 'reload' });
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'Image Cache': {
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const img = document.createElement('img');
            document.body.appendChild(img);
            img.addEventListener('load', resolve, { once: true });
            img.src = getURL('resource', { fileType: 'image', key: key });
        }),
        retrieve: async (key) => {
            const img = document.createElement('img');
            document.body.appendChild(img);
            const imgLoadPromise = new Promise((resolve, reject) => {
                img.addEventListener('load', resolve, { once: true });
            });
            img.src = getURL('resource', { fileType: 'image', key: key });
            await imgLoadPromise;
            const countResponse = await fetch(
                getURL('ctr', { fileType: 'image', key: key }), { cache: 'reload' });
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'Favicon Cache': {
        type: 'cache',
        store: () => {}, // noop since the favicon is set in the top-level frame
        retrieve: async (key) => {
            // Wait for the favicon to load.
            // Unfortunately onload doesn't seem to fire for <link> elements, so
            // there isn't a way to do this synchronously.
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', { filetype: 'favicon', key: key }), { cache: 'reload' });
            const count = parseInt((await response.text()).trim());
            if (count === 0) {
                throw new Error('No requests received');
            }
            return count;
        },
        validate: validateCacheAPI
    },
    'Font Cache': {
        type: 'cache',
        store: async (key) => {
            const style = document.createElement('style');
            style.type = 'text/css';
            const fontURI = getURL('resource', { fileType: 'font', key: key });
            style.innerHTML = `@font-face {font-family: "myFont"; src: url("${fontURI}"); } body { font-family: "myFont" }`;
            document.getElementsByTagName('head')[0].appendChild(style);
        },
        retrieve: async (key) => {
            const style = document.createElement('style');
            style.type = 'text/css';
            const fontURI = getURL('resource', { fileType: 'font', key: key });
            style.innerHTML = `@font-face {font-family: "myFont"; src: url("${fontURI}"); } body { font-family: "myFont" }`;
            document.getElementsByTagName('head')[0].appendChild(style);
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', { fileType: 'font', key: key }), { cache: 'reload' });
            return parseInt((await response.text()).trim());
        },
        validate: validateCacheAPI
    },
    'CSS cache': {
        type: 'cache',
        store: async (key) => {
            const href = getURL('resource', { fileType: 'css', key: key });
            const head = document.getElementsByTagName('head')[0];
            head.innerHTML += `<link type="text/css" rel="stylesheet" href="${href}">`;
        },
        retrieve: async (key) => {
            const href = getURL('resource', { fileType: 'css', key: key });
            const head = document.getElementsByTagName('head')[0];
            head.innerHTML += `<link type="text/css" rel="stylesheet" href="${href}">`;
            const testElement = document.querySelector('#css');
            let fontFamily;
            while (true) {
                await sleepMs(100);
                fontFamily = getComputedStyle(testElement).fontFamily;
                if (fontFamily.startsWith('fake')) {
                    break;
                }
            }
            return fontFamily;
        },
        validate: (sameSites, crossSites) => {
            //  same-site: [ { "value": "fake_652798686603804" }, { "value": "fake_652798686603804" } ]
            // cross-site: [ { "value": "fake_35491713503664246" }, { "value": "fake_35491713503664246" } ]
            if (
                (sameSites.every(v => (v.value !== null) && (v.value.startsWith('fake_')))) &&
                (crossSites.every(v => (v.value !== null) && (v.value.startsWith('fake_')))) &&
                (sameSites.every(v => v.value === sameSites[0].value)) &&
                (crossSites.every(v => v.value === crossSites[0].value)) &&
                (crossSites.every(v => v.value !== sameSites[0].value))
            ) {
                return 'pass';
            } else if (
                (sameSites.every(v => (v.value !== null) && (v.value.startsWith('fake_')))) &&
                (crossSites.every(v => (v.value !== null) && (v.value.startsWith('fake_')))) &&
                (sameSites.every(v => v.value === sameSites[0].value)) &&
                (crossSites.every(v => v.value === crossSites[0].value)) &&
                (crossSites.every(v => v.value === sameSites[0].value))
            ) {
                return 'fail';
            }
            return 'error';
        }
    },
    'Prefetch Cache': {
        type: 'cache',
        store: async (key) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = getURL('resource', { fileType: 'prefetch', key: key });
            document.getElementsByTagName('head')[0].appendChild(link);
        },
        retrieve: async (key) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = getURL('resource', { fileType: 'prefetch', key: key }).href;
            document.getElementsByTagName('head')[0].appendChild(link);
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', { fileType: 'prefetch', key: key }), { cache: 'reload' });
            const count = parseInt((await response.text()).trim());
            if (count === 0) {
                throw new Error('No requests received');
            }
            return count;
        },
        validate: validateCacheAPI
    },
    HSTS: {
        type: 'hsts',
        store: async () => {
            // Clear any current HSTS
            const clearURL = new URL('/partitioning/clear_hsts.png', `https://hsts.${FIRST_PARTY_HOSTNAME}/`);
            await loadSubresource('img', clearURL.href);

            // Set HSTS
            const setURL = new URL('/partitioning/set_hsts.png', `https://hsts.${FIRST_PARTY_HOSTNAME}/`);
            await loadSubresource('img', setURL.href);
        },
        retrieve: async () => {
            // Attempt to retrieve an image over HTTP
            // The retrieval will fail if not upgraded to HTTPS by the browser.
            const getURL = new URL('/partitioning/get_hsts.png', `http://hsts.${FIRST_PARTY_HOSTNAME}/`);
            const event = await loadSubresource('img', getURL.href);
            if (event.type === 'load') {
                return 'https';
            } else if (event.type === 'error') {
                return 'http';
            }
        },
        validate: (sameSites, crossSites) => {
            //  same-site: [ { "value": "https" }, { "value": "https" } ]
            // cross-site: [ { "value": "http" }, { "value": "http" } ]
            if ( // browser allows subresources to set HSTS, but partitions cross-site
                (sameSites.every(v => v.value === 'https')) &&
                (crossSites.every(v => v.value === 'http'))
            ) {
                return 'pass';
            } else if ( // browser doesn't allow subresources to set HSTS (be careful with false positives)
                (sameSites.every(v => v.value === 'http')) &&
                (crossSites.every(v => v.value === 'http'))
            ) {
                return 'pass';
            } else if (
                (sameSites.every(v => v.value === 'https')) &&
                (crossSites.every(v => v.value === 'https'))
            ) {
                return 'fail';
            }
            return 'error';
        }
    }
};
