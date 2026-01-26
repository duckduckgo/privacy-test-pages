/* eslint-disable n/no-callback-literal */
const resultsDiv = document.querySelector('#results');
const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');
const domainSelect = document.querySelector('#domain-select');

// These are computed at test run time based on the selected domain
let TESTED_DOMAIN = '';
let TESTED_URL = '';
let random = 0;

function initTestRun () {
    random = Math.random();
    TESTED_DOMAIN = domainSelect.value;
    TESTED_URL = `https://${TESTED_DOMAIN}/privacy-protections/request-blocking/block-me`;
}

// Object that contains results of all tests
const results = {
    page: 'blocking-behaviour',
    date: null,
    testedDomain: null,
    results: []
};

/**
 * Helper to serialize error objects (without stack trace for readability)
 */
function serializeError (error) {
    if (!error) return null;

    const serialized = {
        name: error.name,
        message: error.message
    };

    // Capture code if present (e.g., DOMException code)
    if (error.code !== undefined) {
        serialized.code = error.code;
    }

    return serialized;
}

/**
 * Helper to serialize events
 */
function serializeEvent (event) {
    if (!event) return null;

    const serialized = {
        type: event.type,
        bubbles: event.bubbles,
        cancelable: event.cancelable,
        defaultPrevented: event.defaultPrevented,
        eventPhase: event.eventPhase,
        isTrusted: event.isTrusted,
        timeStamp: event.timeStamp
    };

    // For ErrorEvent
    if (event instanceof ErrorEvent) {
        serialized.message = event.message;
        serialized.filename = event.filename;
        serialized.lineno = event.lineno;
        serialized.colno = event.colno;
        serialized.error = serializeError(event.error);
    }

    // For ProgressEvent (XHR)
    if (event instanceof ProgressEvent) {
        serialized.lengthComputable = event.lengthComputable;
        serialized.loaded = event.loaded;
        serialized.total = event.total;
    }

    return serialized;
}

/**
 * Format a value for display in the result table
 */
function formatValue (value, key) {
    if (value === null || value === undefined) {
        return { text: String(value), className: 'empty' };
    }

    // Special formatting for error objects
    if (typeof value === 'object' && value.name && value.message && (key === 'error' || key === 'exception' || key.toLowerCase().includes('error'))) {
        const code = value.code !== undefined ? ` (code: ${value.code})` : '';
        return { text: `${value.name}: ${value.message}${code}`, className: 'error-value' };
    }

    // Format mediaError
    if (key === 'mediaError' && typeof value === 'object') {
        const msg = value.message ? `: ${value.message}` : '';
        return { text: `code: ${value.code}${msg}`, className: 'error-value' };
    }

    // Format closeEvent (WebSocket)
    if (key === 'closeEvent' && typeof value === 'object') {
        return { text: `code: ${value.code}, wasClean: ${value.wasClean}, reason: "${value.reason || ''}"`, className: '' };
    }

    // Format size
    if (key === 'size' && typeof value === 'object' && 'width' in value && 'height' in value) {
        return { text: `${value.width} × ${value.height}`, className: '' };
    }

    // Format finalState as key: value pairs
    if (key === 'finalState' && typeof value === 'object') {
        const lines = Object.entries(value).map(([k, v]) => {
            if (v === '') return `${k}: (empty)`;
            return `${k}: ${v}`;
        });
        return { text: lines.join('\n'), className: '' };
    }

    // Format imageProperties
    if (key === 'imageProperties' && typeof value === 'object') {
        const lines = Object.entries(value).map(([k, v]) => `${k}: ${v}`);
        return { text: lines.join('\n'), className: '' };
    }

    // Format response object
    if (key === 'response' && typeof value === 'object') {
        const lines = Object.entries(value).map(([k, v]) => {
            if (typeof v === 'object') return `${k}: ${JSON.stringify(v)}`;
            return `${k}: ${v}`;
        });
        return { text: lines.join('\n'), className: '' };
    }

    // Format arrays of events more readably
    if (Array.isArray(value) && value.length > 0 && value[0].type) {
        const eventList = value.map(e => {
            const extras = [];
            if (e.loaded !== undefined) extras.push(`loaded: ${e.loaded}`);
            if (e.code !== undefined) extras.push(`code: ${e.code}`);
            if (e.reason !== undefined && e.reason !== '') extras.push(`reason: "${e.reason}"`);
            if (e.wasClean !== undefined) extras.push(`wasClean: ${e.wasClean}`);
            const extraStr = extras.length ? ` (${extras.join(', ')})` : '';
            return `${e.type}${extraStr}`;
        }).join('\n');
        return { text: eventList, className: '' };
    }

    // Format state changes readably
    if (Array.isArray(value) && value.length > 0 && value[0].readyState !== undefined) {
        const stateList = value.map(s => {
            return `[${s.event}] readyState: ${s.readyState}, status: ${s.status}`;
        }).join('\n');
        return { text: stateList, className: '' };
    }

    if (typeof value === 'object') {
        return { text: JSON.stringify(value, null, 2), className: '' };
    }

    return { text: String(value), className: '' };
}

