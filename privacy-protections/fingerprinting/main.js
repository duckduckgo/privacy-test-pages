const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');

const saveToLS = document.querySelector('#save-to-ls');
const compareWithLS = document.querySelector('#compare-with-ls');
const compareWithFile = document.querySelector('#compare-with-file');

const diffDiv = document.querySelector('#diff');
const diffDetailsDiv = document.querySelector('#diff-details');
const diffSummaryDiv = document.querySelector('#diff-summary');

const headers = fetch('/reflect-headers').then(r => r.json());

// object that contains results of all tests
const results = {
    page: 'fingerprinting',
    date: null,
    results: []
};

const tests = [
    // headers
    {
        id: 'headers - accept',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept'])
    },
    {
        id: 'headers - accept-encoding',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept-encoding'])
    },
    {
        id: 'headers - accept-language',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept-language'])
    },
    {
        id: 'headers - dnt',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['dnt'])
    },
    {
        id: 'headers - user-agent',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['user-agent'])
    },
    {
        id: 'headers - other',
        category: 'headers',
        getValue: () => headers.then(res => {
            const exclude = [
                'accept', 'accept-encoding', 'accept-language', 'dnt', 'user-agent', // already covered above
                'referer' // not useful
            ];
            const other = {};

            Object.keys(res.headers).forEach(k => {
                if (!exclude.includes(k)) {
                    other[k] = res.headers[k];
                }
            })

            return other;
        })
    },

    // navigator
    {
        id: 'navigator.userAgent',
        category: 'navigator',
        getValue: () => navigator.userAgent
    },
    {
        id: 'navigator.deviceMemory',
        category: 'navigator',
        getValue: () => navigator.deviceMemory
    },
    {
        id: 'navigator.hardwareConcurrency',
        category: 'navigator',
        getValue: () => navigator.hardwareConcurrency
    },
    {
        id: 'navigator.product',
        category: 'navigator',
        getValue: () => navigator.product
    },
    {
        id: 'navigator.productSub',
        category: 'navigator',
        getValue: () => navigator.productSub
    },
    {
        id: 'navigator.appName',
        category: 'navigator',
        getValue: () => navigator.appName
    },
    {
        id: 'navigator.appVersion',
        category: 'navigator',
        getValue: () => navigator.appVersion
    },
    {
        id: 'navigator.appCodeName',
        category: 'navigator',
        getValue: () => navigator.appCodeName
    },
    {
        id: 'navigator.language',
        category: 'navigator',
        getValue: () => navigator.language
    },
    {
        id: 'navigator.languages',
        category: 'navigator',
        getValue: () => navigator.languages
    },
    {
        id: 'navigator.platform',
        category: 'navigator',
        getValue: () => navigator.platform
    },
    {
        id: 'navigator.vendor',
        category: 'navigator',
        getValue: () => navigator.vendor
    },
    {
        id: 'navigator.vendorSub',
        category: 'navigator',
        getValue: () => navigator.vendorSub
    },
    {
        id: 'navigator.mimeTypes',
        category: 'navigator',
        getValue: () => Array.from(navigator.mimeTypes).map(mtype => mtype.type)
    },
    {
        id: 'navigator.cookieEnabled',
        category: 'navigator',
        getValue: () => navigator.cookieEnabled
    },
    {
        id: 'navigator.doNotTrack',
        category: 'navigator',
        getValue: () => navigator.doNotTrack
    },
    {
        id: 'navigator.maxTouchPoints',
        category: 'navigator',
        getValue: () => navigator.maxTouchPoints
    },
    {
        id: 'navigator.connection',
        category: 'navigator',
        getValue: () => ({
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData,
        })
    },
    {
        id: 'navigator.storage.estimate()',
        category: 'navigator',
        getValue: () => navigator.storage.estimate()
    },
    {
        id: 'navigator.plugins',
        category: 'navigator',
        getValue: () => Array.from(navigator.plugins).map(p => ({
            name: p.name,
            filename: p.filename,
            description: p.description,
        }))
    },
    {
        id: 'navigator.javaEnabled()',
        category: 'navigator',
        getValue: () => navigator.javaEnabled()
    },
    {
        id: 'navigator.getBattery()',
        category: 'navigator',
        getValue: () => navigator.getBattery().then(b => ({
            charging: b.charging,
            chargingTime: b.chargingTime,
            level: b.level
        }))
    },
    {
        id: 'navigator.getGamepads()',
        category: 'navigator',
        getValue: () => {
            return Array.from(navigator.getGamepads()).map(gamepad => {
                if (!gamepad) {
                    return null;
                }
        
                return {
                    id: gamepad.id,
                    buttons: gamepad.buttons.length,
                    axes: gamepad.axes.length
                }
            });
        }
    },
    {
        id: 'navigator.permissions.query()',
        category: 'navigator',
        getValue: () => {
            function getPermissionIfKnown(pName) {
                return navigator.permissions.query({name: pName})
                    .then(r => ({name: pName, state: r.state}))
                    .catch(e => ({name: pName, state: 'failure'}))
            }

            return Promise.all([
                getPermissionIfKnown('camera'),
                getPermissionIfKnown('clipboard'),
                getPermissionIfKnown('device-info'),
                getPermissionIfKnown('geolocation'),
                getPermissionIfKnown('gyroscope'),
                getPermissionIfKnown('magnetometer'),
                getPermissionIfKnown('microphone'),
                getPermissionIfKnown('midi'),
                getPermissionIfKnown('notifications'),
                getPermissionIfKnown('persistent-storage'),
                getPermissionIfKnown('push'),
                getPermissionIfKnown('speaker'),
            ]).then(results => {
                const resultsObj = {};

                results.forEach(r => resultsObj[r.name] = r.state);

                return resultsObj;
            });
        }
    },
    // TODO name: 'mediaCapabilities'}, // codecs, mime types, display
    // TODO {name: 'mediaDevices'}, // s
    // TODO {name: 'presentation'}, //TODO nees double checking
    // {name: 'getUserMedia'},

    // window
    {
        id: 'window.devicePixelRatio',
        category: 'window',
        getValue: () => window.devicePixelRatio
    },
    {
        id: 'window.localStorage',
        category: 'window',
        getValue: () => Boolean(window.localStorage)
    },
    {
        id: 'window.sessionStorage',
        category: 'window',
        getValue: () => Boolean(window.sessionStorage)
    },
    {
        id: 'window.indexedDB',
        category: 'window',
        getValue: () => Boolean(window.indexedDB)
    },
    {
        id: 'window.matchMedia("(prefers-reduced-motion: reduce)")',
        category: 'window',
        getValue: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
    },
    {
        id: 'window.matchMedia("(prefers-color-scheme: dark)")',
        category: 'window',
        getValue: () => window.matchMedia("(prefers-color-scheme: dark)").matches
    },
    {
        id: 'window.innerHeight',
        category: 'window',
        getValue: () => window.innerHeight
    },
    {
        id: 'window.outerHeight',
        category: 'window',
        getValue: () => window.outerHeight
    },
    {
        id: 'window.innerWidth',
        category: 'window',
        getValue: () => window.innerWidth
    },
    {
        id: 'window.outerWidth',
        category: 'window',
        getValue: () => window.outerWidth
    },
    {
        id: 'window.openDatabase("test", "1.0", "test", 1024)',
        category: 'window',
        getValue: () => Boolean(window.openDatabase("test", "1.0", "test", 1024))
    },

    // console
    {
        id: 'console.memory',
        category: 'console',
        getValue: () => ({
            jsHeapSizeLimit: console.memory.jsHeapSizeLimit,
            totalJSHeapSize: console.memory.totalJSHeapSize,
            usedJSHeapSize: console.memory.usedJSHeapSize
        })
    },

    // Performance
    {
        id: 'performance.memory',
        category: 'performance',
        getValue: () => ({
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            usedJSHeapSize: performance.memory.usedJSHeapSize
        })
    },

    // TODO fonts document.fonts.check
    // TODO performance.timing

    // Screen
    {
        id: 'PerformanceNavigationTiming.nextHopProtocol',
        category: 'performance',
        getValue: () => performance.getEntries()[0].nextHopProtocol
    },
    {
        id: 'screen.width',
        category: 'screen',
        getValue: () => screen.width
    },
    {
        id: 'screen.height',
        category: 'screen',
        getValue: () => screen.height
    },
    {
        id: 'screen.availWidth',
        category: 'screen',
        getValue: () => screen.availWidth
    },
    {
        id: 'screen.availHeight',
        category: 'screen',
        getValue: () => screen.availHeight
    },
    {
        id: 'screen.colorDepth',
        category: 'screen',
        getValue: () => screen.colorDepth
    },
    {
        id: 'screen.pixelDepth',
        category: 'screen',
        getValue: () => screen.pixelDepth
    },
    {
        id: 'screen.availLeft',
        category: 'screen',
        getValue: () => screen.availLeft
    },
    {
        id: 'screen.availTop',
        category: 'screen',
        getValue: () => screen.availTop
    },
    {
        id: 'screen.orientation',
        category: 'screen',
        getValue: () => ({
            angle: screen.orientation.angle,
            type: screen.orientation.type
        })
    },

];

