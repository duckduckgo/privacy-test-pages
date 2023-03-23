{
    const u = `data:application/javascript,console.log("${document.currentScript.src}", navigator.userAgent);window.addResult('Navigator.prototype.userAgent', 'script in a data: url', location.href, '${document.currentScript.src}')`;
    const s = document.createElement('script');
    s.src = u;
    document.body.appendChild(s);
}
