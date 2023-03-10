{
    const f = document.createElement('iframe');
    f.src = `${window.THIRD_PARTY_ORIGIN}/crawler/attribution/iframe-simple.html`;
    function receiveMessage (event) {
        if (event.data.type === 'messageFromSimpleIframe') {
            window.addResult('Navigator.prototype.userAgent', 'inline script inside iframe', event.data.url, event.data.url);
            window.removeEventListener('message', receiveMessage);
        }
    }
    window.addEventListener('message', receiveMessage);
    document.body.appendChild(f);
}
