console.log('Ad conversion');

const pixelUrl = new URL('./ping.gif', document.currentScript.src);

function fireResource (status) {
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
    fireResource('loaded');
};
img.onerror = () => {
    fireResource('blocked');
};
document.body.appendChild(img);
