{
    const s = document.createElement('iframe');
    document.body.appendChild(s);
    s.contentDocument.write(`<script>console.log("${document.currentScript.src}", navigator.userAgent); parent.addResult('Navigator.prototype.userAgent', 'contentDocument.write() into iframe', '${document.currentScript.src}');</script>`);
}
