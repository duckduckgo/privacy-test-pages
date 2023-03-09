{
    const descriptor = Object.getOwnPropertyDescriptor(
        Document.prototype,
        'createElement'
    );
    const origImpl = descriptor.value;
    const src = document.currentScript.src;
    descriptor.value = function () {
        console.log(src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'createElement prototype overload', location.href, src);
        return origImpl.apply(this, arguments);
    };

    Object.defineProperty(
        Document.prototype,
        'createElement',
        descriptor
    );

    document.createElement('div');
}
