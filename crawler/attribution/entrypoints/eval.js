function doEval () {
    // eslint-disable-next-line no-eval
    eval(`console.log("${document.currentScript.src}", navigator.userAgent)`);
}
doEval();
window.addResult('Navigator.prototype.userAgent', 'call inside eval', document.currentScript.src);
