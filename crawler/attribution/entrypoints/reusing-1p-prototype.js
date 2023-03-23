{
    const src = document.currentScript.src;
    window.addResult('Navigator.prototype.userAgent', '3p reusing createElement prototype overloaded by 1p', location.href, src);
    document.createElement('div');
}
