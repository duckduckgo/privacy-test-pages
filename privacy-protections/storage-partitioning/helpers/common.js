/* exported THIRD_PARTY_HOSTNAME THIRD_PARTY_HTTP THIRD_PARTY_HTTPS FIRST_PARTY_HOSTNAME FIRST_PARTY_SITE FIRST_PARTY_HTTP FIRST_PARTY_HTTPS accessStorageInIframe */
const isLocalTest = window.location.hostname.endsWith('.example');

const THIRD_PARTY_HOSTNAME = isLocalTest ? 'third-party.example' : 'good.third-party.site';
const THIRD_PARTY_HTTP = isLocalTest ? `http://${THIRD_PARTY_HOSTNAME}:3000` : `http://${THIRD_PARTY_HOSTNAME}`;
const THIRD_PARTY_HTTPS = `https://${THIRD_PARTY_HOSTNAME}`;

const FIRST_PARTY_HOSTNAME = isLocalTest ? 'first-party.example' : 'www.first-party.site';
const FIRST_PARTY_SITE = isLocalTest ? 'first-party.example' : 'first-party.site'; // eTLD+1
const FIRST_PARTY_HTTP = isLocalTest ? `http://${FIRST_PARTY_HOSTNAME}:3000` : `http://${THIRD_PARTY_HOSTNAME}`;
const FIRST_PARTY_HTTPS = `https://${FIRST_PARTY_HOSTNAME}`;

// Inject an iframe to retrieve values from test APIs
function accessStorageInIframe (frameOrigin, sessionId, mode, apiTypes = [], frameId) {
    return new Promise((resolve, reject) => {
        // Prepare arguments to pass to iframe
        const iframeURL = new URL('/privacy-protections/storage-partitioning/iframe.html', frameOrigin);
        if (!['store', 'retrieve'].includes(mode)) {
            reject(new Error(`Unrecognized mode ${mode} passed to function.`));
        }
        iframeURL.searchParams.set('mode', mode);
        iframeURL.searchParams.set('sessionId', sessionId);
        if (apiTypes.length !== 0) {
            iframeURL.searchParams.set('apiTypes', JSON.stringify(apiTypes));
        }

        const iframe = document.createElement('iframe');
        iframe.src = iframeURL.href;
        iframe.height = 1;
        iframe.width = 1;
        if (frameId) {
            iframe.id = frameId;
        }
        document.body.appendChild(iframe);

        window.addEventListener('message', event => {
            if (event.origin !== frameOrigin) {
                console.error(`Message from unexpected origin ${event.origin}`);
            }
            resolve(event.data);
        }, { capture: false, once: true });
    });
}
