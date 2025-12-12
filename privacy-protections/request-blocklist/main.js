const PAGE_NAME = 'request-blocklist';
const downloadButton = document.getElementById('download');
const { searchParams } = new URL(window.location);
const TIMEOUT = parseInt(searchParams.get('timeout'), 10) || 5000;

// Make a list of the tests and their expected outcomes.
let failed = false;
const seenResults = new Set();
const tests = [];
for (const test of document.getElementById('tests').querySelectorAll('tr')) {
    const description = test.querySelector('.description')?.innerText;
    const testClass = test.querySelector('td')?.className;

    if (!testClass || !description) {
        continue;
    }

    const expected = testClass === 'block' ? 'not loaded' : 'loaded';
    tests.push({ expected, description, status: 'waiting' });
}

// Log the test results as they come in.
function logResult(test, loaded) {
    test = parseInt(test, 10);
    if (isNaN(test) || test < 0 || test >= tests.length) {
        return;
    }

    const testResult = tests[test];
    if (!testResult) {
        return;
    }

    // If the timeout is too short, it's possible that results could come in
    // after finished() is called.
    if (typeof window.results !== 'undefined') {
        if (loaded !== testResult.actual) {
            console.warn(`Ignored late result for "${testResult.description}" (${loaded}).`);
        }
        return;
    }

    testResult.actual = loaded;
    testResult.status = testResult.expected === testResult.actual ? 'success' : 'failed';

    if (testResult.status === 'failed') {
        failed = true;
    }

    seenResults.add(test);
    if (seenResults.size >= tests.length) {
        finished();
    }
}

// Ensure all results are collected and download button is enabled.
function finished () {
    window.clearTimeout(timeout);

    // Consider anything not loaded by now as 'not loaded'. Necessary since some
    // browsers will not let us know when third-party iframes fail to load.
    for (let i = 0; i < tests.length; ++i) {
        if (tests[i].status === 'waiting') {
            logResult(i, 'not loaded');
        }
    }

    window.results = {
        date: new Date().toUTCString(),
        page: PAGE_NAME,
        results: tests,
        status: failed ? 'failed' : 'success'
    };

    // Finally, make the results available for download.
    downloadButton.removeAttribute('disabled');
}

const timeout = window.setTimeout(finished, TIMEOUT);

// Set up the download button.
downloadButton.addEventListener('click', () => {
    const blob = new Blob(
        [JSON.stringify(window.results, null, 2)],
        { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = PAGE_NAME + '-results.json';
    a.click();
    URL.revokeObjectURL(url);
});
