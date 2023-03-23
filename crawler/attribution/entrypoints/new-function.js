{
    // eslint-disable-next-line no-new-func
    const f = new Function(`
        console.log("${document.currentScript.src}", navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'call inside a Function constructor', location.href, '${document.currentScript.src}');
    `);
    f();
}
