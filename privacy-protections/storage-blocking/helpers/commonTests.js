/* exported commonTests */
/* global cookieStore, THIRD_PARTY_TRACKER_ORIGIN, THIRD_PARTY_ORIGIN */

// tests that are common for both main frame and an iframe
const commonTests = [
    {
        id: 'first party header cookie',
        store: (data) => {
            return fetch(`/set-cookie?value=${data}`).then(r => {
                if (!r.ok) {
                    throw new Error('Request failed.');
                }
            });
        },
        retrive: () => {
            return fetch('/reflect-headers')
                .then(r => r.json())
                .then(data => data.headers.cookie.match(/headerdata=([0-9]+)/)[1]);
        }
    },
    {
        id: 'safe third party header cookie',
        store: (data) => {
            return fetch(`${THIRD_PARTY_ORIGIN}/set-cookie?value=${data}`, { credentials: 'include' }).then(r => {
                if (!r.ok) {
                    throw new Error('Request failed.');
                }
            });
        },
        retrive: () => {
            return fetch(`${THIRD_PARTY_ORIGIN}/reflect-headers`, { credentials: 'include' })
                .then(r => r.json())
                .then(data => data.headers.cookie.match(/headerdata=([0-9]+)/)[1]);
        }
    },
    {
        id: 'tracking third party header cookie',
        store: (data) => {
            return fetch(`${THIRD_PARTY_TRACKER_ORIGIN}/set-cookie?value=${data}`, { credentials: 'include' }).then(r => {
                if (!r.ok) {
                    throw new Error('Request failed.');
                }
            });
        },
        retrive: () => {
            return fetch(`${THIRD_PARTY_TRACKER_ORIGIN}/reflect-headers`, { credentials: 'include' })
                .then(r => r.json())
                .then(data => data.headers.cookie.match(/headerdata=([0-9]+)/)[1]);
        }
    },
    {
        id: 'JS cookie',
        store: (data) => {
            // we are using same set of tests for main frame and an iframe
            // we want to set 'Lax' in the main frame for the cookie not to be suspicious
            // we want to set 'None' in an iframe for cookie to be accessible to us
            const sameSite = (window !== window.top) ? 'None' : 'Lax';

            document.cookie = `jsdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC; Secure; SameSite=${sameSite}`;
        },
        retrive: () => {
            return document.cookie.match(/jsdata=([0-9]+)/)[1];
        },
        extra: () => {
            if (window.cookieStore) {
                return cookieStore.get('jsdata').then(cookie => {
                    return 'expires in ' + ((cookie.expires - Date.now()) / (1000 * 60 * 60 * 24)).toFixed(2) + ' days';
                });
            }
        }
    },
    {
        id: 'localStorage',
        store: (data) => {
            localStorage.setItem('data', data);
        },
        retrive: () => {
            return localStorage.getItem('data');
        }
    },
    {
        id: 'sessionStorage',
        store: (data) => {
            sessionStorage.setItem('data', data);
        },
        retrive: () => {
            return sessionStorage.getItem('data');
        }
    },
    {
        id: 'IndexedDB',
        store: (data) => {
            return DB('data').then(db => Promise.all([db.deleteAll(), db.put({ id: data })])).then(() => 'OK');
        },
        retrive: () => {
            return DB('data').then(db => db.getAll()).then(data => data[0].id);
        }
    },
    {
        id: 'WebSQL',
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
        retrive: () => {
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
        id: 'Cache API',
        store: (data) => {
            return caches.open('data').then((cache) => {
                const res = new Response(data, {
                    status: 200
                });

                return cache.put('/cache-api-response', res);
            });
        },
        retrive: () => {
            return caches.open('data').then((cache) => {
                return cache.match('/cache-api-response')
                    .then(r => r.text());
            });
        }
    },
    {
        id: 'CookieStore',
        store: (data) => {
            return cookieStore.set({
                name: 'cookiestoredata',
                value: data,
                expires: new Date('Wed, 21 Aug 2030 20:00:00 UTC').getTime()
            });
        },
        retrive: async () => {
            return (await cookieStore.get('cookiestoredata')).value;
        },
        extra: () => {
            if (window.cookieStore) {
                return cookieStore.get('cookiestoredata').then(cookie => {
                    return 'expires in ' + ((cookie.expires - Date.now()) / (1000 * 60 * 60 * 24)).toFixed(2) + ' days';
                });
            }
        }
    }
];
