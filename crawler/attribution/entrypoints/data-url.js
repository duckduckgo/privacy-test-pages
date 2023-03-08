{
    const u = `data:application/javascript,console.log("${document.currentScript.src}", navigator.userAgent)`;
    const s = document.createElement('script');
    s.src = u;
    document.body.appendChild(s);
    window.addResult('Navigator.prototype.userAgent', 'script in a data: url', document.currentScript.src);
}
