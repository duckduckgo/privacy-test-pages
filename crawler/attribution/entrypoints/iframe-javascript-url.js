{
    const u = `javascript:console.log("${document.currentScript.src}", navigator.userAgent); parent.addResult('Navigator.prototype.userAgent', 'iframe with a javascript: url', location.href);`;
    const s = document.createElement('iframe');
    s.src = u;
    document.body.appendChild(s);
}
