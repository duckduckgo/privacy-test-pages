document.write(`
<script>
console.log("${document.currentScript.src}", navigator.userAgent);
window.addResult('Navigator.prototype.userAgent', 'inline script via document.write()', location.href, '${document.currentScript.src}');
</script>
`);