/**
 * Render a result table for a test
 */
function renderResultTable (data, container) {
    const table = document.createElement('table');
    table.className = 'result-table';

    for (const [key, value] of Object.entries(data)) {
        const row = document.createElement('tr');
        const th = document.createElement('th');
        const td = document.createElement('td');

        th.textContent = key;

        const formatted = formatValue(value, key);
        td.textContent = formatted.text;
        if (formatted.className) {
            td.className = formatted.className;
        }

        row.appendChild(th);
        row.appendChild(td);
        table.appendChild(row);
    }

    container.appendChild(table);
}

/**
 * Test definitions
 */
const tests = [
    {
        id: 'fetch-basic',
        name: 'fetch() - Basic Request',
        description: 'Tests fetch() error behavior and captured exception details',
        run: async () => {
            const url = `${TESTED_URL}/fetch.json?fetch-basic-${random}`;
            const result = {
                url,
                success: false,
                response: null,
                error: null
            };

            try {
                const response = await fetch(url);
                result.success = true;
                result.response = {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    type: response.type,
                    url: response.url,
                    redirected: response.redirected,
                    headers: Object.fromEntries([...response.headers.entries()])
                };

                try {
                    result.responseBody = await response.text();
                } catch (e) {
                    result.responseBodyError = serializeError(e);
                }
            } catch (e) {
                result.error = serializeError(e);
            }

            return result;
        }
    },
    {
        id: 'fetch-cors',
        name: 'fetch() - CORS Mode',
        description: 'Tests fetch() with explicit CORS mode',
        run: async () => {
            const url = `${TESTED_URL}/fetch.json?fetch-cors-${random}`;
            const result = {
                url,
                success: false,
                response: null,
                error: null
            };

            try {
                const response = await fetch(url, { mode: 'cors' });
                result.success = true;
                result.response = {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    type: response.type,
                    url: response.url
                };
            } catch (e) {
                result.error = serializeError(e);
            }

            return result;
        }
    },
    {
        id: 'fetch-no-cors',
        name: 'fetch() - No-CORS Mode',
        description: 'Tests fetch() with no-cors mode (opaque response)',
        run: async () => {
            const url = `${TESTED_URL}/fetch.json?fetch-no-cors-${random}`;
            const result = {
                url,
                success: false,
                response: null,
                error: null
            };

            try {
                const response = await fetch(url, { mode: 'no-cors' });
                result.success = true;
                result.response = {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    type: response.type,
                    url: response.url
                };
            } catch (e) {
                result.error = serializeError(e);
            }

            return result;
        }
    },
    {
        id: 'xhr-async',
        name: 'XMLHttpRequest - Async',
        description: 'Tests XHR with all event handlers and state tracking',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/ajax.json?xhr-async-${random}`;
                const result = {
                    url,
                    events: [],
                    stateChanges: [],
                    finalState: null,
                    error: null
                };

                const xhr = new XMLHttpRequest();

                const captureState = (eventName) => {
                    result.stateChanges.push({
                        event: eventName,
                        readyState: xhr.readyState,
                        status: (() => { try { return xhr.status; } catch { return 'error'; } })(),
                        statusText: (() => { try { return xhr.statusText; } catch { return 'error'; } })(),
                        responseType: xhr.responseType,
                        responseURL: xhr.responseURL,
                        responseText: (() => { try { return xhr.responseText; } catch { return 'error'; } })()
                    });
                };

                ['loadstart', 'progress', 'load', 'loadend', 'error', 'abort', 'timeout'].forEach(eventName => {
                    xhr.addEventListener(eventName, (e) => {
                        result.events.push(serializeEvent(e));
                        captureState(eventName);
                    });
                });

                xhr.addEventListener('readystatechange', () => {
                    captureState('readystatechange');
                });

                xhr.addEventListener('loadend', () => {
                    result.finalState = {
                        readyState: xhr.readyState,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseURL: xhr.responseURL,
                        getAllResponseHeaders: xhr.getAllResponseHeaders()
                    };

                    resolve(result);
                });

                xhr.open('GET', url, true);
                xhr.send();
            });
        }
    },
    {
        id: 'xhr-sync',
        name: 'XMLHttpRequest - Sync',
        description: 'Tests synchronous XHR behavior when blocked',
        run: () => {
            const url = `${TESTED_URL}/ajax.json?xhr-sync-${random}`;
            const result = {
                url,
                exception: null,
                finalState: null
            };

            const xhr = new XMLHttpRequest();

            try {
                xhr.open('GET', url, false); // synchronous
                xhr.send();
                result.finalState = {
                    readyState: xhr.readyState,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseURL: xhr.responseURL,
                    responseText: xhr.responseText,
                    getAllResponseHeaders: xhr.getAllResponseHeaders()
                };
            } catch (e) {
                result.exception = serializeError(e);
            }

            return result;
        }
    },
    {
        id: 'image-element',
        name: 'Image Element',
        description: 'Tests Image() constructor load/error events',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/img.jpg?img-element-${random}`;
                const result = {
                    url,
                    events: [],
                    imageProperties: null
                };

                const img = new Image();

                ['load', 'error', 'abort'].forEach(eventName => {
                    img.addEventListener(eventName, (e) => {
                        result.events.push(serializeEvent(e));
                    });
                });

                img.addEventListener('load', () => {
                    result.imageProperties = {
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        width: img.width,
                        height: img.height
                    };
                    resolve(result);
                });

                img.addEventListener('error', () => {
                    result.imageProperties = {
                        complete: img.complete,
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        width: img.width,
                        height: img.height
                    };
                    resolve(result);
                });

                img.src = url;
            });
        }
    },
    {
        id: 'script-element',
        name: 'Script Element',
        description: 'Tests dynamically created script element load/error events',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/script.js?script-element-${random}`;
                const result = {
                    url,
                    events: [],
                    globalCallbackCalled: false
                };

                // Set up global callback that the script would call if loaded
                const callbackName = `scriptCallback_${random}`.replace('.', '_');
                window[callbackName] = () => {
                    result.globalCallbackCalled = true;
                };

                const script = document.createElement('script');

                ['load', 'error'].forEach(eventName => {
                    script.addEventListener(eventName, (e) => {
                        result.events.push(serializeEvent(e));
                    });
                });

                const finish = () => {
                    delete window[callbackName];
                    resolve(result);
                };

                script.addEventListener('load', finish);
                script.addEventListener('error', finish);

                script.src = url;
                document.head.appendChild(script);
            });
        }
    },
    {
        id: 'link-stylesheet',
        name: 'Link Stylesheet',
        description: 'Tests dynamically created stylesheet link element',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/style.css?link-stylesheet-${random}`;
                const result = {
                    url,
                    events: [],
                    styleApplied: false
                };

                const link = document.createElement('link');
                link.rel = 'stylesheet';

                // Create a test element to see if styles are applied
                const testEl = document.createElement('div');
                testEl.id = `style-test-${random}`.replace('.', '-');
                document.body.appendChild(testEl);

                ['load', 'error'].forEach(eventName => {
                    link.addEventListener(eventName, (e) => {
                        result.events.push(serializeEvent(e));
                    });
                });

                const finish = () => {
                    result.styleApplied = window.getComputedStyle(testEl).content.includes('works');
                    testEl.remove();
                    resolve(result);
                };

                link.addEventListener('load', finish);
                link.addEventListener('error', finish);

                link.href = url;
                document.head.appendChild(link);
            });
        }
    },
    {
        id: 'websocket',
        name: 'WebSocket',
        description: 'Tests WebSocket connection error details',
        run: () => {
            return new Promise((resolve) => {
                const url = `wss://${TESTED_DOMAIN}/block-me/web-socket?${random}`;
                const result = {
                    url,
                    events: [],
                    closeEvent: null,
                    constructorError: null,
                    finalState: null
                };

                try {
                    const socket = new WebSocket(url);

                    ['open', 'message', 'error', 'close'].forEach(eventName => {
                        socket.addEventListener(eventName, (e) => {
                            const eventData = {
                                type: e.type,
                                timeStamp: e.timeStamp,
                                isTrusted: e.isTrusted
                            };

                            if (e.type === 'close') {
                                eventData.code = e.code;
                                eventData.reason = e.reason;
                                eventData.wasClean = e.wasClean;
                                result.closeEvent = eventData;
                            }

                            if (e.type === 'message') {
                                eventData.data = e.data;
                            }

                            result.events.push(eventData);
                        });
                    });

                    socket.addEventListener('close', () => {
                        result.finalState = {
                            readyState: socket.readyState,
                            bufferedAmount: socket.bufferedAmount,
                            protocol: socket.protocol,
                            url: socket.url
                        };
                        resolve(result);
                    });

                    socket.addEventListener('error', () => {
                        // Error event might fire before close
                    });

                    // Timeout in case neither event fires
                    setTimeout(() => {
                        result.finalState = {
                            readyState: socket.readyState,
                            bufferedAmount: socket.bufferedAmount,
                            protocol: socket.protocol,
                            url: socket.url
                        };
                        resolve(result);
                    }, 3000);
                } catch (e) {
                    result.constructorError = serializeError(e);
                    resolve(result);
                }
            });
        }
    },
    {
        id: 'eventsource',
        name: 'EventSource (SSE)',
        description: 'Tests Server-Sent Events connection error details',
        run: () => {
            return new Promise((resolve) => {
                const url = `https://${TESTED_DOMAIN}/block-me/server-sent-events?${random}`;
                const result = {
                    url,
                    events: [],
                    constructorError: null,
                    finalState: null
                };

                try {
                    const eventSource = new EventSource(url);

                    ['open', 'message', 'error'].forEach(eventName => {
                        eventSource.addEventListener(eventName, (e) => {
                            result.events.push({
                                type: e.type,
                                timeStamp: e.timeStamp,
                                isTrusted: e.isTrusted,
                                data: e.data
                            });

                            if (e.type === 'error' || e.type === 'open') {
                                result.finalState = {
                                    readyState: eventSource.readyState,
                                    url: eventSource.url,
                                    withCredentials: eventSource.withCredentials
                                };
                                eventSource.close();
                                resolve(result);
                            }
                        });
                    });

                    // Timeout
                    setTimeout(() => {
                        result.finalState = {
                            readyState: eventSource.readyState,
                            url: eventSource.url
                        };
                        eventSource.close();
                        resolve(result);
                    }, 3000);
                } catch (e) {
                    result.constructorError = serializeError(e);
                    resolve(result);
                }
            });
        }
    },
    {
        id: 'sendbeacon',
        name: 'sendBeacon()',
        description: 'Tests navigator.sendBeacon return value',
        run: () => {
            const url = `https://${TESTED_DOMAIN}/block-me/beacon?sendbeacon-${random}`;
            const result = {
                url,
                returnValue: null
            };

            result.returnValue = navigator.sendBeacon(url, 'test=data');

            return result;
        }
    },
    {
        id: 'iframe-src',
        name: 'Iframe src',
        description: 'Tests iframe load behavior with blocked URL',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/frame.html?iframe-src-${random}`;
                const result = {
                    url,
                    events: [],
                    messageReceived: false,
                    contentAccessible: null,
                    contentAccessError: null
                };

                const iframe = document.createElement('iframe');
                iframe.style.width = '100px';
                iframe.style.height = '50px';

                ['load', 'error'].forEach(eventName => {
                    iframe.addEventListener(eventName, (e) => {
                        result.events.push(serializeEvent(e));
                    });
                });

                const onMessage = (e) => {
                    if (e.data && e.data.includes && e.data.includes('frame loaded')) {
                        result.messageReceived = true;
                    }
                };
                window.addEventListener('message', onMessage);

                iframe.addEventListener('load', () => {
                    try {
                        result.contentAccessible = !!iframe.contentDocument;
                        if (iframe.contentDocument) {
                            result.contentDocumentURL = iframe.contentDocument.URL;
                        }
                    } catch (e) {
                        result.contentAccessError = serializeError(e);
                    }

                    setTimeout(() => {
                        window.removeEventListener('message', onMessage);
                        iframe.remove();
                        resolve(result);
                    }, 500);
                });

                iframe.src = url;
                document.body.appendChild(iframe);
            });
        }
    },
    {
        id: 'object-data',
        name: 'Object Element',
        description: 'Tests object element with blocked data URL',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/object.png?object-data-${random}`;
                const result = {
                    url,
                    events: [],
                    size: null
                };

                const obj = document.createElement('object');
                obj.type = 'image/png';

                ['load', 'error'].forEach(eventName => {
                    obj.addEventListener(eventName, (e) => {
                        result.events.push(serializeEvent(e));
                    });
                });

                const finish = () => {
                    const rect = obj.getBoundingClientRect();
                    result.size = { width: rect.width, height: rect.height };
                    obj.remove();
                    resolve(result);
                };

                obj.addEventListener('load', finish);
                obj.addEventListener('error', finish);

                // Fallback timeout
                setTimeout(finish, 2000);

                obj.data = url;
                document.body.appendChild(obj);
            });
        }
    },
    {
        id: 'audio-src',
        name: 'Audio Element',
        description: 'Tests audio element with blocked source',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/audio.wav?audio-src-${random}`;
                const result = {
                    url,
                    events: [],
                    mediaError: null,
                    networkState: null,
                    readyState: null
                };

                const audio = document.createElement('audio');

                ['loadstart', 'loadeddata', 'canplay', 'error', 'abort', 'stalled', 'suspend'].forEach(eventName => {
                    audio.addEventListener(eventName, (e) => {
                        result.events.push({
                            type: e.type,
                            timeStamp: e.timeStamp
                        });
                    });
                });

                const finish = () => {
                    result.networkState = audio.networkState;
                    result.readyState = audio.readyState;
                    if (audio.error) {
                        result.mediaError = {
                            code: audio.error.code,
                            message: audio.error.message
                        };
                    }
                    resolve(result);
                };

                audio.addEventListener('error', finish);
                audio.addEventListener('canplay', finish);

                // Timeout fallback
                setTimeout(finish, 3000);

                audio.src = url;
            });
        }
    },
    {
        id: 'video-src',
        name: 'Video Element',
        description: 'Tests video element with blocked source',
        run: () => {
            return new Promise((resolve) => {
                const url = `${TESTED_URL}/video.mp4?video-src-${random}`;
                const result = {
                    url,
                    events: [],
                    mediaError: null,
                    networkState: null,
                    readyState: null
                };

                const video = document.createElement('video');

                ['loadstart', 'loadeddata', 'canplay', 'error', 'abort', 'stalled', 'suspend'].forEach(eventName => {
                    video.addEventListener(eventName, (e) => {
                        result.events.push({
                            type: e.type,
                            timeStamp: e.timeStamp
                        });
                    });
                });

                const finish = () => {
                    result.networkState = video.networkState;
                    result.readyState = video.readyState;
                    if (video.error) {
                        result.mediaError = {
                            code: video.error.code,
                            message: video.error.message
                        };
                    }
                    resolve(result);
                };

                video.addEventListener('error', finish);
                video.addEventListener('canplay', finish);

                // Timeout fallback
                setTimeout(finish, 3000);

                video.src = url;
            });
        }
    }
];

/**
 * Run a single test and render results
 */
async function runTest (test) {
    const section = document.createElement('div');
    section.className = 'test-section';
    section.id = `test-${test.id}`;

    const header = document.createElement('h3');
    header.textContent = test.name;
    section.appendChild(header);

    const description = document.createElement('p');
    description.className = 'description';
    description.textContent = test.description;
    section.appendChild(description);

    resultsDiv.appendChild(section);

    try {
        const result = await test.run();
        results.results.push({
            id: test.id,
            name: test.name,
            data: result
        });

        renderResultTable(result, section);
    } catch (e) {
        const errorResult = {
            id: test.id,
            name: test.name,
            testError: serializeError(e)
        };
        results.results.push(errorResult);

        const errorPre = document.createElement('pre');
        errorPre.textContent = `Test execution error: ${e.message}\n${e.stack}`;
        section.appendChild(errorPre);
    }
}

/**
 * Run all tests
 */
async function runTests () {
    initTestRun();

    startButton.setAttribute('disabled', 'disabled');
    domainSelect.setAttribute('disabled', 'disabled');
    downloadButton.removeAttribute('disabled');

    results.results = [];
    results.date = new Date().toUTCString();
    results.testedDomain = TESTED_DOMAIN;
    resultsDiv.innerHTML = '';

    for (const test of tests) {
        await runTest(test);
    }

    startButton.removeAttribute('disabled');
    domainSelect.removeAttribute('disabled');
}

/**
 * Download results as JSON
 */
function downloadTheResults () {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.href = url;
    a.download = 'blocking-behaviour-results.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

// Event listeners
downloadButton.addEventListener('click', () => downloadTheResults());
startButton.addEventListener('click', () => runTests());

// Auto-run if ?run query param is present
if (document.location.search === '?run') {
    runTests();
}

// Expose for external access
window.runTests = runTests;
window.results = results;
