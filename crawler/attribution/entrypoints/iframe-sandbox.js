{
    const f = document.createElement('iframe');
    f.src = 'iframe-sandbox.html';
    f.sandbox = 'allow-scripts';
    document.body.appendChild(f);
    function receiveMessage (event) {
        if (event.data.type === 'messageFromSandbox') {
            window.addResult('Navigator.prototype.userAgent', 'inline script inside sandboxed iframe', event.data.url, event.data.url);
            window.removeEventListener('message', receiveMessage);
        }
    }
    window.addEventListener('message', receiveMessage);
}
