console.log(self.location.href, navigator.userAgent);
self.postMessage({ dave: self.location.href });
