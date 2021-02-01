(() => {
  let base = new URL(document.currentScript.src);
  let party = base.origin == window.top.location.origin ? 'first' : 'third';
  let scriptName = `${party} party script`;

  log(scriptName, new Error().stack);

  let worker = new Worker('./worker.js');
  worker.addEventListener('message', msg => {
    let { source, stackValue } = msg.data;
    log(`${scriptName} loading ${source}`, stackValue);
  });
  worker.postMessage({ action: 'setup' });

  setTimeout(() => {
    log(`${scriptName} setTimeout`, new Error().stack);
  }, 0)

  document.write(`<script>log('${scriptName} write', new Error().stack);</script>`);
})();
