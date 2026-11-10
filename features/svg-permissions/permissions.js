// Shared by permissions.svg and arbitrary-xml.svg. Each button requests one permission
// and writes the outcome into #result, numbered so repeated requests are told apart.
let requestCount = 0;

function show (text) {
    document.getElementById('result').textContent = text;
}

async function requestMedia (name, constraints) {
    const request = ++requestCount;
    show(`${name} pending (#${request})`);
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        show(`${name} granted (#${request}): video=${stream.getVideoTracks().length} audio=${stream.getAudioTracks().length}`);
        stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
        show(`${name} failed (#${request}): ${error.name}`);
    }
}

function requestLocation () {
    const request = ++requestCount;
    show(`location pending (#${request})`);
    navigator.geolocation.getCurrentPosition(
        (position) => show(`location granted (#${request}): ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`),
        (error) => show(`location failed (#${request}): code=${error.code} ${error.message}`),
        { maximumAge: 0 }
    );
}

document.getElementById('document-info').textContent =
    `${document.contentType}, root <${document.documentElement.localName}>, ${location.origin}`;
document.getElementById('location').addEventListener('click', requestLocation);
document.getElementById('camera').addEventListener('click', () => requestMedia('camera', { video: true }));
document.getElementById('microphone').addEventListener('click', () => requestMedia('microphone', { audio: true }));
document.getElementById('camera-microphone').addEventListener('click', () => requestMedia('camera and microphone', { video: true, audio: true }));
