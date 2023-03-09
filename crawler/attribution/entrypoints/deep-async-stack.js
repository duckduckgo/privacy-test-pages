async function deepCallAsync () {
    if (deepCallAsync.depth++ < 1000) {
        await deepCallAsync();
    } else {
        console.log(deepCallAsync.src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'deep async call stack', deepCallAsync.src);
    }
}
// storing data on the function object to make it work in Webkit
deepCallAsync.depth = 0;
deepCallAsync.src = `${document.currentScript.src}`;
deepCallAsync();
