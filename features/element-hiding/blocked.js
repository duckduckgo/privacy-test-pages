
function init () {
    // add iframes
    const iframe = document.createElement('iframe')
    iframe.src = `./frame.html`

    
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', (event) => {
        init()
    })
} else {
    init()
}
