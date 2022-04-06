// From: https://github.com/arthuredelstein/privacytests.org/blob/master/testing/out/tests/supercookies_sharedworker.js
let data;

// eslint-disable-next-line no-undef
onconnect = function (e) {
    const port = e.ports[0];

    port.onmessage = function (e) {
        if (e.data === 'request') {
            port.postMessage(data);
        } else {
            data = e.data;
        }
    };
};
