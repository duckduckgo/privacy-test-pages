const urlObj = new URL(location.href);

const urlToId = {
    // HTML
    'https://cdn.krxd.net/script.js': 'html-script',
    'https://cdn.krxd.net/style.css': 'html-style',
    'https://cdn.krxd.net/img.jpg': 'html-img',
    'https://cdn.krxd.net/picture.jpg': 'html-picture',
    'https://cdn.krxd.net/object.png': 'html-object',
    'https://cdn.krxd.net/audio.mp3': 'html-audio',
    'https://cdn.krxd.net/video.avi': 'html-video',
    'https://cdn.krxd.net/frame.html': 'html-iframe',

    // CSS
    'https://cdn.krxd.net/cssImport.css': 'css-import',
    'https://cdn.krxd.net/cssBackground.jpg': 'css-background',
    'https://cdn.krxd.net/cssFont.woff': 'css-font',

    // JS
    'https://cdn.krxd.net/fetch.json': 'js-fetch',
    'https://cdn.krxd.net/ajax.json': 'js-ajax',

    // OTHER
    'https://cdn.krxd.net/csp.report': 'other-csp',
    'https://cdn.krxd.net/favicon.ico': 'other-favicon',
};

function updateUrl(url, status) {
    updateElement(urlToId[url], status);
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
    if (!urlToId[resource.name]) {
        return;
    }

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

fetch('https://cdn.krxd.net/fetch.json', {mode: 'no-cors'});

const ajax = new XMLHttpRequest();
ajax.open('GET', 'https://cdn.krxd.net/ajax.json', true);
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

const sseUrl = `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}/block-me/server-sent-events`;
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