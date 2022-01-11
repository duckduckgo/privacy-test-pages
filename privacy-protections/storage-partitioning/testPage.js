const statusElement = document.querySelector('#status');

const topURL = new URL(window.location.href);

const isLocalTest = topURL.searchParams.get('isLocalTest') === 'true';
const THIRD_PARTY_ORIGIN = isLocalTest ? `http://127.0.0.1:${window.location.port}` : 'https://good.third-party.site';
const FIRST_PARTY_ORIGIN = isLocalTest ? `http://localhost:${window.location.port}` : 'https://privacy-test-pages.glitch.me';
const configurations = [
    {
        id: 'same-site',
        desc: 'read values in same-site iframe',
        iterations: 2,
        topOrigin: FIRST_PARTY_ORIGIN
    },
    {
        id: 'cross-site',
        desc: 'read values in cross-site iframe',
        iterations: 2,
        topOrigin: THIRD_PARTY_ORIGIN
    }
];

if (isLocalTest === null) {
    console.error('Must indicate whether this is a local test via isLocalTest');
} else {
    runTest();
}

function readStorageInIframe (sessionId) {
    return new Promise((resolve, reject) => {
        const iframeURL = new URL('/privacy-protections/storage-partitioning/iframe.html', FIRST_PARTY_ORIGIN);
        iframeURL.searchParams.set('mode', 'retrieve');
        iframeURL.searchParams.set('sessionId', sessionId);

        const iframe = document.createElement('iframe');
        iframe.src = iframeURL.href;
        iframe.height = 1;
        iframe.width = 1;
        document.body.appendChild(iframe);

        window.addEventListener('message', event => {
            if (event.origin !== FIRST_PARTY_ORIGIN) {
                console.error(`Message from unexpected origin ${event.origin}`);
            }
            resolve(event.data);
        }, { capture: false, once: true });
    });
}

function endTests (sessionId, results) {
    window.localStorage.setItem(sessionId, JSON.stringify(results));
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

function openNextTestPage (testIndex, testIteration, sessionId, results) {
    // Move to the next test configuration
    const nextURL = new URL(window.location.pathname, configurations[testIndex].topOrigin);
    nextURL.searchParams.set('sessionId', sessionId);
    nextURL.searchParams.set('isLocalTest', isLocalTest);
    nextURL.searchParams.set('results', JSON.stringify(results));
    nextURL.searchParams.set('testIndex', testIndex);
    nextURL.searchParams.set('testIteration', testIteration);
    window.location.href = nextURL.href;
}

function saveTestResults (testId, testIteration, sessionId, retrieval) {
    console.log(`SAVING TEST RESULTS ${testId}-${testIteration} with session id ${sessionId}`);
    console.log(retrieval);
}

async function runTest () {
    const results = topURL.searchParams.get('results') === null ? {} : JSON.parse(topURL.searchParams.get('results'));

    const sessionId = topURL.searchParams.get('sessionId');
    if (sessionId === null) {
        console.error('No sessionId provided!');
        return;
    }

    if (topURL.searchParams.get('endTests')) {
        endTests(sessionId, results);
        return;
    }

    let testIndex = topURL.searchParams.get('testIndex');
    let testIteration = topURL.searchParams.get('testIteration');

    if (testIndex === null) {
        console.log('testIndex query parameter is null. Waiting for main page to finish initialization.');
        statusElement.innerText = 'waiting for main page to finish initialization.';
        await waitForInitialization(sessionId);
        openNextTestPage(0, 0, sessionId, results);
        return;
    }

    testIndex = parseInt(testIndex);
    testIteration = parseInt(testIteration);

    statusElement.innerText = `Running test ${configurations[testIndex].id}, iteration ${testIteration}`;
    const retrieval = await readStorageInIframe(sessionId);

    saveTestResults(configurations[testIndex].id, testIteration, sessionId, retrieval);
    results[[configurations[testIndex].id, testIteration]] = retrieval;

    testIteration += 1;
    if (testIteration >= configurations[testIndex].iterations) {
        testIndex += 1;
        testIteration = 0;
    }

    // If we've completed all tests we need to return to a test page
    // that is same-origin with the main tab so we can send it a notification
    if (testIndex >= configurations.length) {
        const nextURL = new URL(window.location.pathname, FIRST_PARTY_ORIGIN);
        nextURL.searchParams.set('endTests', true);
        nextURL.searchParams.set('sessionId', sessionId);
        nextURL.searchParams.set('isLocalTest', isLocalTest);
        nextURL.searchParams.set('results', JSON.stringify(results));
        setTimeout(() => {
            window.location.href = nextURL.href;
        }, 2000);
        return;
    }

    openNextTestPage(testIndex, testIteration, sessionId, results);
}
