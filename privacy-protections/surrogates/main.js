const results = {
    page: 'surrogates',
    date: (new Date()).toUTCString(),
    results: []
};

function updateTable ({ name, testData, error }) {
    const table = document.getElementById('results-table');
    const row = table.insertRow(-1);

    const descriptionCell = row.insertCell(0);
    const testCell = row.insertCell(1);

    // set default values and colors
    descriptionCell.innerText = testData.notes;
    testCell.innerText = 'request failed';
    testCell.style.backgroundColor = '#f97268';

    const result = {
        id: name,
        loaded: false
    };

    if (!error) {
        const testResult = testData.test();

        if (testResult) {
            result.loaded = true;
            testCell.innerText = 'surrogate loaded';
            testCell.style.backgroundColor = '#71bf69';
        } else {
            testCell.innerText = 'surrogate not loaded';
        }
    }

    if (testData.cleanUp) {
        testData.cleanUp();
    }

    results.results.push(result);
}

function checkSurrogate () {
    if (window.ga && window.ga.name !== 'N' && window.ga.answer === 42) {
        return true;
    }

    return false;
}

const surrogates = {
    'main-frame': {
        url: 'https://google-analytics.com/analytics.js',
        notes: 'Loading surrogate in the main frame.',
        test: checkSurrogate,
        cleanUp: () => { delete window.ga; }
    },
    'cross-origin': {
        url: 'https://google-analytics.com/analytics.js',
        crossOrigin: 'anonymous',
        notes: 'Loading surrogate with crossOrigin=anonymous set.',
        test: checkSurrogate,
        cleanUp: () => { delete window.ga; }
    },
    'integrity-check': {
        url: 'https://google-analytics.com/analytics.js',
        crossOrigin: 'anonymous',
        integrity: 'sha512-1xNTXD/ZeaKg/Xjb6De9la7CXo5gC1lMk+beyKo691KJrjlj0HbZG6frzK0Wo6bm96i9Cp6w/WB4vSN/8zDBLQ==',
        notes: 'Loading surrogate with integrity=sha512-… set.',
        test: checkSurrogate,
        cleanUp: () => { delete window.ga; }
    },
    'direct-access': {
        url: 'chrome-extension://bkdgflcldnnnapblkhphbgpggdiikppg/web_accessible_resources/analytics.js',
        notes: 'Chromium only - it should not be possible to access local surrogate file',
        test: () => { return true; }
    },
    'sub-frame': {
        notes: 'Loading surrogate in an iframe.',
        load: () => {
            const url = './frame.html';
            let res;
            const promise = new Promise((resolve, reject) => { res = resolve; });

            const origin = (new URL(url, document.location.href)).origin;

            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.width = '10px';
            iframe.style.height = '10px';

            const onMessage = msg => {
                // check message and if it's comming from the right origin
                if (msg.data.surrogate && msg.origin === origin) {
                    res(msg.data.surrogate);
                    window.removeEventListener('message', onMessage);
                    document.body.removeChild(iframe);
                }
            };

            window.addEventListener('message', onMessage);

            document.body.appendChild(iframe);

            iframe.addEventListener('load', () => {
                iframe.contentWindow.postMessage({ action: 'surrogate' }, origin);
            });

            return promise;
        }
    }
};

(async function loadSurrogates () {
    for (const [name, testData] of Object.entries(surrogates)) {
        if (testData.url) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');

                if (testData.crossOrigin) {
                    s.crossOrigin = testData.crossOrigin;
                }
                if (testData.integrity) {
                    s.integrity = testData.integrity;
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
        } else {
            testData.load().then(result => {
                testData.test = () => result;
                updateTable({ name, testData });
            });
        }
    }
})();
