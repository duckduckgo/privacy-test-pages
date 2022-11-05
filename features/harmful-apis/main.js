const PAGE_NAME = 'harmful-apis';

const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsDiv = document.querySelector('#tests-details');

const tests = [
    {
        id: 'battery-api',
        run: () => {
            return ('getBattery' in navigator);
        }
    },
    {
        id: 'webbluetooth-api',
        run: () => {
            return ('bluetooth' in navigator);
        }
    },
    {
        id: 'webusb-api',
        run: () => {
            return ('usb' in navigator);
        }
    },
    {
        id: 'webnfc-api',
        run: () => {
            return ('NDEFReader' in window);
        }
    },
    {
        id: 'webserial-api',
        run: () => {
            return ('serial' in navigator);
        }
    },
    {
        id: 'webhid-api',
        run: () => {
            return ('hid' in navigator);
        }
    },
    {
        id: 'accelerometer-api',
        run: () => {
            return ('Accelerometer' in window);
        }
    },
    {
        id: 'linearaccelerationsensor-api',
        run: () => {
            return ('LinearAccelerationSensor' in window);
        }
    },
    {
        id: 'absoluteorientationsensor-api',
        run: () => {
            return ('AbsoluteOrientationSensor' in window);
        }
    },
    {
        id: 'gyroscope-api',
        run: () => {
            return ('Gyroscope' in window);
        }
    },
    {
        id: 'relativeorientationsensor-api',
        run: () => {
            return ('RelativeOrientationSensor' in window);
        }
    },
    {
        id: 'gravitysensor-api',
        run: () => {
            return ('GravitySensor' in window);
        }
    },
    {
        id: 'ambientlightsensor-api',
        run: () => {
            return ('AmbientLightSensor' in window);
        }
    },
    {
        id: 'magnetometer-api',
        run: () => {
            return ('Magnetometer' in window);
        }
    },
    {
        id: 'keyboard-api',
        run: () => {
            return ('keyboard' in navigator);
        }
    },
    {
        id: 'installed-related-apps-api',
        run: () => {
            return ('getInstalledRelatedApps' in navigator);
        }
    },
    {
        id: 'hardwareConcurrency-api',
        run: () => {
            return ('hardwareConcurrency' in navigator);
        }
    },
    {
        id: 'deviceMemory-api',
        run: () => {
            return ('deviceMemory' in navigator);
        }
    },
    {
        id: 'mediadevices-enumarete-devices-api',
        run: () => {
            return ('MediaDevices' in window) && ('enumerateDevices' in MediaDevices.prototype);
        }
    },
    {
        id: 'storage-manager-estimate-api',
        run: () => {
            return ('StorageManager' in window) && ('estimate' in StorageManager.prototype);
        }
    },
    {
        id: 'network-information-api',
        run: () => {
            return ('connection' in navigator);
        }
    },
    {
        id: 'client-hints-api',
        run: () => {
            return fetch('/reflect-headers')
                .then(r => r.json())
                .then(data => {
                    const chData = {
                        'device-memory': data.headers['device-memory'],
                        downlink: data.headers.downlink,
                        dpr: data.headers.dpr,
                        ect: data.headers.ect,
                        rtt: data.headers.rtt,
                        'viewport-width': data.headers['viewport-width']
                    };

                    if (Object.values(chData).every(i => i === undefined)) {
                        return false;
                    }

                    return chData;
                });
        }
    },
    {
        id: 'topics-api',
        run: () => {
            return ('browsingTopics' in document);
        }
    },
    {
        id: 'floc-api',
        run: () => {
            return ('interestCohort' in document);
        }
    },
    {
        id: 'idle-detection-api',
        run: () => {
            return ('IdleDetector' in window);
        }
    },
    {
        id: 'native-filesystem-api',
        run: () => {
            return ('showOpenFilePicker' in window);
        }
    },
    {
        id: 'background-sync-api',
        run: () => {
            return ('ServiceWorkerRegistration' in window) && ('sync' in ServiceWorkerRegistration.prototype);
        }
    },
    {
        id: 'periodic-sync-api',
        run: () => {
            return ('ServiceWorkerRegistration' in window) && ('periodicSync' in ServiceWorkerRegistration.prototype);
        }
    },
    {
        id: 'push-api',
        run: () => {
            return ('ServiceWorkerRegistration' in window) && ('pushManager' in ServiceWorkerRegistration.prototype);
        }
    },
    {
        id: 'first-party-sets-api',
        run: () => {
            if (!window.cookieStore) {
                return '❌ Can\'t be tested - CookieStore not available';
            }

            return window.cookieStore.set({ name: 'first-party-sets-test', value: 'value' })
                .then(() => window.cookieStore.getAll())
                .then(cookies => {
                    const cookie = cookies.find(c => c.name === 'first-party-sets-test');

                    return ('sameParty' in cookie);
                });
        }
    },
    {
        id: 'fledge',
        run: () => {
            return ('joinAdInterestGroup' in navigator) || ('runAdAuction' in navigator);
        }
    }
];

// object that contains results of all tests
const results = {
    page: `${PAGE_NAME}-test`,
    date: null,
    results: []
};

function resultToHTML (data) {
    return ((data === false) ? '❌ API not available' : '✅ API available') + ' (' + JSON.stringify(data, null, 2) + ')';
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
                valueSpan.innerHTML = resultToHTML(result);
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
    a.download = `${PAGE_NAME}-results.json`;

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
startButton.addEventListener('click', () => runTests());

// if url query is '?run'
if (document.location.search === '?run') {
    runTests();
}
