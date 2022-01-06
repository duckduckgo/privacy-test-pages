/* globals uuidv4 */
const runButton = document.querySelector('#run');
const downloadButton = document.querySelector('#download');
const toggleDetailsButton = document.querySelector('#toggle-details');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsElement = document.querySelector('#tests-details');

const isLocalTest = window.location.hostname === 'localhost';

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

function setStorage (frameOrigin, data) {
    return new Promise((resolve, reject) => {
        try {
            const iframeURL = new URL(`/privacy-protections/storage-partitioning/iframe.html?data=${data}`, frameOrigin);
            const iframe = document.createElement('iframe');
            iframe.height = 1;
            iframe.width = 1;
            iframe.src = iframeURL.href;
            document.body.appendChild(iframe);

            window.addEventListener('message', (event) => {
                resolve(event.data);
            }, { capture: false, once: true });
        } catch (err) {
            console.error(`Error while trying to set storage: ${err}`);
        }
    });
}

function getStorage (frameOrigin) {
    return new Promise((resolve, reject) => {
        try {
            const iframeURL = new URL('/privacy-protections/storage-partitioning/iframe.html', frameOrigin);
            const iframe = document.createElement('iframe');
            iframe.height = 1;
            iframe.width = 1;
            iframe.src = iframeURL.href;
            document.body.appendChild(iframe);

            window.addEventListener('message', (event) => {
                iframe.remove();
                resolve(event.data);
            }, { capture: false, once: true });
        } catch (err) {
            console.error(`Error while trying to set storage: ${err}`);
        }
    });
}

function validateValues (sameSites, crossSites, reference, random) {
    if (reference.value !== random) {
        if (reference.value === null && typeof reference.error !== 'undefined') {
            return 'error';
        }
        return 'fail';
    }

    if (
        // (!sameSites.length === configurations['same-site'].iterations) ||
        // (!crossSites.length === configurations['cross-site'].iterations) ||
        (!sameSites.every(v => v.value === reference.value)) ||
        (!crossSites.every(v => v.value === crossSites[0].value)) ||
        (!crossSites.every(v => v.value !== reference.value))) {
        return 'fail';
    }
    return 'pass';
}

function validateResults (allRetrievals, random) {
    const out = new Map();
    for (const api of allRetrievals.keys()) {
        const sameSiteValues = allRetrievals.get(api)['same-site'];
        const crossSiteValues = allRetrievals.get(api)['cross-site'];
        const reference = allRetrievals.get(api).reference;
        const result = validateValues(sameSiteValues, crossSiteValues, reference, random);
        out.set(api, result);
    };
    return out;
}

function displayResults (allRetrievals, testResults) {
    testsDiv.removeAttribute('hidden');

    results.results.length = 0;
    results.date = (new Date()).toUTCString();

    let all = 0;
    let failed = 0;

    testsDetailsElement.innerHTML = '';

    function updateSummary () {
        testsSummaryDiv.innerText = `Retrieved data from ${all} storage mechanisms${failed > 0 ? ` (${failed} failed)` : ''}.`;
    }

    function getLiFromResults (api, type) {
        const li = document.createElement('li');
        li.setAttribute('hidden', '');
        li.className = 'detailed-result';
        const span = document.createElement('span');

        span.innerHTML = `${type}: ${JSON.stringify(allRetrievals.get(api)[type], null, 2)}`;
        li.appendChild(span);
        return li;
    }

    for (const api of allRetrievals.keys()) {
        all++;

        const li = document.createElement('li');
        li.id = `test-${api.replace(' ', '-')}`;
        li.innerHTML = `${api} - ${testResults.get(api)}<ul></ul>`;

        const ul = li.getElementsByTagName('ul')[0];
        ul.appendChild(getLiFromResults(api, 'same-site'));
        ul.appendChild(getLiFromResults(api, 'cross-site'));

        testsDetailsElement.appendChild(li);
    };

    updateSummary();

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
    const random = (Math.round(Math.random() * 1000)).toString();
    const sessionId = uuidv4();

    // Open the test tab where all tests will be run
    const testURL = new URL('/privacy-protections/storage-partitioning/testWindow.html', window.location.origin);
    testURL.searchParams.set('sessionId', sessionId);
    testURL.searchParams.set('isLocalTest', isLocalTest);

    // Ideally we'd use noopener here as some browsers (e.g., Firefox) keep tabs that
    // have references to each other in the same "agent cluster", which impacts the
    // scope of storage. This is why you'll see consistent sessionStorage across tabs
    // that have references to each other in Firefox. Unfortuantely the test tab can't
    // be closed programatically unless it has an opener reference.
    // See: https://textslashplain.com/2021/02/04/window-close-restrictions/
    window.open(testURL, '_blank');

    // The test tab must be opened before we do any other initialization.
    // Webkit doesn't propagate user gestures through these async calls.
    console.log(`Setting ${random} in a same-origin iframe...`);
    const status = await setStorage(window.location.origin, random);
    console.log(status);

    const allRetrievals = new DefaultMap(() => {
        return {
            'same-site': [],
            'cross-site': []
        };
    });

    console.log('Retrieving reference values from a same-origin iframe...');
    const reference = await getStorage(window.location.origin);
    console.log(reference);
    reference.forEach(retrieval => {
        allRetrievals.get(retrieval.api).reference = {
            value: retrieval.value,
            error: retrieval.error
        };
    });

    function storageHandler () {
        const results = JSON.parse(window.localStorage.getItem(sessionId));
        if (results === null) {
            // Could be a delete event or an event from an unrelated test tab.
            return;
        }
        window.localStorage.removeItem(sessionId);

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
        const testResults = validateResults(allRetrievals, random);
        displayResults(allRetrievals, testResults);
        window.removeEventListener('storage', storageHandler);
    }
    window.addEventListener('storage', storageHandler, false);

    // Setup complete. Notify the test tab to continue with tests.
    window.localStorage.setItem(sessionId, 'ready');
    function resendIndicatorIfNotRead () {
        setTimeout(() => {
            if (window.localStorage.getItem(sessionId) !== null) {
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

// if url query is '?store' store the data immadiatelly
if (document.location.search === '?run') {
    runTests();
}
