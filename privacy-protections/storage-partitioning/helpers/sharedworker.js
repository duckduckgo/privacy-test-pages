// From: https://github.com/arthuredelstein/privacytests.org/blob/master/testing/out/tests/supercookies_sharedworker.js
let data;

// eslint-disable-next-line no-undef
onconnect = function (e) {
    const port = e.ports[0];

    port.onmessage = function (e) {
        if (e.data === 'request') {
            console.log('request shared worker');
            port.postMessage(data);
        } else {
            console.log('setting shared worker');
            data = e.data;
        }
    };
};
