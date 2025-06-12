/* eslint-disable n/no-callback-literal */
const random = Math.random();
const debugDiv = document.querySelector('#debug');
const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');

const TRACKER_DOMAIN = 'bad.third-party.site';
const TRACKER_RESOURCES_URL = `https://${TRACKER_DOMAIN}/privacy-protections/request-blocking/block-me`;

// object that contains results of all tests
const results = {
    page: 'request-blocking',
    results: []
};

/**
 * List of tests each testing different way of making a request
 */
const tests = [
    {
        category: 'html',
        id: 'script',
        description: 'Try loading a JavaScript file using <code>&lt;script&gt;</code> element.',
        html: () => {
            // for some reason returning a string here does not work, I have to construct nodes in JS
            const script = document.createElement('script');
            script.src = `${TRACKER_RESOURCES_URL}/script.js?${random}`;

            return script;
        },
        checkAsync: (callback) => {
            // when script loads it will call this global function
            window.scriptLoadedCallback = callback.bind(null, 'loaded');
        }
    },
    {
        category: 'html',
        id: 'style',
        description: 'Try loading a CSS file using <code>&lt;link&gt;</code> element.',
        html: `<link href='${TRACKER_RESOURCES_URL}/style.css?${random}' rel='stylesheet'></link>
        <div id='html-style-test'></div>`,
        check: () => {
            const item = document.querySelector('#html-style-test');

            if (item) {
                const content = window.getComputedStyle(item).content;

                if (content.includes('works')) {
                    return 'loaded';
                }
            }
        }
    },
    {
        category: 'html',
        id: 'img',
        description: 'Try loading an image using <code>&lt;img&gt;</code> element.',
        html: `<img src='${TRACKER_RESOURCES_URL}/img.jpg?${random}' id='html-img-test'/>`,
        check: () => {
            const item = document.querySelector('#html-img-test');

            if (item) {
                const size = item.getBoundingClientRect();

                if (size.width === 100) {
                    return 'loaded';
                }
            }
        }
    },
    {
        category: 'html',
        id: 'picture',
        description: 'Try loading an image using <code>&lt;picture&gt;</code> element.',
        html: `<picture id='html-picture-test' style='display: inline-block'>
        <source srcset="${TRACKER_RESOURCES_URL}/picture.jpg?${random}">
        <img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' />
        </picture>`,
        check: () => {
            const item = document.querySelector('#html-picture-test');

            if (item) {
                const size = item.getBoundingClientRect();

                if (size.width === 100) {
                    return 'loaded';
                }
            }
        }
    },
    {
        category: 'html',
        id: 'object',
        description: 'Try loading an image using <code>&lt;object&gt;</code> element.',
        html: `<object type="image/png" data="${TRACKER_RESOURCES_URL}/object.png?${random}" id='html-object-test'></object>`,
        check: () => {
            const item = document.querySelector('#html-object-test');

            if (item) {
                const size = item.getBoundingClientRect();

                if (size.width === 100) {
                    return 'loaded';
                }
            }
        }
    },
    {
        category: 'html',
        id: 'audio',
        description: 'Try loading an audio file using <code>&lt;audio&gt;</code> element.',
        html: `<audio src='${TRACKER_RESOURCES_URL}/audio.wav?${random}' id='html-audio-test'></audio>`,
        check: () => {
            const item = document.querySelector('#html-audio-test');

            if (item && item.duration > 0) {
                return 'loaded';
            }
        }
    },
    {
        category: 'html',
        id: 'video',
        description: 'Try loading a video file using <code>&lt;video&gt;</code> element.',
        html: `<video src='${TRACKER_RESOURCES_URL}/video.mp4?${random}' id='html-video-test' style='max-width: 100px'></video>`,
        check: () => {
            const item = document.querySelector('#html-video-test');

            if (item && item.duration > 0) {
                return 'loaded';
            }
        }
    },
    {
        category: 'html',
        id: 'iframe',
        description: 'Try loading a frame using <code>&lt;iframe&gt;</code> element.',
        html: `<iframe src='${TRACKER_RESOURCES_URL}/frame.html?${random}' style='width:100px' id='html-iframe-test'></iframe>`,
        checkAsync: (callback) => {
            const item = document.querySelector('#html-iframe-test');

            if (item) {
                const onMessage = msg => {
                    if (msg.data.includes('frame loaded')) {
                        callback('loaded');
                        window.removeEventListener('message', onMessage);
                    }
                };

                window.addEventListener('message', onMessage);
            }
        }
    },

    {
        category: 'css',
        id: 'import',
        description: 'Try loading a CSS file using <code>@import url(…)</code>.',
        html: `<style>@import url(${TRACKER_RESOURCES_URL}/cssImport.css?${random});</style>
        <div id='css-import-test'></div>`,
        check: () => {
            const item = document.querySelector('#css-import-test');

            if (item) {
                const content = window.getComputedStyle(item).content;

                if (content.includes('works')) {
                    return 'loaded';
                }
            }
        }
    },
    {
        category: 'css',
        id: 'font',
        description: 'Try loading a font file using <code>@font-face {src: url(…)}</code>.',
        html: `<style>@font-face {
            font-family: fakeFont;
            src: url(${TRACKER_RESOURCES_URL}/cssfont.woff?${random});
        }
        
        #css-font-test {
            font-family: 'fakeFont';
        }</style>
        <div id='css-font-test'>text</div>`,
        check: () => {
            const item = document.querySelector('#css-font-test');

            if (item) {
                const size = item.getBoundingClientRect();

                if (size.height >= 20) {
                    return 'loaded';
                }
            }
        }
    },
    {
        category: 'css',
        id: 'background',
        description: 'Try loading an image using <code>background: url(…)</code>.',
        html: `<style>
        #css-bg-test {
            background: url(${TRACKER_RESOURCES_URL}/cssbg.jpg?${random});
            width: 100px;
            height: 100px;
        }</style>
        <div id='css-bg-test'></div>`,
        checkAsync: callback => {
            const observer = new PerformanceObserver(observed);

            const checkResource = resource => {
                if (resource.name.includes('cssbg.jpg')) {
                    if (resource.serverTiming.length === 0) {
                        callback('failed');
                    } else {
                        callback('loaded');
                    }
                    observer.disconnect();
                }
            };

            function observed (list) {
                list.getEntries().forEach(checkResource);
            }

            observer.observe({ entryTypes: ['resource', 'navigation'] });
        }
    },
    {
        category: 'js',
        id: 'websocket',
        description: 'Try connecting to a WebSocket.',
        checkAsync: (callback) => {
            const websocketUrl = `wss://${TRACKER_DOMAIN}/block-me/web-socket`;
            const socket = new WebSocket(websocketUrl);
            socket.addEventListener('message', event => {
                callback('loaded');
            });
            socket.addEventListener('close', event => {
                if (event.code !== 1005) {
                    callback('failed');
                }
            });
        }
    },
    {
        category: 'js',
        id: 'server-sent-events',
        description: 'Try connecting to an EventSource.',
        checkAsync: (callback) => {
            const sseUrl = `https://${TRACKER_DOMAIN}/block-me/server-sent-events`;
            const eventSource = new EventSource(sseUrl);
            eventSource.addEventListener('message', event => {
                callback('loaded');
                eventSource.close();
            });
            eventSource.addEventListener('error', e => {
                callback('failed');
                eventSource.close();
            });
        }
    },
    {
        category: 'js',
        id: 'fetch',
        description: 'Try requesting data using <code>fetch(…)</code>.',
        checkAsync: (callback) => {
            fetch(`${TRACKER_RESOURCES_URL}/fetch.json?${random}`)
                .then(r => r.json())
                .then(data => {
                    if (data.data.includes('fetch loaded')) {
                        callback('loaded');
                    }
                })
                .catch(e => {
                    callback('failed');
                });
        }
    },
    {
        category: 'js',
        id: 'xmlhttprequest',
        description: 'Try requesting data using <code>XMLHttpRequest</code>.',
        checkAsync: (callback) => {
            const ajax = new XMLHttpRequest();
            ajax.onreadystatechange = () => {
                if (ajax.readyState === 4 && ajax.status === 200) {
                    const data = JSON.parse(ajax.responseText);

                    if (data.data.includes('ajax loaded')) {
                        callback('loaded');
                    }
                }
            };
            ajax.onerror = () => {
                callback('failed');
            };
            ajax.open('GET', `${TRACKER_RESOURCES_URL}/ajax.json?${random}`, true);
            ajax.send();
        }
    },
    {
        category: 'js',
        id: 'sendBeacon',
        description: 'Try sending data using <code>sendBeacon</code>.',
        checkAsync: (callback) => {
            const observer = new PerformanceObserver(observed);

            const checkResource = resource => {
                if (resource.name.includes(`beacon?${random}`)) {
                    if (resource.serverTiming.length === 0) {
                        callback('failed');
                    } else {
                        callback('loaded');
                    }
                    observer.disconnect();
                }
            };

            function observed (list) {
                list.getEntries().forEach(checkResource);
            }

            observer.observe({ entryTypes: ['resource'] });

            navigator.sendBeacon(`https://${TRACKER_DOMAIN}/block-me/beacon?${random}`, 'fake=data');
        }
    },
    {
        category: 'other',
        id: 'favicon',
        description: 'Try loading an image using <code>&lt;link rel="shortcut icon" …</code>.',
        checkAsync: (callback) => {
            const observer = new PerformanceObserver(observed);

            const checkResource = resource => {
                if (resource.name.includes('favicon.ico?')) {
                    if (resource.serverTiming.length === 0) {
                        callback('failed');
                    } else {
                        callback('loaded');
                    }
                    observer.disconnect();
                }
            };

            function observed (list) {
                list.getEntries().forEach(checkResource);
            }

            observer.observe({ entryTypes: ['resource', 'navigation'] });

            document.head.innerHTML += `<link rel="shortcut icon" type="image/icon" href="${TRACKER_RESOURCES_URL}/favicon.ico?${random}" />`;
        }
    },
    {
        category: 'other',
        id: 'iframe-fetch',
        description: 'Try requesting data from within a first-party iframe.',
        html: `<iframe src='./frame.html?${random}' style='width:100px' id='html-iframe-fetch-test'></iframe>`,
        checkAsync: (callback) => {
            const item = document.querySelector('#html-iframe-fetch-test');

            if (item) {
                item.addEventListener('load', () => {
                    item.contentWindow.postMessage({ action: 'fetch', url: `${TRACKER_RESOURCES_URL}/fetch.json?iframe-${Math.random()}` });
                });

                const onMessage = msg => {
                    if (msg.data.includes('frame fetch loaded')) {
                        callback('loaded');
                        window.removeEventListener('message', onMessage);
                    } else if (msg.data.includes('frame fetch failed')) {
                        callback('failed');
                        window.removeEventListener('message', onMessage);
                    }
                };

                window.addEventListener('message', onMessage);
            }
        }
    },
    {
        category: 'other',
        id: 'iframe-fetch-depth-2',
        description: 'Try requesting data from two frames deep (iframe within an iframe).',
        html: `<iframe src='./middleframe.html?${random}' style='width:100px' id='html-iframe-depth-2-fetch-test'></iframe>`,
        checkAsync: (callback) => {
            const item = document.querySelector('#html-iframe-depth-2-fetch-test');

            if (item) {
                item.addEventListener('load', () => {
                    item.contentWindow.postMessage({ action: 'fetch', url: `${TRACKER_RESOURCES_URL}/fetch.json?iframe-depth-2-${Math.random()}` });
                });

                const onMessage = msg => {
                    if (msg.data.includes('frame fetch loaded')) {
                        callback('loaded');
                        window.removeEventListener('message', onMessage);
                    } else if (msg.data.includes('frame fetch failed')) {
                        callback('failed');
                        window.removeEventListener('message', onMessage);
                    }
                };

                window.addEventListener('message', onMessage);
            }
        }
    },
    {
        category: 'other',
        id: 'webworker-fetch',
        description: 'Try fetching data from within a WebWorker.',
        checkAsync: (callback) => {
            const worker = new Worker('./worker.js');

            worker.postMessage({ action: 'fetch', url: `${TRACKER_RESOURCES_URL}/fetch.json?webworker-${Math.random()}` });

            worker.addEventListener('message', msg => {
                if (msg.data.includes('worker fetch loaded')) {
                    callback('loaded');
                    worker.terminate();
                } else if (msg.data.includes('worker fetch failed')) {
                    callback('failed');
                    worker.terminate();
                }
            });
        }
    },
    {
        category: 'other',
        id: 'serviceworker-fetch',
        description: 'Try fetching data from within a ServiceWorker.',
        checkAsync: (callback) => {
            const onMessage = msg => {
                if (msg.data.includes('service worker fetch loaded')) {
                    callback('loaded');
                    navigator.serviceWorker.removeEventListener('message', onMessage);
                } else if (msg.data.includes('service worker fetch failed')) {
                    callback('failed');
                    navigator.serviceWorker.removeEventListener('message', onMessage);
                }
            };

            navigator.serviceWorker.addEventListener('message', onMessage);
            navigator.serviceWorker.register('./service-worker.js', { scope: './' })
                .then(registration => {
                    if (registration.active) {
                        registration.active.addEventListener('message', () => {
                            console.log('client received message');
                        });
                        registration.active.postMessage({ action: 'fetch', url: `${TRACKER_RESOURCES_URL}/fetch.json?serviceworker-${Math.random()}` });
                    } else if (registration.installing) {
                        registration.installing.addEventListener('statechange', () => {
                            if (registration.active) {
                                registration.active.addEventListener('message', () => {
                                    console.log('client received message');
                                });
                                registration.active.postMessage({ action: 'fetch', url: `${TRACKER_RESOURCES_URL}/fetch.json?serviceworker-${Math.random()}` });
                            }
                        });
                    }
                })
                .catch((error) => {
                    console.log('Registration failed with ' + error);
                });
        }
    },
    {
        category: 'other',
        id: 'csp-report',
        description: 'Try sending data via CSP report.',
        html: '<img src=\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\'/>', // causes CSP violation which triggers a report
        checkAsync: (callback) => {
            const observer = new PerformanceObserver(observed);

            const checkResource = resource => {
                if (resource.name.includes('/csp')) {
                    if (resource.serverTiming.length === 0) {
                        callback('failed');
                    } else {
                        callback('loaded');
                    }
                    observer.disconnect();
                }
            };

            function observed (list) {
                list.getEntries().forEach(checkResource);
            }

            observer.observe({ entryTypes: ['resource', 'navigation'] });
        }
    },
    {
        category: 'other',
        id: 'redirected-fetch',
        description: 'Try requesting tracker via redirect through a safe domain.',
        checkAsync: (callback) => {
            const url = new URL('/redirect', location.href);
            url.searchParams.append('destination', `${TRACKER_RESOURCES_URL}/fetch.json?redirected-${random}`);

            fetch(url)
                .then(r => r.json())
                .then(data => {
                    if (data.data.includes('fetch loaded')) {
                        callback('loaded');
                    }
                })
                .catch(e => {
                    callback('failed');
                });
        }
    }
];

