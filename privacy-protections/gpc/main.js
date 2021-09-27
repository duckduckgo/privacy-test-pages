const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsDiv = document.querySelector('#tests-details');

// object that contains results of all tests
const results = {
    page: 'gpc',
    date: null,
    results: []
};

const tests = [
    {
        id: 'top frame header',
        run: () => {
            let res;
            const promise = new Promise((resolve, reject) => { res = resolve; });

            const otherWindow = window.open('/reflect-headers');

            otherWindow.addEventListener('load', () => {
                const payload = JSON.parse(otherWindow.document.body.innerText);

                res(payload.headers['sec-gpc']);

                otherWindow.close();
            });

            return promise;
        }
    },
    {
        id: 'top frame JS API',
        run: () => {
            return navigator.globalPrivacyControl;
        }
    },
    {
        id: 'frame header',
        run: () => {
            let res;
            const promise = new Promise((resolve, reject) => { res = resolve; });

            const iframe = document.createElement('iframe');
            iframe.src = '/reflect-headers';
            iframe.style.width = '10px';
            iframe.style.height = '10px';

            document.body.appendChild(iframe);

            iframe.addEventListener('load', () => {
                const payload = JSON.parse(iframe.contentDocument.body.innerText);

                res(payload.headers['sec-gpc']);
            });

            return promise;
        }
    },
    {
        id: 'frame JS API',
        run: () => {
            let res;
            const promise = new Promise((resolve, reject) => { res = resolve; });

            const iframe = document.createElement('iframe');
            iframe.src = '/reflect-headers';
            iframe.style.width = '10px';
            iframe.style.height = '10px';

            document.body.appendChild(iframe);

            iframe.addEventListener('load', () => {
                res(iframe.contentWindow.navigator.globalPrivacyControl);
            });

            return promise;
        }
    },
    {
        id: 'subequest header',
        run: () => {
            return fetch('/reflect-headers')
                .then(r => r.json())
                .then(data => data.headers['sec-gpc']);
        }
    }
];

/**
 * Test runner
 */
function runTests () {
    startButton.setAttribute('disabled', 'disabled');
    downloadButton.removeAttribute('disabled');
    testsDiv.removeAttribute('hidden');

    results.results.length = 0;
    results.date = (new Date()).toUTCString();
    let all = 0;
    let failed = 0;

    testsDetailsDiv.innerHTML = '';

    function updateSummary () {
        testsSummaryDiv.innerText = `Performed ${all} tests${failed > 0 ? ` (${failed} failed)` : ''}. Click for details.`;
    }

    for (const test of tests) {
        const resultObj = {
            id: test.id,
            value: null
        };
        results.results.push(resultObj);

        const li = document.createElement('li');
        li.id = `test-${test.id.replace(' ', '-')}`;
        li.innerHTML = `${test.id} - <span class='value'>…</span>`;
        const valueSpan = li.querySelector('.value');

        testsDetailsDiv.appendChild(li);

        try {
            const result = test.run();

            if (result === 'stop') {
                updateSummary();
                return;
            } else if (result instanceof Promise) {
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
                if (Array.isArray(result)) {
                    valueSpan.innerHTML = `<ul>${result.map(r => `<li>${r.test} - ${r.result}</li>`).join('')}</ul>`;
                } else if (result) {
                    valueSpan.innerHTML = JSON.stringify(result, null, 2);
                }

                resultObj.value = result || null;
            }
        } catch (e) {
            failed++;
            valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
        }

        all++;
    }

    updateSummary();

    startButton.removeAttribute('disabled');
}

function downloadTheResults () {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.href = url;
    a.download = 'gpc-results.json';

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
startButton.addEventListener('click', () => runTests());

// if url query is '?run' start tests imadiatelly
if (document.location.search.indexOf('?run') === 0) {
    runTests();
}
