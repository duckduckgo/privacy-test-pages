console.log('Tracking');

const trackingImgUrl = new URL('./ping.gif', document.currentScript.src);

function fireTrackingPingStatus (status) {
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
    fireTrackingPingStatus('loaded');
};
trackingImg.onerror = () => {
    fireTrackingPingStatus('blocked');
};
document.body.appendChild(trackingImg);
