/* globals uuidv4 testAPIs isLocalTest accessStorageInIframe */
const runButton = document.querySelector('#run');
const downloadButton = document.querySelector('#download');
const toggleDetailsButton = document.querySelector('#toggle-details');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsElement = document.querySelector('#tests-details');

// object that contains results of all tests
const results = {
    page: 'storage-partitioning',
    date: null,
    results: []
};

function downloadTheResults () {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.href = url;
    a.download = 'storage-blocking-results.json';

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

function validateResults (allRetrievals, random) {
    const out = new Map();
    for (const apiName of allRetrievals.keys()) {
        const sameSiteValues = allRetrievals.get(apiName)['same-site'];
        const crossSiteValues = allRetrievals.get(apiName)['cross-site'];
        const result = testAPIs[apiName].validate(sameSiteValues, crossSiteValues, random);
        out.set(apiName, result);
    };
    return out;
}

function displayResults (allRetrievals, testResults) {
    testsDiv.removeAttribute('hidden');

    results.results.length = 0;
    results.date = (new Date()).toUTCString();

    testsDetailsElement.innerHTML = '';

    function getLiFromResults (api, type) {
        const li = document.createElement('li');
        li.setAttribute('hidden', '');
        li.className = 'detailed-result';
        const span = document.createElement('span');

        span.innerHTML = `${type}: ${JSON.stringify(allRetrievals.get(api)[type], null, 2)}`;
        li.appendChild(span);
        return li;
    }

    function getIcon (result) {
        if (result === 'pass' || result === 'unsupported') {
            return '✅';
        } else if (result === 'fail') {
            return '❌';
        } else if (result === 'error') {
            return '⚠️';
        } else {
            return '?';
        }
    }

    for (const api of allRetrievals.keys()) {
        const result = testResults.get(api);

        const li = document.createElement('li');
        li.id = `test-${api.replace(' ', '-')}`;
        li.innerHTML = `${getIcon(result)} ${api} - ${result}<ul></ul>`;

        const ul = li.getElementsByTagName('ul')[0];
        ul.appendChild(getLiFromResults(api, 'same-site'));
        ul.appendChild(getLiFromResults(api, 'cross-site'));

        testsDetailsElement.appendChild(li);
    };

    testsSummaryDiv.innerText = `Retrieved data from ${allRetrievals.size} storage mechanisms.`;

    function addTestResult (testId, value) {
        results.results.push({
            id: testId,
            value: value
        });
    }

    testResults.forEach((status, api) => {
        addTestResult(api, status);
    });

    downloadButton.removeAttribute('disabled');
}

// From: https://stackoverflow.com/a/51321724
class DefaultMap extends Map {
    get (key) {
        if (!this.has(key)) this.set(key, this.default());
        return super.get(key);
    }

    constructor (defaultFunction, entries) {
        super(entries);
        this.default = defaultFunction;
    }
}

async function runTests () {
    const sessionId = uuidv4();

    // Update favicon (must happen in top-level frame)
    const faviconElement = document.getElementById('favicon');
    const faviconURL = new URL('/partitioning/resource', window.location.origin);
    faviconURL.searchParams.set('fileType', 'favicon');
    faviconURL.searchParams.set('key', sessionId);
    faviconElement.setAttribute('href', faviconURL.href);

    // Open the test tab where all tests will be run
    const testURL = new URL('/privacy-protections/storage-partitioning/testWindow.html', window.location.origin);
    testURL.searchParams.set('sessionId', sessionId);
    testURL.searchParams.set('isLocalTest', isLocalTest);

    // sessionStorage is tab-scoped. window.open seems to fork the current
    // tab's sessionStorage values, but they are not updated after forking.
    // Thus, if we set sessionStorage after window.open, the value set will not
    // propagate into the new tab's sessionStorage.
    testAPIs.sessionStorage.store(sessionId);

    // Ideally we'd use noopener here as some browsers (e.g., Firefox) keep tabs that
    // have references to each other in the same "agent cluster", which impacts the
    // scope of storage (in particular sessionStorage). Unfortuantely the test tab can't
    // be closed programatically unless it has an opener reference.
    // See: https://textslashplain.com/2021/02/04/window-close-restrictions/
    window.open(testURL, '_blank');

    // The test tab must be opened before we do any other initialization
    // so the user gesture is preserved, which avoids the pop-up blocker.
    console.log(`Setting ${sessionId} in a same-origin iframe...`);
    const status = await accessStorageInIframe(window.location.origin, sessionId, 'store');
    console.log(status);

    const allRetrievals = new DefaultMap(() => {
        return {
            'same-site': [],
            'cross-site': []
        };
    });

    async function storageHandler () {
        const flag = window.localStorage.getItem(sessionId);
        if (flag !== 'test-complete') {
            // Could be a delete event or an event from an unrelated test tab.
            return;
        }
        window.localStorage.removeItem(sessionId);

        // Fetch final results from server
        console.log(`Fetching final results from server with session id ${sessionId}`);
        const getURL = new URL('/partitioning/get-results', window.location.origin);
        getURL.searchParams.set('key', sessionId);

        const resp = await fetch(getURL.href, {
            method: 'GET',
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        });
        if (resp.status !== 200) {
            console.error(`Error fetching final results ${resp.status}.`);
            return;
        }
        const results = JSON.parse(await resp.text());

        for (const [id, retrieval] of Object.entries(results)) {
            const testType = id.split(',', 1); // same-site or cross-site
            retrieval.forEach(retrieval => {
                allRetrievals.get(retrieval.api)[testType].push({
                    value: retrieval.value,
                    error: retrieval.error
                });
            });
        }
        console.log(allRetrievals);
        const testResults = validateResults(allRetrievals, sessionId);
        displayResults(allRetrievals, testResults);
        window.removeEventListener('storage', storageHandler);
    }
    window.addEventListener('storage', storageHandler, false);

    // Setup complete. Notify the test tab to continue with tests.
    window.localStorage.setItem(sessionId, 'ready');
    function resendIndicatorIfNotRead () {
        setTimeout(() => {
            if (window.localStorage.getItem(sessionId) !== null) {
                window.localStorage.removeItem(sessionId);
                window.localStorage.setItem(sessionId, 'ready');
                resendIndicatorIfNotRead();
            }
        }, 500);
    }
    resendIndicatorIfNotRead();
}

downloadButton.addEventListener('click', () => downloadTheResults());

function addUnhideHandler () {
    toggleDetailsButton.addEventListener('click', () => {
        testsDiv.querySelectorAll('li.detailed-result').forEach(li => {
            li.removeAttribute('hidden');
        });
        toggleDetailsButton.innerText = 'Hide Detailed Results';
        addHideHandler();
    }, { once: true });
}
function addHideHandler () {
    toggleDetailsButton.addEventListener('click', () => {
        testsDiv.querySelectorAll('li.detailed-result').forEach(li => {
            li.setAttribute('hidden', '');
        });
        toggleDetailsButton.innerText = 'Show Detailed Results';
        addUnhideHandler();
    }, { once: true });
}
addUnhideHandler();

// run tests if button was clicked or…
runButton.addEventListener('click', () => runTests());

// if url query is '?run' run the tests immediately
if (document.location.search === '?run') {
    runTests();
}

// warn the user if loaded over localhost
if (window.location.hostname === 'localhost') {
    const warning = document.getElementById('warning');
    warning.innerHTML = '⚠ Test must be accessed via https://first-party.example. See <a href="https://github.com/duckduckgo/privacy-test-pages#how-to-test-it-locally">README.md</a> for setup instructions. ⚠';
    runButton.setAttribute('disabled', '');
}
