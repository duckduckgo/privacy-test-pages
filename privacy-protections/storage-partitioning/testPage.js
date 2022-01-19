/* globals FIRST_PARTY_HTTP FIRST_PARTY_HTTPS THIRD_PARTY_HTTP THIRD_PARTY_HTTPS */

const statusElement = document.querySelector('#status');
const preElement = document.querySelector('#pre-status');

const configurations = [
    {
        apiTypes: ['storage', 'cache', 'communication'],
        siteType: 'same-site',
        desc: 'read values in same-site iframe',
        iterations: 2,
        topOrigin: FIRST_PARTY_HTTPS
    },
    {
        apiTypes: ['storage', 'cache', 'communication'],
        siteType: 'cross-site',
        desc: 'read values in cross-site iframe',
        iterations: 2,
        topOrigin: THIRD_PARTY_HTTPS
    },
    {
        apiTypes: ['hsts'],
        siteType: 'same-site',
        desc: 'Read HSTS on a same-site HTTP test page',
        iterations: 2,
        topOrigin: FIRST_PARTY_HTTP
    },
    {
        apiTypes: ['hsts'],
        siteType: 'cross-site',
        desc: 'Read HSTS on a cross-site HTTP test page',
        iterations: 2,
        topOrigin: THIRD_PARTY_HTTP
    }
];

function readStorageInIframe (sessionId, apiTypes) {
    return new Promise((resolve, reject) => {
        const iframeURL = new URL('/privacy-protections/storage-partitioning/iframe.html', FIRST_PARTY_HTTPS);
        iframeURL.searchParams.set('mode', 'retrieve');
        iframeURL.searchParams.set('sessionId', sessionId);
        if (typeof apiTypes !== 'undefined') {
            iframeURL.searchParams.set('apiTypes', JSON.stringify(apiTypes));
        }

        const iframe = document.createElement('iframe');
        iframe.src = iframeURL.href;
        iframe.height = 1;
        iframe.width = 1;
        document.body.appendChild(iframe);

        window.addEventListener('message', event => {
            if (event.origin !== FIRST_PARTY_HTTPS) {
                console.error(`Message from unexpected origin ${event.origin}`);
            }
            resolve(event.data);
        }, { capture: false, once: true });
    });
}

function endTests (sessionId) {
    window.localStorage.setItem(sessionId, 'test-complete');
    statusElement.innerText = "Tests complete. If this window doesn't close itself, close it to return to the results.";
    window.close();
}

function waitForInitialization (sessionId) {
    return new Promise(resolve => {
        window.addEventListener('storage', () => {
            const signal = window.localStorage.getItem(sessionId);
            if (signal !== null) {
                window.localStorage.removeItem(sessionId);
                resolve();
            }
        });
    });
}

function openNextTestPage (testIndex, testIteration, testId, sessionId) {
    // Move to the next test configuration
    const nextURL = new URL(window.location.pathname, configurations[testIndex].topOrigin);
    nextURL.searchParams.set('sessionId', sessionId);
    nextURL.searchParams.set('testIndex', testIndex);
    nextURL.searchParams.set('testIteration', testIteration);
    nextURL.searchParams.set('testId', testId);
    window.location.href = nextURL.href;
}

function saveTestResults (siteType, testId, sessionId, retrieval) {
    console.log(`Posting test results for ${siteType}-${testId} with session id ${sessionId}`);
    const postURL = new URL('/partitioning/save-results', FIRST_PARTY_HTTPS);
    postURL.searchParams.set('siteType', siteType);
    postURL.searchParams.set('testId', testId);
    postURL.searchParams.set('key', sessionId);

    // Send data to server
    return fetch(postURL.href, {
        method: 'POST',
        headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(retrieval)
    });
}

async function runTest () {
    const topURL = new URL(window.location.href);

    const sessionId = topURL.searchParams.get('sessionId');
    if (sessionId === null) {
        console.error('No sessionId provided!');
        return;
    }

    if (topURL.searchParams.get('endTests')) {
        endTests(sessionId);
        return;
    }

    let testIndex = topURL.searchParams.get('testIndex');
    let testIteration = topURL.searchParams.get('testIteration');
    let testId = topURL.searchParams.get('testId');

    if (testIndex === null) {
        console.log('testIndex query parameter is null. Waiting for main page to finish initialization.');
        statusElement.innerText = 'waiting for main page to finish initialization.';
        await waitForInitialization(sessionId);
        openNextTestPage(0, 0, 0, sessionId);
        return;
    }

    testIndex = parseInt(testIndex);
    testIteration = parseInt(testIteration);
    testId = parseInt(testId);

    statusElement.innerText = `Running iteration ${testIteration} of test:`;
    preElement.innerText = JSON.stringify(configurations[testIndex], undefined, 4);

    // Update favicon (must be set on top-level frame)
    const faviconElement = document.getElementById('favicon');
    const faviconURL = new URL('/partitioning/resource', FIRST_PARTY_HTTPS);
    faviconURL.searchParams.set('fileType', 'favicon');
    faviconURL.searchParams.set('key', sessionId);
    faviconElement.setAttribute('href', faviconURL.href);

    const retrieval = await readStorageInIframe(sessionId, configurations[testIndex].apiTypes);

    const resp = await saveTestResults(configurations[testIndex].siteType, testId, sessionId, retrieval);
    if (resp.status !== 200) {
        console.error('POST request to save data failed', resp);
        return;
    }

    testIteration += 1;
    if (testIteration >= configurations[testIndex].iterations) {
        testIndex += 1;
        testIteration = 0;
    }
    testId += 1;

    // If we've completed all tests we need to return to a test page
    // that is same-origin with the main tab so we can send it a notification
    if (testIndex >= configurations.length) {
        const nextURL = new URL(window.location.pathname, FIRST_PARTY_HTTPS);
        nextURL.searchParams.set('endTests', true);
        nextURL.searchParams.set('sessionId', sessionId);
        window.location.href = nextURL.href;
        return;
    }

    openNextTestPage(testIndex, testIteration, testId, sessionId);
}

runTest();
