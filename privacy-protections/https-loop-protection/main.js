const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsDiv = document.querySelector('#tests-details');

const TEST_DOMAIN = 'good.third-party.site';

const tests = [
    {
        id: 'upgrade-navigation',
        run: () => {
            let res;
            const promise = new Promise((resolve, reject) => { res = resolve; });
            const otherWindow = window.open(`http://${TEST_DOMAIN}/privacy-protections/https-loop-protection/http-only.html`);

            const interval = setInterval(() => {
                otherWindow.postMessage({ action: 'url', type: 'navigation' }, `http://${TEST_DOMAIN}/`);
                otherWindow.postMessage({ action: 'url', type: 'navigation' }, `https://${TEST_DOMAIN}/`);
            }, 500);

            function onMessage (m) {
                if (m.data && m.data.type === 'navigation') {
                    clearInterval(interval);
                    otherWindow.close();
                    window.removeEventListener('message', onMessage);
                    res(m.data.url);
                }
            }

            window.addEventListener('message', onMessage);

            return promise;
        }
    }
];

// object that contains results of all tests
const results = {
    page: 'https-loop-protection',
    date: null,
    results: []
};

function resultToHTML (data) {
    if (Array.isArray(data)) {
        return `<ul>${data.map(r => `<li>${r.test} - ${r.result}</li>`).join('')}</ul>`;
    } else if (data) {
        return JSON.stringify(data, null, 2);
    }

    return null;
}

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

            if (result instanceof Promise) {
                result
                    .then(data => {
                        valueSpan.innerHTML = resultToHTML(data);
                        resultObj.value = data || null;
                    })
                    .catch(e => {
                        failed++;
                        valueSpan.innerHTML = `❌ error thrown ("${e.message ? e.message : e}")`;
                        updateSummary();
                    });
            } else {
                valueSpan.innerHTML = resultToHTML(data);
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
    a.download = 'https-loop-protection-results.json';

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
startButton.addEventListener('click', () => runTests());

// if url query is '?run' start tests imadiatelly
if (document.location.search === '?run') {
    runTests();
}
