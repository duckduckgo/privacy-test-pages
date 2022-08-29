console.log('Tracking');

const trackingImgUrl = new URL('./ping.gif', document.currentScript.src);
function fireResource (status) {
    window.dispatchEvent(new CustomEvent('resourceLoad', {
        detail: {
            url: trackingImgUrl.href,
            status
        }
    }));
}

const trackingImg = document.createElement('img');
trackingImg.src = trackingImgUrl;
trackingImg.style.display = 'none';
trackingImg.onload = () => {
    fireResource('loaded');
};
trackingImg.onerror = () => {
    fireResource('blocked');
};
document.body.appendChild(trackingImg);
