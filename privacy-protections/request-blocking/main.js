const urlObj = new URL(location.href);
const locationPrefix = `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`;

const urlToId = [
    // HTML
    {path: '/block-me/script.js', id: 'html-script'},
    {path: '/block-me/style.css', id: 'html-style'},
    {path: '/block-me/img.jpg', id: 'html-img'},
    {path: '/block-me/picture.jpg', id: 'html-picture'},
    {path: '/block-me/object.png', id: 'html-object'},
    {path: '/block-me/audio.wav', id: 'html-audio'},
    {path: '/block-me/video.mp4', id: 'html-video'},
    {path: '/block-me/frame.html', id: 'html-iframe'},

    // CSS
    {path: '/block-me/cssImport.css', id: 'css-import'},
    {path: '/block-me/cssbg.jpg', id: 'css-background'},
    {path: '/block-me/cssfont.woff', id: 'css-font'},

    // JS
    {path: '/block-me/fetch.json', id: 'js-fetch'},
    {path: '/block-me/ajax.json', id: 'js-ajax'},

    // OTHER
    {path: '/block-me/csp.report', id: 'other-csp'},
    {path: '/block-me/favicon.ico', id: 'other-favicon'},
];

function updateUrl(url, status) {
    const urlObj = new URL(url);
    const item = urlToId.find(({path, id}) => urlObj.pathname.endsWith(path));

    if (!item) {
        console.error('Match for url not found', url);
        return;
    }

    updateElement(item.id, status);
}

function updateElement(id, status) {
    console.log(id, 'changed status to', status);

    const testElem = document.getElementById(id);

    if (!testElem) {
        console.error('Element not found with id', id);
        return;
    }

    const statusElem = testElem.querySelector('.status');
    statusElem.innerText = ' ' + (status === 'blocked' ? '🟥 blocked' : '🟩 loaded');
}

function checkResource(resource) {
    updateUrl(resource.name, (resource.duration === 0 && resource.nextHopProtocol === '') ? 'blocked' : 'loaded');
}

performance.getEntries().forEach(checkResource);


function observed(list, observer) { 
    list.getEntries().forEach(checkResource);
} 

const observer = new PerformanceObserver(observed); 
observer.observe({entryTypes: ["resource", "navigation"]});

/**
 * JS calls
 */

fetch('./block-me/fetch.json', {mode: 'no-cors'});

const ajax = new XMLHttpRequest();
ajax.open('GET', './block-me/ajax.json', true);
ajax.send();

const websocketUrl = `ws://${urlObj.hostname}:40510/block-me/web-socket`;
const socket = new WebSocket(websocketUrl);
socket.addEventListener('message', event => {
    console.log('ws message', event.data);
    updateElement('js-ws', 'loaded');
});
socket.addEventListener('close', event => {
    if (event.code !== 1005) {
        updateElement('js-ws', 'blocked');
    }
});

const sseUrl = `${locationPrefix}/block-me/server-sent-events`;
const eventSource = new EventSource(sseUrl);
eventSource.addEventListener('message', event => {
    console.log('sse message', event.data);
    updateElement('js-sse', 'loaded');

    eventSource.close();
});
eventSource.addEventListener('error', e => {
    console.log('see failed', e);
    updateElement('js-sse', 'blocked');
});

// navigator.serviceWorker.register('./service-worker.js');

// navigator.serviceWorker.addEventListener('message', event => {
//     console.log('Service worker msg', event.data.msg, event.data.url, event.data.error);

//     updateUrl(event.data.url, event.data.msg);
// });