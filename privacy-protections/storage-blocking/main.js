const storeButton = document.querySelector('#store');
const retriveButton = document.querySelector('#retrive');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsDiv = document.querySelector('#tests-details');

const randomNumber = Math.round(Math.random() * 1000);

// object that contains results of all tests
const results = {
    page: 'storage-blocking',
    date: null,
    results: []
};

const tests = [
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
        id: 'cookie-js',
        store: (data) => {
            document.cookie = `jsdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC`;
        },
        retrive: () => {
            return document.cookie.match(/jsdata\=([0-9]+)/)[1];
        }
    },
    {
        id: 'IndexedDB',
        store: (data) => {
            return DB('data').then(db => {
                db.deleteAll();
                db.put({ id: data })
            });
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
    }
]

/**
 * Test runner
 */
function runTests() {
    startButton.setAttribute('disabled', 'disabled');
    downloadButton.removeAttribute('disabled');
    testsDiv.removeAttribute('hidden');

    results.results.length = 0;
    results.date = (new Date()).toUTCString();
    let all = 0;
    let failed = 0;

    testsDetailsDiv.innerHTML = '';

    function updateSummary() {
        testsSummaryDiv.innerText = `Collected ${all} datapoints${failed > 0 ? ` (${failed} failed)` : ''}. Click for details.`;
    }

    tests.forEach(test => {
        all++;

        const resultObj = {
            id: test.id,
            category: test.category
        };
        results.results.push(resultObj);

        let categoryUl = document.querySelector(`.category-${test.category} ul`);

        if (!categoryUl) {
            const category = document.createElement('div');
            category.classList.add(`category-${test.category}`);
            category.innerText = test.category;
            categoryUl = document.createElement('ul');
            category.appendChild(categoryUl);

            testsDetailsDiv.appendChild(category);
        }

        const li = document.createElement('li');
        li.id = `test-${test.category}-${test.id}`;
        li.innerHTML = `${test.id} - <span class='value'></span>`;
        const valueSpan = li.querySelector('.value');

        categoryUl.appendChild(li);

        try {
            const value = test.getValue();

            if (value instanceof Promise) {
                value.then(v => {
                    valueSpan.innerHTML = `(${Array.isArray(v) ? 'array' : (typeof v)}) - <code>${JSON.stringify(v, null, 2)}</code>`;
                    resultObj.value = v;
                }).catch(e => {
                    valueSpan.innerHTML = `❌ error thrown ("${e}")`;
                    failed++;
                    updateSummary();
                });
            } else {
                valueSpan.innerHTML = `(${Array.isArray(value) ? 'array' : (typeof value)}) - <code>${JSON.stringify(value, null, 2)}</code>`;
                resultObj.value = value;
            }
        } catch (e) {
            valueSpan.innerHTML = `❌ error thrown ("${e}")`;
            failed++;
        }
    });

    updateSummary();

    startButton.removeAttribute('disabled');
    saveToLS.removeAttribute('disabled');
    compareWithFile.removeAttribute('disabled');

    // when there is data in localStorage enable comparing with localStorage
    if (localStorage.getItem('results')) {
        compareWithLS.removeAttribute('disabled');
    }
}

function storeData() {
    tests.forEach(test => {
        try {
            const result = test.store(randomNumber);

            if (result instanceof Promise) {
                result.catch(e => {
                    console.log(test.id, 'failed', `(${e.message ? e.message : e})`);
                });
            }
        } catch(e) {
            console.log(test.id, 'failed', `(${e.message ? e.message : e})`);
        }
    });
}

function retrieveData() {
    tests.forEach(test => {
        try {
            const result = test.retrive();

            if (result instanceof Promise) {
                result
                    .then(data => {
                        console.log(test.id, data);
                    })
                    .catch(e => {
                        console.log(test.id, 'failed', `(${e.message ? e.message : e})`);
                    });
            } else {
                console.log(test.id, result);
            }
        } catch(e) {
            console.log(test.id, 'failed', `(${e.message ? e.message : e})`);
        }
    });
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
