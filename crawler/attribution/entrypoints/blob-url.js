{
    const b = new Blob([`console.log("${document.currentScript.src}", navigator.userAgent); window.addResult('Navigator.prototype.userAgent', 'script in a blob url', '${document.currentScript.src}');`], { type: 'text/javascript' });
    const u = URL.createObjectURL(b);
    const s = document.createElement('script');
    s.src = u;
    document.body.appendChild(s);
}
