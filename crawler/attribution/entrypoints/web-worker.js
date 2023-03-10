// this is an entry point to set up a web worker. The actual API call is in worker-source.js
const worker = new Worker('worker-source.js');
worker.addEventListener('message', function (event) {
    window.addResult('Navigator.prototype.userAgent', 'web worker', event.data.workerUrl, event.data.workerUrl);
});
