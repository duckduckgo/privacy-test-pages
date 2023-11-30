function viewportHandler (event) {
    const r = {
        'window.innerWidth': window.innerWidth,
        'document.documentElement.clientWidth': document.documentElement.clientWidth,
        'screen.width': screen.width,
        'screen.availWidth': screen.availWidth,
        'screen.height': screen.height,
        'screen.availHeight': screen.availHeight,
        'document.documentElement.offsetWidth': document.documentElement.offsetWidth,
        'visualViewport.width': visualViewport.width,
        'visualViewport.height': visualViewport.height,
        'visualViewport.scale': visualViewport.scale
    };
    document.querySelector('#result').textContent = JSON.stringify(r, null, 4);
}

window.addEventListener('load', () => {
    viewportHandler();
    window.visualViewport.addEventListener('scroll', viewportHandler);
    window.visualViewport.addEventListener('resize', viewportHandler);
});
