function deepCall () {
    if (deepCall.depth++ < 1000) {
        deepCall();
    } else {
        console.log(deepCall.src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'deep call stack', deepCall.src);
    }
}
// storing data on the function object to make it work in Webkit
deepCall.depth = 0;
deepCall.src = `${document.currentScript.src}`;
deepCall();
