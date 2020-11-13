const urlObj = new URL(location.href);
const locationPrefix = `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`;
const random = Math.random();

const playground = document.querySelector('#playground');

const tests = [
    {
        category: 'html',
        id: 'script',
        html: () => {
            // for some reason returning a string here does not work, I have to construct nodes in JS
            const script = document.createElement('script');
            script.src = `./block-me/script.js?${random}`;

            return script;
        }
    },
    {
        category: 'html',
        id: 'style',
        html: `<link href='./block-me/style.css?${random}' rel='stylesheet'></link>
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
        html: `<img src='./block-me/img.jpg?${random}' id='html-img-test'/>`,
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
        html: `<picture id='html-picture-test' style='display: inline-block'>
        <source srcset="./block-me/picture.jpg?${random}">
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
        html: `<object type="image/png" data="./block-me/object.png?${random}" id='html-object-test'></object>`,
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
        html: `<audio src='./block-me/audio.wav?${random}' id='html-audio-test'></audio>`,
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
        html: `<video src='./block-me/video.mp4?${random}' id='html-video-test' style='max-width: 100px'></video>`,
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
        html: `<iframe src='./block-me/frame.html?${random}' style='width:100px' id='html-iframe-test'></iframe>`,
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
        html: `<style>@import url(./block-me/cssImport.css?${random});</style>
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
        html: `<style>@font-face {
            font-family: fakeFont;
            src: url(./block-me/cssfont.woff?${random});
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
        html: `<style>
        #css-bg-test {
            background: url(./block-me/cssbg.jpg?${random});
            width: 100px;
            height: 100px;
        }</style>
        <div id='css-bg-test'></div>`,
        checkAsync: callback => {
            const observer = new PerformanceObserver(observed); 

            const checkResource = resource => {
                if (resource.name.includes('cssbg.jpg')) {
                    if (resource.duration === 0 && resource.nextHopProtocol === '') {
                        callback('failed');
                    } else {
                        callback('loaded');
                    }
                    observer.disconnect();
                }
            };

            function observed(list) { 
                list.getEntries().forEach(checkResource);
            } 

            observer.observe({entryTypes: ["resource", "navigation"]});
        }
    },

    {
        category: 'js',
        id: 'websocket',
        checkAsync: (callback) => {
            const wsProtocol = urlObj.protocol == "https:" ? "wss" : "ws";
            const websocketUrl = `${wsProtocol}://${urlObj.hostname}:${urlObj.port}/block-me/web-socket`;
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
        checkAsync: (callback) => {
            const sseUrl = `${locationPrefix}/block-me/server-sent-events`;
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
        checkAsync: (callback) => {
            fetch(`./block-me/fetch.json?${random}`)
                .then(r => r.json())
                .then(data => {
                    if (data.data.includes('fetch loaded')) {
                        callback('loaded');
                    }
                })
                .catch(e => {
                    callback('failed');
                })
        }
    },
    {
        category: 'js',
        id: 'xmlhttprequest',
        checkAsync: (callback) => {
            const ajax = new XMLHttpRequest();
            ajax.onreadystatechange = () => {
                if (ajax.readyState == 4 && ajax.status == 200) {
                   const data = JSON.parse(ajax.responseText);

                   if (data.data.includes('ajax loaded')) {
                       callback('loaded');
                   }
                }
            };
            ajax.onerror = () => {
                callback('failed');
            };
            ajax.open('GET', `./block-me/ajax.json?${random}`, true);
            ajax.send();
        }
    },
    {
        category: 'other',
        id: 'favicon',
        checkAsync: (callback) => {
            const observer = new PerformanceObserver(observed); 

            const checkResource = resource => {
                if (resource.name.includes('favicon.ico')) {
                    if (resource.duration === 0 && resource.nextHopProtocol === '') {
                        callback('failed');
                    } else {
                        callback('loaded');
                    }
                    observer.disconnect();
                }
            };

            function observed(list) { 
                list.getEntries().forEach(checkResource);
            } 

            observer.observe({entryTypes: ["resource", "navigation"]});

            document.head.innerHTML += `<link rel="shortcut icon" type="image/icon" href="./block-me/favicon.ico?${random}" />`;
        }
    }
];

tests.forEach(test => {
    const categoryUl = document.querySelector(`.category-${test.category} ul`);

    const li = document.createElement('li');
    li.id = `test-${test.category}-${test.id}`;
    li.innerHTML = `<div class='status'></div> - ${test.id}`;
    const status = li.querySelector('.status');

    if (test.html) {
        if (typeof test.html === 'string') {
            const template = document.createElement('template');
            template.innerHTML = `<hr/>${test.category} - ${test.id} ${test.html}`;
            playground.appendChild(template.content);
        } else if (typeof test.html === 'function') {
            playground.appendChild(test.html());
        }
    }

    categoryUl.appendChild(li);

    if (test.check) {
        const interval = setInterval(() => {
            const result = test.check();
            
            if (result === 'loaded' || result === 'failed') {
                status.classList.add(result);
                clearInterval(interval);
            }
        }, 300);
    }

    if (test.checkAsync) {
        test.checkAsync(result => {
            if (result === 'loaded' || result === 'failed') {
                status.classList.add(result);
            }
        });
    }
});
