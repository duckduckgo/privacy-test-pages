{
    const el = document.createElement('script');
    el.textContent = `
    console.log("${document.currentScript.src}", navigator.userAgent);
    window.addResult('Navigator.prototype.userAgent', 'inline script via document.createElement()', location.href, '${document.currentScript.src}');
    `;
    document.body.appendChild(el);
}
