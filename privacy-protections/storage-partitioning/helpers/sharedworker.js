/*
 * Portions of the code derived from privacytests.org source code (https://github.com/arthuredelstein/privacytests.org)
 * Copyright 2018 Arthur Edelstein
 * MIT License (https://mit-license.org/)
 */
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
