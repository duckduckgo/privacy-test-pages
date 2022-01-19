// Inspired by: https://github.com/arthuredelstein/privacytests.org/blob/master/live/caching.js
const express = require('express');
const router = express.Router();

const NodeCache = require('node-cache');
const cacheTTL = 300; // seconds

router.get('/', (req, res) => res.send('It works 👍'));

/*
 * Cached resource endpoints
 */

const resourceFiles = {
    favicon: 'favicon.png',
    fetch: 'page.html',
    font: 'font.woff',
    image: 'image.png',
    page: 'page.html',
    preload: 'page.html',
    prefetch: 'page.html',
    xhr: 'page.html'
};

const fileGenerators = {
    css: () => `#css { font-family: fake_${Math.random().toString().slice(2)}; }`
};

const mimeTypes = {
    favicon: 'image/png',
    fetch: 'text/html',
    font: 'font/woff',
    image: 'image/png',
    page: 'text/html',
    preload: 'text/html',
    prefetch: 'text/html',
    css: 'text/css',
    xhr: 'text/html'
};

const countCache = new NodeCache({ stdTTL: cacheTTL });
const cacheKey = (key, fileType) => `${key}_${fileType}`;

router.get('/resource', (req, res) => {
    console.log(req.hostname);
    const { key, fileType } = req.query;
    let count = countCache.get(cacheKey(key, fileType));
    if (typeof count === 'undefined') {
        count = 0;
    }
    count += 1;
    countCache.set(cacheKey(key, fileType), count);
    console.log(`Requested: ${req.url} ; Count: ${count}`);
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=604800, immutable'
    });
    res.setHeader('content-type', mimeTypes[fileType]);
    const file = resourceFiles[fileType];
    if (file) {
        res.sendFile(file, { root: __dirname });
    } else {
        res.send(fileGenerators[fileType]());
    }
});

router.get('/ctr', (req, res) => {
    const { key, fileType } = req.query;
    let count = countCache.get(cacheKey(key, fileType));
    if (typeof count === 'undefined') {
        count = 0;
    }
    console.log(`Count checked for ${fileType}, ${key}: ${count}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(`${count}`);
});

/*
 * HSTS endpoints
 */

router.get('/set_hsts.png', (req, res) => {
    const headers = {
        'Strict-Transport-Security': 'max-age=30',
        'Cache-Control': 'max-age=0'
    };
    res.sendFile('image.png', { root: __dirname, headers });
});

router.get('/get_hsts.png', (req, res) => {
    let isHTTPS = req.protocol === 'https';
    // The X-Forwarded-Proto header is added by Glitch's proxy
    // and reveals the original protocol used during the connection
    if (req.headers['x-forwarded-proto']) {
        isHTTPS = req.headers['x-forwarded-proto'].split(',', 1)[0] === 'https';
    }
    if (isHTTPS) {
        const headers = { 'Cache-Control': 'max-age=0' };
        res.sendFile('image.png', { root: __dirname, headers });
    } else {
        res.status(400).send({
            message: 'Image accessed over HTTP'
        });
    }
});

router.get('/clear_hsts.png', (req, res) => {
    const headers = {
        'Strict-Transport-Security': 'max-age=0',
        'Cache-Control': 'max-age=0'
    };
    res.sendFile('image.png', { root: __dirname, headers });
});

/*
 * Result caching
 */

const dataCache = new NodeCache({ stdTTL: cacheTTL, useClones: false });

// Required for CORS preflight request browsers make before POSTing data.
router.options('/save-results', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.sendStatus(200);
});

router.post('/save-results', (req, res) => {
    console.log('POST request');

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (!req.body || typeof req.body !== 'object') {
        res.sendStatus(400);
        return;
    }

    const { key, siteType, testId } = req.query;

    let cachedResults = dataCache.get(key);
    if (typeof cachedResults === 'undefined') {
        // The cache doesn't clone objects, it just stores and returns
        // references. This means we just need to push an initial reference.
        // On future calls, simply getting the reference and updating it
        // is sufficient--no need to re-push the updated object.
        cachedResults = {};
        dataCache.set(key, cachedResults);
    }

    // Add new results to stored object
    cachedResults[[siteType, testId]] = req.body;

    res.sendStatus(200);
});

router.get('/get-results', (req, res) => {
    const { key } = req.query;
    if (!key) {
        res.sendStatus(400);
    }
    const results = dataCache.get(key);
    if (typeof results === 'undefined') {
        res.sendStatus(400);
    }
    dataCache.del(key);
    res.json(results);
});

module.exports = router;
