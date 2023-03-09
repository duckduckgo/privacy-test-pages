{
    const src = `${document.currentScript.src}`;
    setTimeout(() => {
        console.log(src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'delayed script (setTimeout)', location.href, src);
    }, 500);
}