/**
 * Test runner
 */
function runTests () {
    startButton.setAttribute('disabled', 'disabled');
    downloadButton.removeAttribute('disabled');
    results.results.length = 0;
    results.date = (new Date()).toUTCString();

    tests.forEach(test => {
        const resultObj = {
            id: test.id,
            category: test.category,
            status: 'not loaded'
        };
        results.results.push(resultObj);

        const categoryUl = document.querySelector(`.category-${test.category} ul`);

        const li = document.createElement('li');
        li.id = `test-${test.category}-${test.id}`;
        li.innerHTML = `<div class='status' title='not loaded'></div> - ${test.id} - <span class='description'>${test.description || ''}</span>`;
        const status = li.querySelector('.status');

        if (test.html) {
            if (typeof test.html === 'string') {
                const template = document.createElement('template');
                template.innerHTML = `<hr/>${test.category} - ${test.id} ${test.html}`;
                debugDiv.appendChild(template.content);
            } else if (typeof test.html === 'function') {
                debugDiv.appendChild(test.html());
            } else {
                throw new Error('Unexpected value of the `html` property on a test.');
            }
        }

        categoryUl.appendChild(li);

        if (test.check) {
            const interval = setInterval(() => {
                const testResult = test.check();

                if (testResult === 'loaded' || testResult === 'failed') {
                    status.classList.add(testResult);
                    status.setAttribute('title', testResult);
                    clearInterval(interval);

                    resultObj.status = testResult;
                }
            }, 300);
        }

        if (test.checkAsync) {
            test.checkAsync(testResult => {
                if (testResult === 'loaded' || testResult === 'failed') {
                    status.classList.add(testResult);
                    status.setAttribute('title', testResult);
                    resultObj.status = testResult;
                }
            });
        }
    });
}

function downloadTheResults () {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.href = url;
    a.download = 'request-blocking-results.json';

    debugDiv.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
startButton.addEventListener('click', () => runTests());

// if url query is '?run' start tests imadiatelly
if (document.location.search === '?run') {
    runTests();
}
