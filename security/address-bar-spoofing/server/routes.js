const express = require('express');
const router = express.Router();

// Returns a 301 redirect to a download link of our browser
// for use in the download path test
router.get('/download-redirect', (req, res) => {
    res.redirect(301, 'https://staticcdn.duckduckgo.com/macos-desktop-browser/duckduckgo.dmg');
});

// Returns a 204 no content
router.get('/no-content', (req, res) => {
    res.status(204).send();
});

// Returns a redirect to the given target URL, with optional delay (ms) and status code.
// Example: /redirect?target=https://example.com&delay=2000&status=301
router.get('/redirect', (req, res) => {
    const target = req.query.target;
    if (!target) {
        return res.status(400).send('Missing required "target" query parameter');
    }

    const delay = parseInt(req.query.delay);
    const parsedStatus = parseInt(req.query.status);
    const status = parsedStatus >= 100 && parsedStatus <= 999 ? parsedStatus : 302;

    if (delay && !isNaN(delay)) {
        if (delay > 5000) {
            return res.status(400).send('Delay too long');
        }
        setTimeout(() => {
            res.redirect(status, target);
        }, delay);
    } else {
        res.redirect(status, target);
    }
});

module.exports = router;
