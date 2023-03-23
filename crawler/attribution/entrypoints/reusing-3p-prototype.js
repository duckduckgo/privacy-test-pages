{
    const src = document.currentScript.src;
    window.addResult('Navigator.prototype.userAgent', '1p reusing createComment prototype overloaded by 3p', location.href, src);
    document.createComment('bar');
}
