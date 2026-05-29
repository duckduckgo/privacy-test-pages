const express = require('express');
const fs = require('fs');
const { ALL_CH } = require('../../../features/client-hints/all-ch');

const router = express.Router();
const ALL_CH_STR = ALL_CH.join(',');

function setClientHintHeaders (res) {
    res.set('Accept-CH', ALL_CH_STR);
    res.set('Critical-CH', ALL_CH_STR);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Timing-Allow-Origin', '*');
}

function sendFile (res, path) {
    fs.readFile(path, { encoding: 'utf-8' }, (err, contents) => {
        if (err) {
            res.statusCode = 500;
            return res.end('error');
        }

        res.end(contents);
    });
}

router.get('/', (req, res) => {
    setClientHintHeaders(res);
    sendFile(res, './windows-browser/client-hints/main.html');
});

router.get('/frame.html', (req, res) => {
    setClientHintHeaders(res);
    sendFile(res, './windows-browser/client-hints/frame.html');
});

router.get('/echo-headers', (req, res) => {
    setClientHintHeaders(res);

    return res.json({
        host: req.hostname,
        url: req.originalUrl,
        headers: req.headers
    });
});

module.exports = router;
