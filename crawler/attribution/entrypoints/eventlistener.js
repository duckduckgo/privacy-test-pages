{
    const img = document.createElement('img');
    img.src = '/';
    const src = `${document.currentScript.src}`;
    img.addEventListener('error', () => {
        console.log(src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'event listener', location.href, src);
    });
}
