/* exported storageAPIs HSTS */

const timeout = 1000; // ms; used for cross-tab communication APIs

function getURL (path, fileType, key) {
    const url = new URL(`/partitioning/${path}`, window.location.origin);
    url.searchParams.set('fileType', fileType);
    url.searchParams.set('key', key);
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

const storageAPIs = [
    {
        name: 'document.cookie',
        type: 'storage',
        store: (data) => {
            // we are using same set of tests for main frame and an iframe
            // we want to set 'Lax' in the main frame for the cookie not to be suspicious
            // we want to set 'None' in an iframe for cookie to be accessible to us
            const sameSite = (window !== window.top) ? 'None' : 'Lax';

            document.cookie = `jsdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC; Secure; SameSite=${sameSite}`;
        },
        retrieve: () => {
            return document.cookie.match(/jsdata=([0-9a-z-]+)/)[1];
        }
    },
    {
        name: 'localStorage',
        type: 'storage',
        store: (data) => {
            localStorage.setItem('data', data);
        },
        retrieve: () => {
            return localStorage.getItem('data');
        }
    },
    {
        name: 'sessionStorage',
        type: 'storage',
        store: (data) => {
            sessionStorage.setItem('data', data);
        },
        retrieve: () => {
            return sessionStorage.getItem('data');
        }
    },
    {
        name: 'IndexedDB',
        type: 'storage',
        store: (data) => {
            return DB('data').then(db => Promise.all([db.deleteAll(), db.put({ id: data })])).then(() => 'OK');
        },
        retrieve: () => {
            return DB('data').then(db => db.getAll()).then(data => data[0].id);
        }
    },
    {
        name: 'WebSQL',
        type: 'storage',
        store: (data) => {
            let res, rej;
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject; });

            const db = openDatabase('data', '1.0', 'data', 2 * 1024 * 1024);

            db.transaction(tx => {
                tx.executeSql('CREATE TABLE IF NOT EXISTS data (value)', [], () => {
                    tx.executeSql('DELETE FROM data;', [], () => {
                        tx.executeSql('INSERT INTO data (value) VALUES (?)', [data], () => res(), (sql, e) => rej('err - insert ' + e.message));
                    }, (sql, e) => rej('err - delete ' + e.message));
                }, (sql, e) => rej('err - create ' + e.message));
            });

            return promise;
        },
        retrieve: () => {
            let res, rej;
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject; });

            const db = openDatabase('data', '1.0', 'data', 2 * 1024 * 1024);

            db.transaction(tx => {
                tx.executeSql('SELECT * FROM data', [], (tx, d) => {
                    res(d.rows[0].value);
                }, (sql, e) => rej('err - select ' + e.message));
            });

            return promise;
        }
    },
    {
        name: 'Cache API',
        type: 'storage',
        store: (data) => {
            return caches.open('data').then((cache) => {
                const res = new Response(data, {
                    status: 200
                });

                return cache.put('/cache-api-response', res);
            });
        },
        retrieve: () => {
            return caches.open('data').then((cache) => {
                return cache.match('/cache-api-response')
                    .then(r => r.text());
            });
        }
    },
    // Tests below here are inspired by: https://github.com/arthuredelstein/privacytests.org/
    {
        name: 'ServiceWorker',
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
        }
    },
    {
        name: 'BroadcastChannel',
        type: 'communication',
        store: (data) => {
            const bc = new BroadcastChannel('secret');
            bc.onmessage = (event) => {
                if (event.data === 'request') {
                    bc.postMessage(data);
                }
            };
        },
        retrieve: () => {
            return new Promise((resolve, reject) => {
                const bc = new BroadcastChannel('secret');
                bc.onmessage = (event) => {
                    if (event.data !== 'request') {
                        resolve(event.data);
                    }
                };
                bc.postMessage('request');
                setTimeout(() => {
                    console.log('reject - bc');
                    reject(new Error(`No BroadcastChannel message received within timeout ${timeout}`));
                }, timeout);
            });
        }
    },
    {
        name: 'SharedWorker',
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
                    console.log('reject - shared worker');
                    reject(new Error(`No Shared Worker message received within timeout ${timeout}`));
                }, timeout);
            });
        }
    },
    {
        name: 'Web Locks API',
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
        }
    },
    {
        name: 'Fetch Cache',
        type: 'cache',
        store: async (data) => {
            await fetch(getURL('resource', 'fetch', data),
                { cache: 'force-cache' }
            );
        },
        retrieve: async (data) => {
            await fetch(getURL('resource', 'fetch', data),
                { cache: 'force-cache' }
            );
            const countResponse = await fetch(getURL('ctr', 'fetch', data),
                { cache: 'reload' }
            );
            return (await countResponse.text()).trim();
        }
    },
    {
        name: 'XMLHttpRequest cache',
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.addEventListener('load', resolve, { once: true });
            req.open('GET', getURL('resource', 'xhr', key));
            req.setRequestHeader('Cache-Control', 'max-age=604800');
            req.send();
        }),
        retrieve: async (key) => {
            const req = new XMLHttpRequest();
            const xhrLoadPromise = new Promise((resolve, reject) => {
                req.addEventListener('load', resolve, { once: true });
            });
            req.open('GET', getURL('resource', 'xhr', key));
            req.setRequestHeader('Cache-Control', 'max-age=604800');
            req.send();
            await xhrLoadPromise;
            const countResponse = await fetch(
                getURL('ctr', 'xhr', key), { cache: 'reload' });
            return (await countResponse.text()).trim();
        }
    },
    {
        name: 'Iframe Cache',
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            iframe.addEventListener('load', () => resolve(key), { once: true });
            iframe.src = getURL('resource', 'page', key);
        }),
        retrieve: async (key) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            const iframeLoadPromise = new Promise((resolve, reject) => {
                iframe.addEventListener('load', resolve, { once: true });
            });
            const address = getURL('resource', 'page', key);
            iframe.src = address;
            await iframeLoadPromise;
            const response = await fetch(
                getURL('ctr', 'page', key), { cache: 'reload' });
            return (await response.text()).trim();
        }
    },
    {
        name: 'Image Cache',
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const img = document.createElement('img');
            document.body.appendChild(img);
            img.addEventListener('load', resolve, { once: true });
            img.src = getURL('resource', 'image', key);
        }),
        retrieve: async (key) => {
            const img = document.createElement('img');
            document.body.appendChild(img);
            const imgLoadPromise = new Promise((resolve, reject) => {
                img.addEventListener('load', resolve, { once: true });
            });
            img.src = getURL('resource', 'image', key);
            await imgLoadPromise;
            const response = await fetch(
                getURL('ctr', 'image', key), { cache: 'reload' });
            return (await response.text()).trim();
        }
    },
    {
        name: 'Favicon Cache',
        type: 'cache',
        store: () => {}, // noop since the favicon is set in the top-level frame
        retrieve: async (key) => {
            // Wait for the favicon to load.
            // Unfortunately onload doesn't seem to fire for <link> elements, so
            // there isn't a way to do this synchronously.
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', 'favicon', key), { cache: 'reload' });
            const count = (await response.text()).trim();
            if (count === '0') {
                throw new Error('No requests received');
            }
            return count;
        }
    },
    {
        name: 'Font Cache',
        type: 'cache',
        store: async (key) => {
            const style = document.createElement('style');
            style.type = 'text/css';
            const fontURI = getURL('resource', 'font', key);
            style.innerHTML = `@font-face {font-family: "myFont"; src: url("${fontURI}"); } body { font-family: "myFont" }`;
            document.getElementsByTagName('head')[0].appendChild(style);
        },
        retrieve: async (key) => {
            const style = document.createElement('style');
            style.type = 'text/css';
            const fontURI = getURL('resource', 'font', key);
            style.innerHTML = `@font-face {font-family: "myFont"; src: url("${fontURI}"); } body { font-family: "myFont" }`;
            document.getElementsByTagName('head')[0].appendChild(style);
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', 'font', key), { cache: 'reload' });
            return (await response.text()).trim();
        }
    },
    {
        name: 'CSS cache',
        type: 'cache',
        store: async (key) => {
            const href = getURL('resource', 'css', key);
            const head = document.getElementsByTagName('head')[0];
            head.innerHTML += `<link type="text/css" rel="stylesheet" href="${href}">`;
        },
        retrieve: async (key) => {
            const href = getURL('resource', 'css', key);
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
        }
    },
    {
        name: 'Prefetch Cache',
        type: 'cache',
        store: async (key) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = getURL('resource', 'prefetch', key);
            document.getElementsByTagName('head')[0].appendChild(link);
        },
        retrieve: async (key) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = getURL('resource', 'prefetch', key).href;
            document.getElementsByTagName('head')[0].appendChild(link);
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', 'prefetch', key), { cache: 'reload' });
            const countString = (await response.text()).trim();
            if (parseInt(countString) === 0) {
                throw new Error('No requests received');
            }
            return countString;
        }
    },
    {
        name: 'HSTS',
        type: 'hsts',
        store: async () => {
            // TODO: need to move this somewhere global
            const clearURL = new URL('/partitioning/clear_hsts.png', 'https://localhost:443/');
            const setURL = new URL('/partitioning/set_hsts.png', 'https://localhost:443/');
            const getURL = new URL('/partitioning/get_hsts.png', 'http://localhost:3000/');

            // Clear any current HSTS
            await loadSubresource('img', clearURL.href);

            const result1 = await loadSubresource('img', getURL.href);
            console.log('HSTS - pre set', result1.type);

            await loadSubresource('img', setURL.href);

            getURL.searchParams.set('foo', 'bust');
            const result2 = await loadSubresource('img', getURL.href);
            console.log('HSTS - post set', result2.type);
        },
        retrieve: async () => {
            // TODO: need to move this somewhere global
            const getURL = new URL('/partitioning/get_hsts.png', 'http://localhost:3000/');
            const event = await loadSubresource('img', getURL.href);
            if (event.type === 'load') {
                return 'https';
            } else if (event.type === 'error') {
                return 'http';
            }
        }
    }
];
