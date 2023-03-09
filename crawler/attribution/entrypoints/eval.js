function doEval () {
    // eslint-disable-next-line no-eval
    eval(`console.log("${document.currentScript.src}", navigator.userAgent),window.addResult('Navigator.prototype.userAgent', 'call inside eval', location.href, '${document.currentScript.src}');`);
}
doEval();
