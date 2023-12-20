const express = require('express');
const router = express.Router();

// Returns a 301 redirect to a download link of our browser
// for use in the download path test
router.get('/download-redirect', (req, res) => {
    res.redirect(301, 'https://staticcdn.duckduckgo.com/macos-desktop-browser/duckduckgo.dmg');
});

module.exports = router;
