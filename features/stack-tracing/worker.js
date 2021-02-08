function log(source, stackValue) {
  postMessage({ source, stackValue });
}

self.addEventListener('message', msg => {
  if (msg.data.action && msg.data.action === 'setup') {
    setup();
  }
});

function setup() {
  log("worker", new Error().stack)

  setTimeout(() => {
    log("worker setTimeout", new Error().stack)
  }, 0);
}
