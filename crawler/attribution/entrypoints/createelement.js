{
    const el = document.createElement('script');
    el.textContent = `console.log("${document.currentScript.src}", navigator.userAgent)`;
    document.body.appendChild(el);
    window.addResult('Navigator.prototype.userAgent', 'inline script via document.createElement()', document.currentScript.src);
}
