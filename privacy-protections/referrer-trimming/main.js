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

// list of localStorage entries with partial test results that we need to clear at the end of all testing
const lsEntriesToClear = [];

function generateNavigationTest (url) {
    const key = `referrer-trimming-${url}`;
    lsEntriesToClear.push(key);
    const currentURL = new URL(location.href);

    if (localStorage[key]) { // test already finished before
        return JSON.parse(localStorage[key]);
    } else if (currentURL.searchParams.get('js') !== null) { // test finished now
        const result = [
            {
                test: 'js',
                value: currentURL.searchParams.get('js')
            },
            {
                test: 'header',
                value: currentURL.searchParams.get('header')
            }
        ];
        localStorage.setItem(key, JSON.stringify(result));

        // clear url so that the next test doesn't think it's their result
        history.pushState(null, '', '/privacy-protections/referrer-trimming/');

        return result;
    } else { // test haven't run yet
        window.location.href = url;

        // let test runner know that it should not run other tests
        return 'stop';
    }
}

function generateFrameTest (url) {
    let res;
    const promise = new Promise((resolve, reject) => { res = resolve; });

    const origin = (new URL(url, document.location.href)).origin;

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '10px';
    iframe.style.height = '10px';

    const onMessage = msg => {
        // check message and if it's comming from the right origin
        if (msg.data.referrer && msg.origin === origin) {
            res(msg.data.referrer);
            window.removeEventListener('message', onMessage);
            document.body.removeChild(iframe);
        }
    };

    window.addEventListener('message', onMessage);

    document.body.appendChild(iframe);

    iframe.addEventListener('load', () => {
        iframe.contentWindow.postMessage({ action: 'referrer' }, origin);
    });

    return promise;
}

const tests = [
    {
        id: '1p navigation',
        run: () => generateNavigationTest('/come-back')
    },
    {
        id: '3p navigation',
        run: () => generateNavigationTest('https://good.third-party.site/come-back')
    },
    {
        id: '3p tracker navigation',
        run: () => generateNavigationTest('https://bad.third-party.site/come-back')
    },
    {
        id: '1p request',
        run: () => {
            return fetch('/reflect-headers')
                .then(r => r.json())
                .then(data => data.headers.referer);
        }
    },
    {
        id: '3p request',
        run: () => {
            return fetch('https://good.third-party.site/reflect-headers')
                .then(r => r.json())
                .then(data => data.headers.referer);
        }
    },
    {
        id: '3p tracker request',
        run: () => {
            return fetch('https://broken.third-party.site/reflect-headers')
                .then(r => r.json())
                .then(data => data.headers.referer);
        }
    },
    {
        id: '1p iframe',
        run: () => generateFrameTest('./frame.html')
    },
    {
        id: '3p iframe',
        run: () => generateFrameTest('https://good.third-party.site/privacy-protections/referrer-trimming/frame.html')
    },
    {
        id: '3p tracker iframe',
        run: () => generateFrameTest('https://broken.third-party.site/privacy-protections/referrer-trimming/frame.html')
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

    function addTestResult (testId, value) {
        results.results.push({
            id: testId,
            value: value
        });
    }

    const params = new URL(location.href).searchParams;
    const paramTestId = params.get('testid');
    const filteredTests = paramTestId ? tests.filter(test => test.id === paramTestId) : tests;

    for (const test of filteredTests) {
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
                            valueSpan.innerHTML = `<ul>${data.map(r => `<li>${r.test} - ${r.value}</li>`).join('')}</ul>`;

                            data.forEach(item => addTestResult(`${test.id} - ${item.test}`, item.result));
                        } else {
                            if (data) {
                                valueSpan.innerHTML = JSON.stringify(data, null, 2);
                            }

                            addTestResult(test.id, data);
                        }
                    })
                    .catch(e => {
                        failed++;
                        valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
                        addTestResult(test.id, null);
                        updateSummary();
                    });
            } else {
                if (Array.isArray(result)) {
                    valueSpan.innerHTML = `<ul>${result.map(r => `<li>${r.test} - ${r.value}</li>`).join('')}</ul>`;

                    result.forEach(item => addTestResult(`${test.id} - ${item.test}`, item.value));
                } else {
                    if (result) {
                        valueSpan.innerHTML = JSON.stringify(result, null, 2);
                    }

                    addTestResult(test.id, result || null);
                }
            }
        } catch (e) {
            failed++;
            valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
            addTestResult(test.id, null);
        }

        all++;
    }

    // clear partial results from navigational tests
    lsEntriesToClear.forEach(key => localStorage.removeItem(key));

    updateSummary();

    startButton.removeAttribute('disabled');
}

function downloadTheResults () {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/json' }));
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

// if url query is '?run' start tests imadiatelly
if (document.location.search.indexOf('?run') === 0) {
    setTimeout(() => runTests(), 1000);
}
