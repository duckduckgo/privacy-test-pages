const THIRD_PARTY_DOMAIN = 'https://other.localhost:3000';

const storeButton = document.querySelector('#store');
const retriveButton = document.querySelector('#retrive');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsElement = document.querySelector('#tests-details');

// object that contains results of all tests
const results = {
    page: 'storage-blocking',
    date: null,
    results: []
};

const tests = [
    {
        id: 'JS cookie',
        store: (data) => {
            document.cookie = `jsdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC; Secure; SameSite=Lax`;
        },
        retrive: () => {
            return document.cookie.match(/jsdata\=([0-9]+)/)[1];
        }
    },
    {
        id: 'header cookie',
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
                .then(data => data.headers.cookie.match(/headerdata\=([0-9]+)/)[1]);
        }
    },
    {
        id: 'third party header cookie',
        store: (data) => {
            return fetch(`${THIRD_PARTY_DOMAIN}/set-cookie?value=${data}`, {credentials: 'include'}).then(r => {
                if (!r.ok) {
                    throw new Error('Request failed.');
                }
            });
        },
        retrive: () => {
            return fetch(`${THIRD_PARTY_DOMAIN}/reflect-headers`, {credentials: 'include'})
                .then(r => r.json())
                .then(data => data.headers.cookie.match(/headerdata\=([0-9]+)/)[1]);
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
        id: 'third party iframe',
        store: (data) => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const iframe = document.createElement('iframe');
            iframe.src = `${THIRD_PARTY_DOMAIN}/privacy-protections/storage-blocking/iframe.html?data=${data}`;
            iframe.style.width = '10px';
            iframe.style.height = '10px';
            let failTimeout = null;

            function cleanUp(msg) {
                if (msg.data) {
                    resolve(msg.data);

                    clearTimeout(failTimeout);
                    document.body.removeChild(iframe);
                    window.removeEventListener('message', cleanUp);
                }
            }

            window.addEventListener('message', cleanUp);
            iframe.addEventListener('load', () => {
                console.log(this.contentDocument);
                failTimeout = setTimeout(() => reject('timeout'), 1000);
            });

            document.body.appendChild(iframe);

            return promise;
        },
        retrive: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const iframe = document.createElement('iframe');
            iframe.src = `${THIRD_PARTY_DOMAIN}/privacy-protections/storage-blocking/iframe.html`;
            iframe.style.width = '10px';
            iframe.style.height = '10px';
            let failTimeout = null;

            function cleanUp(msg) {
                if (msg.data) {
                    resolve(msg.data);

                    clearTimeout(failTimeout);
                    document.body.removeChild(iframe);
                    window.removeEventListener('message', cleanUp);
                }
            }

            window.addEventListener('message', cleanUp);
            iframe.addEventListener('load', () => {
                console.log(this.contentDocument);
                failTimeout = setTimeout(() => reject('timeout'), 1000);
            });

            document.body.appendChild(iframe);

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
        id: 'browser cache',
        store: (data) => {
            // already done before all tests
        },
        retrive: () => {
            return fetch('/cached-random-number', {cache: 'force-cache'}).then(r => r.text());
        }
    },
    {
        id: 'memory',
        store: (data) => {
            window.randomNumber = data;
        },
        retrive: () => {
            return window.randomNumber;
        }
    },
    {
        id: 'window.name',
        store: (data) => {
            window.name = data;
        },
        retrive: () => {
            return window.name;
        }
    },
    {
        id: 'history',
        store: (data) => {
            history.pushState({data: data}, 'data', `#${data}`);
        },
        retrive: () => {
            if (history.state) {
                return history.state.data;
            }

            const hash = (new URL(location.href)).hash;

            if (hash) {
                return hash.replace('#', '');
            }
        }
    },
    {
        id: 'service worker',
        store: (data) => {
            return navigator.serviceWorker.register(`./service-worker.js?data=${data}`, {scope: './'})
                .then(() => 'OK')
                .catch((error) => {
                    console.log('Registration failed with ' + error);
                });
        },
        retrive: () => {
            return fetch('./service-worker-data')
                .then(r => {
                    if (r.ok) {
                        return r.text();
                    }

                    throw new Error(`Invalid response (${r.status})`);
                });
        }
    }
];

