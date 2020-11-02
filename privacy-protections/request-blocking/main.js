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
    'wss://cdn.krxd.net/ws': 'js-ws',

    // OTHER
    'https://cdn.krxd.net/csp.report': 'other-csp',
    'https://cdn.krxd.net/favicon.ico': 'other-favicon',
    'https://cdn.krxd.net/sse': 'js-sse',
};

function updateElement(url, status) {
    console.log(url, 'changed status to', status);

    const testElem = document.getElementById(urlToId[url]);

    if (!testElem) {
        console.error('Element not found with id', urlToId[url]);
        return;
    }

    const statusElem = testElem.querySelector('.status');
    statusElem.innerText = ' ' + (status === 'blocked' ? '🟥 blocked' : '🟩 loaded');
}

function checkResource(resource) {
    if (!urlToId[resource.name]) {
        return;
    }

    //updateElement(resource.name, (resource.duration === 0 && resource.nextHopProtocol === '') ? 'blocked' : 'loaded');
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

const socket = new WebSocket('wss://cdn.krxd.net/ws');
socket.addEventListener('close', event => console.log('ws close', event.code, event));

const eventSource = new EventSource("https://cdn.krxd.net/sse");

navigator.serviceWorker.register('./service-worker.js');

navigator.serviceWorker.addEventListener('message', event => {
    console.log('Service worker msg', event.data.msg, event.data.url, event.data.error);

    updateElement(event.data.url, event.data.msg);
});