/**
 * Test runner
 */
function runTests() {
    startButton.setAttribute('disabled', 'disabled');
    downloadButton.removeAttribute('disabled');
    results.results.length = 0;
    results.date = (new Date()).toUTCString();

    testsSummaryDiv.innerText = `Running ${tests.length} tests.`;

    tests.forEach(test => {
        const resultObj = {
            id: test.id,
            category: test.category
        };
        results.results.push(resultObj);

        let categoryUl = document.querySelector(`.category-${test.category} ul`);

        if (!categoryUl) {
            const category = document.createElement('div');
            category.classList.add(`category-${test.category}`);
            category.innerText = test.category;
            categoryUl = document.createElement('ul');
            category.appendChild(categoryUl);

            testsDiv.appendChild(category);
        }

        const li = document.createElement('li');
        li.id = `test-${test.category}-${test.id}`;
        li.innerHTML = `${test.id} - <span class='value'></span>`;
        const valueSpan = li.querySelector('.value');

        categoryUl.appendChild(li);

        try {
            const value = test.getValue();

            if (value instanceof Promise) {
                value.then(v => {
                    valueSpan.innerHTML = `(${typeof v}) - <code>${JSON.stringify(v, null, 2)}</code>`;
                    resultObj.value = v;
                }).catch(e => {
                    valueSpan.innerHTML = `❌ error thrown ("${e}")`;
                    resultObj.value = undefined;
                });
            } else {
                valueSpan.innerHTML = `(${typeof value}) - <code>${JSON.stringify(value, null, 2)}</code>`;
                resultObj.value = value;
            }
        } catch (e) {
            valueSpan.innerHTML = `❌ error thrown ("${e}")`;
            resultObj.value = undefined;
        }
    });

    saveToLS.removeAttribute('disabled');
    compareWithFile.removeAttribute('disabled');

    // when there is data in localStorage enable comparing with localStorage
    if (localStorage.getItem('results')) {
        compareWithLS.removeAttribute('disabled');
    }
}

