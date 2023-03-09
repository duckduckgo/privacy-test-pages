{
    const el = document.querySelector('#container');
    el.innerHTML = `
    <img
        src=/
        onerror="console.log('${document.currentScript.src}', navigator.userAgent);window.addResult('Navigator.prototype.userAgent', 'script in a dom0 event handler', location.href, '${document.currentScript.src}')"
    />`;
}
