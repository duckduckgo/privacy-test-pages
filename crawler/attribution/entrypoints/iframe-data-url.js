{
    const src = document.currentScript.src;
    const u = `data:text/html,<script>console.log("${src}", navigator.userAgent);parent.postMessage({type: 'messageFromDataIframe', url: location.href}, '*')</script>`;
    const s = document.createElement('iframe');
    s.src = u;
    function receiveMessage (event) {
        if (event.data.type === 'messageFromDataIframe') {
            window.addResult('Navigator.prototype.userAgent', 'iframe with a data: url', event.data.url, receiveMessage.currentSrc);
            window.removeEventListener('message', receiveMessage);
        }
    }
    receiveMessage.currentSrc = src;
    window.addEventListener('message', receiveMessage);
    document.body.appendChild(s);
}
