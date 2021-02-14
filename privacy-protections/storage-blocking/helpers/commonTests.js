/* exported commonTests */
// tests that are common for both main frame and an iframe
const commonTests = [
    {
        id: 'JS cookie',
        store: (data) => {
            // we are using same set of tests for main frame and an iframe
            // we want to set 'Lax' in the main frame for the cookie not to be suspicious
            // we want to set 'None' in an iframe for cookie to be accessible to us
            const sameSite = (window !== window.top) ? 'None' : 'Lax'

            document.cookie = `jsdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC; Secure; SameSite=${sameSite}`
        },
        retrive: () => {
            return document.cookie.match(/jsdata=([0-9]+)/)[1]
        }
    },
    {
        id: 'localStorage',
        store: (data) => {
            localStorage.setItem('data', data)
        },
        retrive: () => {
            return localStorage.getItem('data')
        }
    },
    {
        id: 'sessionStorage',
        store: (data) => {
            sessionStorage.setItem('data', data)
        },
        retrive: () => {
            return sessionStorage.getItem('data')
        }
    },
    {
        id: 'IndexedDB',
        store: (data) => {
            return DB('data').then(db => Promise.all([db.deleteAll(), db.put({ id: data })])).then(() => 'OK')
        },
        retrive: () => {
            return DB('data').then(db => db.getAll()).then(data => data[0].id)
        }
    },
    {
        id: 'WebSQL',
        store: (data) => {
            let res, rej
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject })

            const db = openDatabase('data', '1.0', 'data', 2 * 1024 * 1024)

            db.transaction(tx => {
                tx.executeSql('CREATE TABLE IF NOT EXISTS data (value)', [], () => {
                    tx.executeSql('DELETE FROM data;', [], () => {
                        tx.executeSql('INSERT INTO data (value) VALUES (?)', [data], () => res(), (sql, e) => rej('err - insert ' + e.message))
                    }, (sql, e) => rej('err - delete ' + e.message))
                }, (sql, e) => rej('err - create ' + e.message))
            })

            return promise
        },
        retrive: () => {
            let res, rej
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject })

            const db = openDatabase('data', '1.0', 'data', 2 * 1024 * 1024)

            db.transaction(tx => {
                tx.executeSql('SELECT * FROM data', [], (tx, d) => {
                    res(d.rows[0].value)
                }, (sql, e) => rej('err - select ' + e.message))
            })

            return promise
        }
    },
    {
        id: 'Cache API',
        store: (data) => {
            return caches.open('data').then((cache) => {
                const res = new Response(data, {
                    status: 200
                })

                return cache.put('/cache-api-response', res)
            })
        },
        retrive: () => {
            return caches.open('data').then((cache) => {
                return cache.match('/cache-api-response')
                    .then(r => r.text())
            })
        }
    }
]
