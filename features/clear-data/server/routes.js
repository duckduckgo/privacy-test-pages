const express = require('express');
const router = express.Router();

router.get('/clear', (req, res) => {
    res.set('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');

    // has to be a 200, clearing doesn't work for direct 307 redrirects
    return res.end(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <title>Redirecting</title>
        <meta http-equiv="refresh" content="0; url=/features/clear-data/" />
    </head>
    <body>
        Redirecting back…
    </body>
    </html>`);
});

module.exports = router;
