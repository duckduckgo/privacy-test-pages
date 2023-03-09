const worker = new Worker('worker-source.js');
worker.addEventListener('message', function (event) {
    window.addResult('Navigator.prototype.userAgent', 'web worker', event.data.workerUrl, event.data.workerUrl);
});
