const topURL = new URL(window.location.href);

const isLocalTest = topURL.searchParams.get('isLocalTest');
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

function readStorageInIframe () {
    return new Promise((resolve, reject) => {
        const iframeURL = new URL('/privacy-protections/storage-partitioning/iframe.html?read', FIRST_PARTY_ORIGIN);

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
    console.log('END TEST CALLED');
    window.localStorage.setItem(sessionId, JSON.stringify(results));
    // window.close();
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

    let testIndex = topURL.searchParams.get('testIndex') === null ? 0 : parseInt(topURL.searchParams.get('testIndex'));
    let testIteration = topURL.searchParams.get('testIteration') === null ? 0 : parseInt(topURL.searchParams.get('testIteration'));

    console.log(`Running test ${configurations[testIndex].id}, iteration ${testIteration}`);
    const retrieval = await readStorageInIframe();

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
        }, 1000);
        return;
    }

    // Move to the next test configuration
    const nextURL = new URL(window.location.pathname, configurations[testIndex].topOrigin);
    nextURL.searchParams.set('sessionId', sessionId);
    nextURL.searchParams.set('isLocalTest', isLocalTest);
    nextURL.searchParams.set('results', JSON.stringify(results));
    nextURL.searchParams.set('testIndex', testIndex);
    nextURL.searchParams.set('testIteration', testIteration);
    setTimeout(() => {
        window.location.href = nextURL.href;
    }, 1000);
}
