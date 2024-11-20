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

module.exports = router;
