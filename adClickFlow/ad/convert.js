console.log('Ad conversion');

const pixelUrl = new URL('./ping.gif', document.currentScript.src);

function fireConvertPingStatus (status) {
    window.dispatchEvent(new CustomEvent('resourceLoad', {
        detail: {
            url: pixelUrl.href,
            status: status
        }
    }));
}

const img = document.createElement('img');
img.src = pixelUrl;
img.style.display = 'none';
img.onload = () => {
    console.log('Ad conversion complete');
    fireConvertPingStatus('loaded');
};
img.onerror = () => {
    fireConvertPingStatus('blocked');
};
document.body.appendChild(img);
