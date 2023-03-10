console.log(self.location.href, navigator.userAgent);
self.postMessage({ workerUrl: self.location.href });
