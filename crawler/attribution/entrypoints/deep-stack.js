{
    const src = `${document.currentScript.src}`;
    let depth = 0;
    function deepCall () {
        if (depth++ < 1000) {
            deepCall();
        } else {
            console.log(src, navigator.userAgent);
            window.addResult('Navigator.prototype.userAgent', 'deep call stack', src);
        }
    }
    deepCall();
}
