{
    const src = `${document.currentScript.src}`;
    setTimeout(() => {
        console.log(src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'delayed script (setTimeout)', src);
    }, 500);
}
