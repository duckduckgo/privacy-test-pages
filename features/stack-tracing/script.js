/* globals log */

(() => {
    const base = new URL(document.currentScript.src)
    const party = base.origin === window.top.location.origin ? 'first' : 'third'
    const scriptName = `${party} party script`

    log(scriptName, new Error().stack)

    const worker = new Worker('./worker.js')
    worker.addEventListener('message', msg => {
        const { source, stackValue } = msg.data
        log(`${scriptName} loading ${source}`, stackValue)
    })
    worker.postMessage({ action: 'setup' })

    setTimeout(() => {
        log(`${scriptName} setTimeout`, new Error().stack)
    }, 0)

    document.write(`<script>log('${scriptName} write', new Error().stack);</script>`)
})()
