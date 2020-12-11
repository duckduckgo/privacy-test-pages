const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsDiv = document.querySelector('#tests-details');

// object that contains results of all tests
const results = {
    page: 'referrer-trimming',
    date: null,
    results: []
};

const tests = [
    {
        id: 'referrer - 1p origin',
        run: () => {
            const currentURL = new URL(location.href);
            const key = 'referrer-trimming-test-1p';

            if (localStorage[key]) {// test already finished before
                return JSON.parse(localStorage[key]);
            } else if(currentURL.searchParams.get('js')) {// test finished now
                const result = [
                    {
                        test: 'js',
                        result: currentURL.searchParams.get('js')
                    },
                    {
                        test: 'header',
                        result: currentURL.searchParams.get('header')
                    }
                ];
                localStorage[key] = JSON.stringify(result);

                return result;
            } else {// test haven't run yet
                window.location.href = '/come-back';
            }
        }
    },
    {
        id: 'referrer - 3p origin',
        run: () => {
            const currentURL = new URL(location.href);
            const key = 'referrer-trimming-test-3p-good';

            if (localStorage[key]) {// test already finished before
                return JSON.parse(localStorage[key]);
            } else if(currentURL.searchParams.get('js')) {// test finished now
                const result = [
                    {
                        test: 'js',
                        result: currentURL.searchParams.get('js')
                    },
                    {
                        test: 'header',
                        result: currentURL.searchParams.get('header')
                    }
                ];
                localStorage[key] = JSON.stringify(result);

                return result;
            } else {// test haven't run yet
                window.location.href = 'https://good.third-party.site/come-back';
            }
        }
    },
    {
        id: 'referrer - 3p tracker',
        run: () => {
            const currentURL = new URL(location.href);
            const key = 'referrer-trimming-test-3p-bad';

            if (localStorage[key]) {// test already finished before
                return JSON.parse(localStorage[key]);
            } else if(currentURL.searchParams.get('js')) {// test finished now
                const result = [
                    {
                        test: 'js',
                        result: currentURL.searchParams.get('js')
                    },
                    {
                        test: 'header',
                        result: currentURL.searchParams.get('header')
                    }
                ];
                localStorage[key] = JSON.stringify(result);

                return result;
            } else {// test haven't run yet
                window.location.href = 'https://bad.third-party.site/come-back';
            }
        }
    },
];

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
        testsSummaryDiv.innerText = `Performed ${all} tests${failed > 0 ? ` (${failed} failed)` : ''}. Click for details.`;
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

        testsDetailsDiv.appendChild(li);

        try {
            const result = test.run();

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
                if (Array.isArray(result)) {
                    valueSpan.innerHTML = `<ul>${result.map(r => `<li>${r.test} - ${r.result}</li>`).join('')}</ul>`;
                } else if (result) {
                    valueSpan.innerHTML = JSON.stringify(result, null, 2);
                }

                resultObj.value = result || null;
            }
        } catch(e) {
            failed++;
            valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
        }
    });

    localStorage.removeItem('referrer-trimming-test-1p');
    localStorage.removeItem('referrer-trimming-test-3p-good');
    localStorage.removeItem('referrer-trimming-test-3p-bad');

    updateSummary();

    startButton.removeAttribute('disabled');
}

function downloadTheResults() {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], {type: 'application/json'}));
    a.href = url;
    a.download = 'referrer-trimming-results.json';
    
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
startButton.addEventListener('click', () => runTests());

// if url contains 'run' start tests imadiatelly
if (document.location.search.indexOf('?run') === 0) {
    runTests();
}
