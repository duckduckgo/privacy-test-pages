/* exported storgeAPIs */

const timeout = 1000; // ms; used for cross-tab communication APIs

const storgeAPIs = [
    {
        name: 'document.cookie',
        store: (data) => {
            // we are using same set of tests for main frame and an iframe
            // we want to set 'Lax' in the main frame for the cookie not to be suspicious
            // we want to set 'None' in an iframe for cookie to be accessible to us
            const sameSite = (window !== window.top) ? 'None' : 'Lax';

            document.cookie = `jsdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC; Secure; SameSite=${sameSite}`;
        },
        retrieve: () => {
            return document.cookie.match(/jsdata=([0-9]+)/)[1];
        }
    },
    {
        name: 'localStorage',
        store: (data) => {
            localStorage.setItem('data', data);
        },
        retrieve: () => {
            return localStorage.getItem('data');
        }
    },
    {
        name: 'sessionStorage',
        store: (data) => {
            sessionStorage.setItem('data', data);
        },
        retrieve: () => {
            return sessionStorage.getItem('data');
        }
    },
    {
        name: 'IndexedDB',
        store: (data) => {
            return DB('data').then(db => Promise.all([db.deleteAll(), db.put({ id: data })])).then(() => 'OK');
        },
        retrieve: () => {
            return DB('data').then(db => db.getAll()).then(data => data[0].id);
        }
    },
    {
        name: 'WebSQL',
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
        name: 'BroadcastChannel',
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
        name: 'ServiceWorker',
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
        name: 'Web Locks API',
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
    }
];
