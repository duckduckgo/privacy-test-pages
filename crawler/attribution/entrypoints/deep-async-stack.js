{
    const src = `${document.currentScript.src}`;
    let depth = 0;
    async function deepCall () {
        if (depth++ < 1000) {
            await deepCall();
        } else {
            console.log(src, navigator.userAgent);
            window.addResult('Navigator.prototype.userAgent', 'deep async call stack', src);
        }
    }
    deepCall();
}
