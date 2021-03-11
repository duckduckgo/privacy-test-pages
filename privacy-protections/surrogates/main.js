const results = {};

function updateTable ({ name, testData, error }) {
    const table = document.getElementById('results-table');
    const row = table.insertRow(-1);
    const testName = row.insertCell(0);
    const loaded = row.insertCell(1);
    const passed = row.insertCell(2);
    const note = row.insertCell(3);

    // set default values and colors
    testName.innerText = name;
    loaded.innerText = 'failed';
    passed.innerText = 'failed';
    row.style.backgroundColor = '#f97268';
    note.style.backgroundColor = '#ffff';

    results[name] = { pass: true };

    let testPassed = true;

    if (!error && testData.shouldFail) {
        testPassed = false;
    }

    if (testPassed) {
        loaded.innerText = 'pass';

        const result = testData.test();
        if (result) {
            passed.innerText = 'pass';
            row.style.backgroundColor = '#71bf69';
        } else {
            results[name].pass = false;
            loaded.innerText = 'failed';
        }
    }

    if (testData.notes) {
        results[name].notes = testData.notes;
        note.innerText = testData.notes;
    }

    if (testData.cleanUp) {
        testData.cleanUp();
    }
}

const surrogates = {
    'google-analytics.com/analytics.js, crossOrigin': {
        url: 'https://google-analytics.com/analytics.js',
        crossOrigin: 'anonymous',
        notes: 'Test loading with crossOrigin set on element (should fail on Firefox) https://bugzilla.mozilla.org/show_bug.cgi?id=1694679',
        shouldFail: false,
        test: () => { return !!(window.ga && Object.keys(window.ga.create()).length === 0); },
        cleanUp: () => { delete window.ga; }
    },
    'google-analytics.com/analytics.js': {
        url: 'https://google-analytics.com/analytics.js',
        shouldFail: false,
        test: () => { return !!(window.ga && Object.keys(window.ga.create()).length === 0); },
        cleanUp: () => { delete window.ga; }
    },
    'Directly accessing a web resouce': {
        url: 'chrome-extension://bkdgflcldnnnapblkhphbgpggdiikppg/web_accessible_resources/analytics.js',
        notes: 'Chromium browsers Only: need access key for web resources',
        shouldFail: true,
        test: () => { return true; }
    }
};

(async function loadSurrogates () {
    for (const [name, testData] of Object.entries(surrogates)) {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');

            if (testData.crossOrigin) {
                s.crossOrigin = testData.crossOrigin;
            }

            s.onload = () => {
                updateTable({ name, testData });
                resolve();
            };

            s.onerror = (error) => {
                updateTable({ name, testData, error });
                resolve();
            };

            s.src = testData.url;

            document.body.appendChild(s);
        });
    }
})();
