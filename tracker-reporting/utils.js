// Delays a function in ms based on a URL param delay=x
// eslint-disable-next-line no-unused-vars
function callAfterDelay (callback) {
    const params = new URL(location.href).searchParams;
    const delay = parseInt(params.get('delay'), 10) || 0;
    if (delay) {
        setTimeout(callback, delay);
    } else {
        callback();
    }
}
