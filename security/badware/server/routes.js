const express = require('express');
const router = express.Router();

// Returns a 301 redirect to the main phishing test page
router.get('/', (req, res) => {
    res.redirect(
        301,
        '/security/badware/phishing.html'
    );
});

// Returns a 302 redirect to the main phishing test page
router.get('/302', (req, res) => {
    res.redirect(
        302,
        '/security/badware/phishing.html'
    );
});

// Returns a 301 redirect to a JS redirector page
router.get('/js', (req, res) => {
    res.redirect(
        301,
        '/security/badware/phishing-js-redirector.html'
    );
});

// Returns a 301 redirect to a JS redirector helper page
router.get('/js2', (req, res) => {
    res.redirect(
        301,
        '/security/badware/phishing-js-redirector-helper.html'
    );
});

// Returns a redirect to a page that loads an iframe that renders a phishing page
router.get('/iframe', (req, res) => {
    res.redirect(
        301,
        '/security/badware/phishing-iframe-loader.html'
    );
});

// Returns a redirect to a page that loads multiple iframes to attempt to bypass the phishing detection
router.get('/iframe2', (req, res) => {
    res.redirect(301, '/security/badware/phishing-legit-iframe-loader.html');
});

// Returns a redirect to a page that renders a phishing page using a meta refresh (not flagged in dataset)
router.get('/meta', (req, res) => {
    res.redirect(301, '/security/badware/phishing-meta-redirect-clean.html');
});

// Returns a redirect to a page that renders a phishing page using a meta refresh (flagged in dataset)
router.get('/meta2', (req, res) => {
    res.redirect(301, '/security/badware/phishing-meta-redirect.html');
});

// Form handler for the phishing form
router.post('/form', (req, res) => {
    res.send('Form submitted');
});

// Serves an arbitrary executable file to test download detection
router.get('/download', (req, res) => {
    // Create a buffer with a minimal valid PE header
    const fileData = Buffer.alloc(64);
    // MZ header (magic bytes)
    const magicBytes = [0x4d, 0x5a];
    // DOS stub filled with zeros
    const dosStub = new Uint8Array(58).fill(0);
    fileData.set(magicBytes, 0);
    fileData.set(dosStub, 2);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="test.exe"');
    res.send(fileData);
});

module.exports = router;
