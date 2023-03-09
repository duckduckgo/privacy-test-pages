{
    const b = new Blob([`
    <script>console.log("${document.currentScript.src}", navigator.userAgent);
    parent.addResult('Navigator.prototype.userAgent', 'iframe with a blob url', location.href, '${document.currentScript.src}');
    </script>
    `], { type: 'text/html' });
    const u = URL.createObjectURL(b);
    const f = document.createElement('iframe');
    f.src = u;
    document.body.appendChild(f);
}
