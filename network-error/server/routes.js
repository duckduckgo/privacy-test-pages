const express = require('express');
const router = express.Router();

// Simulate HTTP errors
router.get('/http_status/', (req, res) => {
    const code = parseInt(req.query.code);

    if (code === 401) {
        // This sets a WebView error on Windows
        res.set('WWW-Authenticate', 'Basic realm="Restricted Area"');
    }

    if (isNaN(code) || code < 100 || code > 599) {
        res.statusCode = 200;
        res.send('Invalid HTTP error code provided. Status not set.');
    } else {
        res.statusCode = code;
        res.send(`HTTP error code set to '${code}'`);
    }
    res.end();
});

// Simulate connection drop
router.get('/drop', (_, res) => {
    res.destroy();
});

module.exports = router;
