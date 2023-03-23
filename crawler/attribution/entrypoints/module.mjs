const src = import.meta.url;
console.log(src, navigator.userAgent);
window.addResult('Navigator.prototype.userAgent', 'module script', location.href, src);
