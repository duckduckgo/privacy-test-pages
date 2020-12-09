const tests = [
    {
        id: 'JS cookie',
        store: (data) => {
            document.cookie = `jsdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC`;
        },
        retrive: () => {
            return document.cookie.match(/jsdata\=([0-9]+)/)[1];
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
            return DB('data').then(db => Promise.all([db.deleteAll(), db.put({ id: data })])).then(() => "OK");
        },
        retrive: () => {
            return DB('data').then(db => db.getAll()).then(data => data[0].id);
        }
    },
    {
        id: 'WebSQL',
        store: (data) => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const db = openDatabase('data', '1.0', 'data', 2 * 1024 * 1024);

            db.transaction(tx => {   
                tx.executeSql('CREATE TABLE IF NOT EXISTS data (value)', [], () => {
                    tx.executeSql('DELETE FROM data;', [], () => {
                            tx.executeSql('INSERT INTO data (value) VALUES (?)', [data], () => resolve(), (sql, e) => reject('err - insert ' + e.message));
                    }, (sql, e) => reject('err - delete ' + e.message)); 
                }, (sql, e) => reject('err - create ' + e.message)); 
            });

            return promise;
        },
        retrive: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const db = openDatabase('data', '1.0', 'data', 2 * 1024 * 1024);

            db.transaction(tx => {   
                tx.executeSql('SELECT * FROM data', [], (tx, d) => {
                    resolve(d.rows[0].value);
                }, (sql, e) => reject('err - select ' + e.message));
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
    }
]

function storeData(randomNumber) {
    return Promise.all(tests.map(test => {
        try {
            const result = test.store(randomNumber);

            if (result instanceof Promise) {
                return result
                    .then(() => ({
                        test: test.id,
                        result: 'OK'
                    }))
                    .catch(e => ({
                        test: test.id,
                        result: e.message
                    }));
            } else {
                return Promise.resolve({
                    test: test.id,
                    result: 'OK'
                });
            }
        } catch(e) {
            return Promise.resolve({
                test: test.id,
                result: e.message ? e.message : e
            });
        }
    }));
}

function retrieveData() {
    return Promise.all(tests.map(test => {
        try {
            const result = test.retrive();

            if (result instanceof Promise) {
                return result
                    .then(value => ({
                        test: test.id,
                        result: value
                    }))
                    .catch(e => ({
                        test: test.id,
                        result: e.message
                    }));
            } else {
                return Promise.resolve({
                    test: test.id,
                    result: result
                });
            }
        } catch(e) {
            return Promise.resolve({
                test: test.id,
                result: e.message ? e.message : e
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
}
// otherwise retrive the number
else {
    retrieveData()
        .then(result => {
            window.parent.postMessage(result, '*');
        });
}