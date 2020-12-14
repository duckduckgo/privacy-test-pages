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

function generateNavigationTest(url) {
    const key = `referrer-trimming-${url}`;
    const currentURL = new URL(location.href);

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
        localStorage.setItem(key, JSON.stringify(result));

        // clear url so that the next test doesn't think it's their result
        history.pushState(null, '', '/privacy-protections/referrer-trimming/');

        return result;
    } else {// test haven't run yet
        window.location.href = url;

        return 'stop';
    }
}

function generateFrameTest(url) {
    let resolve, reject;
    const promise = new Promise((res, rej) => {resolve = res; reject = rej});

    const origin = (new URL(url, document.location.href)).origin;

    const iframe = document.createElement('iframe');
    iframe.src = url;

    const onMessage = msg => {
        // check message and if it's comming from the right origin
        if (msg.data.referrer && msg.origin === origin) {
            resolve(msg.data.referrer);
            window.removeEventListener('message', onMessage);
            document.body.removeChild(iframe);
        }
    };

    window.addEventListener('message', onMessage);

    document.body.appendChild(iframe);

    iframe.addEventListener('load', () => {
        iframe.contentWindow.postMessage({action: 'referrer'}, origin);
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
            return fetch('https://bad.third-party.site/reflect-headers')
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
        run: () => generateFrameTest('https://bad.third-party.site/privacy-protections/referrer-trimming/frame.html')
    }
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
                break;
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
        } catch(e) {
            failed++;
            valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
        }

        all++;
    }

    // if all tests actually run (and we are not in the middle of testing)
    if (all === tests.length) {
        localStorage.removeItem('referrer-trimming-test-1p');
        localStorage.removeItem('referrer-trimming-test-3p-good');
        localStorage.removeItem('referrer-trimming-test-3p-bad');
    }

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
