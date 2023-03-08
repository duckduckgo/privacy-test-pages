{
    const src = `${document.currentScript.src}`;
    new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 500);
    }).then(() => {
        console.log(src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'delayed script (Promise)', src);
    });
}
