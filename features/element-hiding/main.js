const TEST_DOMAIN = 'good.third-party.site'

function init () {
    // inject iframes
    loadFrames()

    // inject frames and other content after delay
    injectDelayedContent()
}

function injectedDelayedContent () {
    setTimeout(function () {
        // inject iframes
        const delayedFrameContainers = [...document.querySelectorAll('.frame-container-delayed')]
        delayedFrameContainers.forEach((container) => {
            const iframe = createFrame()
            container.appendChild(iframe)
        })
    }, 600)
}
function loadFrames () {
    const iframeContainers = [...document.querySelectorAll('.frame-container')]
    iframeContainers.forEach((container) => {
        console.log("adding frame..")
        const iframe = createFrame()
        container.appendChild(iframe)
    })
}

function createFrame () {
    const iframe = document.createElement('iframe')
    iframe.frameborder = 0
    iframe.scrolling = 'no'
    iframe.width = '400'
    iframe.height = '200'
    iframe.style.setProperty('border', 'none')
    iframe.style.setProperty('overflow', 'hidden')
    iframe.style.setProperty('display', 'block')
    iframe.src = `https://${TEST_DOMAIN}/features/element-hiding/frame.html`
    return iframe
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', (event) => {
        init()
    })
} else {
    init()
}