function downloadTheResults() {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], {type: 'application/json'}));
    a.href = url;
    a.download = 'fingerprinting-results.json';
    
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

function compareResults(resultsA, resultsB) {
    const resultsAObj = {};
    const resultsBObj = {};

    resultsA.results.forEach(result => resultsAObj[result.id] = result);
    resultsB.results.forEach(result => resultsBObj[result.id] = result);

    const diff = DeepDiff(resultsAObj, resultsBObj);

    console.log(diff);
    const list = document.createDocumentFragment();

    if (diff === undefined) {
        diffSummaryDiv.innerText = 'Results are identical.';
    } else {
        diffSummaryDiv.innerText = `There are ${diff.length} difference${diff.length === 1 ? '' : 's'} between those results.`;

        diff.forEach(change => {
            const li = document.createElement('li'); 

            const testId = change.path[0];
            let path = '';

            change.path.forEach((segment, idx) => {
                if (idx < 2) {
                    return;
                }

                path += '→ ' + segment;
            });

            const testA = resultsAObj[testId];
            const testB = resultsBObj[testId];

            if (change.kind === 'E') { // modified property
                li.innerHTML = `<strong>${testId}</strong> ${path} - value <span class='changed'>changed</span> from "<code>${change.lhs}</code>" to "<code>${change.rhs}</code>"`;
            } else if (change.kind === 'A') { // array change
                if (change.item.kind === 'A') {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - new item "<code>${change.item.lhs}</code>" <span class='added'>added</span> ("<code>${JSON.stringify(testB.value, null, 2)}</code>")`;
                } else if (change.item.kind === 'D') {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - item "<code>${change.item.lhs}</code>" <span class='removed'>removed</span> ("<code>${JSON.stringify(testB.value, null, 2)}</code>")`;
                }
            } else if (change.kind === 'D') { // deleted property
                if (change.item) {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - item "<code>${change.item.rhs}</code>" <span class='removed'>removed</span>`;
                } else {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - property <span class='removed'>missing</span>`;
                }
            } else if (change.kind === 'N') { // added property
                if (change.item) {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - new item <span class='added'>added</span> "<code>${change.item.lhs}</code>" ("<code>${JSON.stringify(testB.value, null, 2)}</code>")`;
                } else {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - <span class='added'>new</span> property ("<code>${JSON.stringify(testB.value, null, 2)}</code>")`;
                }
            }

            list.appendChild(li);
        });
    }

    diffDetailsDiv.innerHTML = '';
    diffDetailsDiv.appendChild(list);

    diffDiv.removeAttribute('hidden');
}

saveToLS.addEventListener('click', () => {
    localStorage.setItem('results', JSON.stringify(results, null, 2));
});

compareWithLS.addEventListener('click', () => {
    const oldResults = JSON.parse(localStorage.getItem('results'));

    compareResults(oldResults, results);
});

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
startButton.addEventListener('click', () => runTests());

// if url contains 'run-tests'
if (document.location.search === '?run') {
    runTests();
}
