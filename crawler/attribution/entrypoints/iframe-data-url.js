{
    const u = `data:text/html,<script>console.log("${document.currentScript.src}", navigator.userAgent);</script>`;
    const s = document.createElement('iframe');
    s.src = u;
    document.body.appendChild(s);
    window.addResult('Navigator.prototype.userAgent', 'iframe with a data: url', document.currentScript.src);
}