function storeData() {
    storeButton.setAttribute('disabled', 'disabled');
    downloadButton.setAttribute('disabled', 'disabled');
    testsDiv.removeAttribute('hidden');

    let all = 0;
    let failed = 0;

    testsDetailsElement.innerHTML = '';

    function updateSummary(data) {
        testsSummaryDiv.innerText = `Stored random number "${data}" using ${all} storage mechanisms${failed > 0 ? ` (${failed} failed)` : ''}. Click for details.`;
    }

    fetch('/cached-random-number', {cache: 'reload'})
        .then(r => r.text())
        .then(randomNumber => {
            tests.forEach(test => {
                all++;

                const li = document.createElement('li');
                li.id = `test-${test.id.replace(' ', '-')}`;
                li.innerHTML = `${test.id} - <span class='value'>OK</span>`;
                const valueSpan = li.querySelector('.value');

                testsDetailsElement.appendChild(li);

                try {
                    const result = test.store(randomNumber);
        
                    if (result instanceof Promise) {
                        valueSpan.innerText = '…';

                        result
                            .then(result => {
                                if (Array.isArray(result)) {
                                    valueSpan.innerHTML = `<ul>${result.map(r => `<li>${r.test} - ${r.result}</li>`).join('')}</ul>`;
                                } else if (result && result !== 'OK') {
                                    valueSpan.innerHTML = JSON.stringify(result, null, 2);
                                } else {
                                    valueSpan.innerText = 'OK';
                                }
                            })
                            .catch(e => {
                                valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;

                                failed++;
                                updateSummary(randomNumber)
                            });
                    }
                } catch(e) {
                    valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
                    failed++;
                }
            });

            updateSummary(randomNumber);
            storeButton.removeAttribute('disabled');
        });
}

function retrieveData() {
    testsDiv.removeAttribute('hidden');

    results.results.length = 0;
    results.date = (new Date()).toUTCString();

    let all = 0;
    let failed = 0;

    testsDetailsElement.innerHTML = '';

    function updateSummary() {
        testsSummaryDiv.innerText = `Retrieved data from ${all} storage mechanisms${failed > 0 ? ` (${failed} failed)` : ''}. Click for details.`;
    }

    tests.forEach(test => {
        all++;

        const resultObj = {
            id: test.id,
            value: null
        };
        results.results.push(resultObj);

        const li = document.createElement('li');
        li.id = `test-${test.id.replace(' ', '-')}`;
        li.innerHTML = `${test.id} - <span class='value'>…</span>`;
        const valueSpan = li.querySelector('.value');

        testsDetailsElement.appendChild(li);

        try {
            const result = test.retrive();

            if (result instanceof Promise) {
                result
                    .then(data => {
                        if (Array.isArray(data)) {
                            valueSpan.innerHTML = `<ul>${data.map(r => `<li>${r.test} - ${r.result}</li>`).join('')}</ul>`;
                        } else if (data) {
                            valueSpan.innerHTML = JSON.stringify(data, null, 2);
                        }

                        resultObj.value = data;
                    })
                    .catch(e => {
                        failed++;
                        valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
                        updateSummary();
                    });
            } else {
                valueSpan.innerText = JSON.stringify(result, null, 2) || undefined;
                resultObj.value = result || null;
            }
        } catch(e) {
            failed++;
            valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
        }
    });

    updateSummary();
    downloadButton.removeAttribute('disabled');
}

function downloadTheResults() {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], {type: 'application/json'}));
    a.href = url;
    a.download = 'fingerprinting-results.json';
    
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
storeButton.addEventListener('click', () => storeData());
retriveButton.addEventListener('click', () => retrieveData());

// if url contains 'run-tests'
if (document.location.search === '?run') {
    storeData();
}
