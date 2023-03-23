{
    const descriptor = Object.getOwnPropertyDescriptor(
        Document.prototype,
        'createComment'
    );
    const origImpl = descriptor.value;
    const src = document.currentScript.src;
    descriptor.value = function () {
        console.log(src, navigator.userAgent);
        window.addResult('Navigator.prototype.userAgent', 'createComment prototype overload by 3rd-party', location.href, src);
        return origImpl.apply(this, arguments);
    };

    Object.defineProperty(
        Document.prototype,
        'createComment',
        descriptor
    );

    document.createComment('foo');
}
