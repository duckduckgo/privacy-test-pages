{
    const f = document.createElement('iframe');
    f.src = 'iframe-sandbox.html';
    f.sandbox = 'allow-scripts';
    document.body.appendChild(f);
    window.addResult('Navigator.prototype.userAgent', 'inline script inside sandboxed iframe', document.currentScript.src);
}
