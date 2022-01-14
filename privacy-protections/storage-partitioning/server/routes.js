// Inspired by: https://github.com/arthuredelstein/privacytests.org/blob/master/live/caching.js
const express = require('express');
const router = express.Router();

const NodeCache = require('node-cache');
const countCache = new NodeCache();
const cacheKey = (key, fileType) => `${key}_${fileType}`;
const cacheTTL = 600; // seconds

const blobs = {

};

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

router.get('/', (req, res) => res.send('It works 👍'));

/*
 * Cached resource endpoints
 */

router.get('/resource', (req, res) => {
    console.log(req.hostname);
    const { key, fileType } = req.query;
    let count = countCache.get(cacheKey(key, fileType));
    if (typeof count === 'undefined') {
        count = 0;
    }
    count += 1;
    countCache.set(cacheKey(key, fileType), count, cacheTTL);
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
    console.log(req.protocol);
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
const ifNoneMatchValues = {};

router.get('/etag', (req, res) => {
    console.log(req.url);
    const { key } = req.query;
    requestIfNoneMatch = req.headers['if-none-match'];
    console.log('requestIfNoneMatch:', requestIfNoneMatch);
    if (requestIfNoneMatch) {
        res.set({ 'x-received-if-none-match': requestIfNoneMatch });
    }
    res.set({ 'Cache-Control': 'max-age=0' });
    res.send(key);
});

const passwordCounts = {};

// HTTP Basic Auth (not used for now)
router.get('/auth', (req, res) => {
    const auth = req.get('authorization');
    console.log(auth);
    if (auth) {
        const decodedAuth = Buffer.from(auth.split('Basic ')[1], 'base64')
            .toString('utf-8');
        const [username, password] = decodedAuth.split(':');
        if (passwordCounts[password]) {
            passwordCounts[password] = passwordCounts[password] + 1;
        } else {
            passwordCounts[password] = 1;
        }
        const results = { username, password, count: passwordCounts[password] };
        res.status(200);
        res.send(JSON.stringify(results));
    } else {
        res.set({
            'WWW-Authenticate': 'Basic realm="User Visible Realm", charset="UTF-8"',
            'Cache-Control': 'max-age=0'
        });
        res.status(401);
        res.send('empty');
    }
});

router.get('/headers', (req, res) => {
    console.log('/headers requested: sending', JSON.stringify(req.headers, null, 2));
    res.json(req.headers);
});

router.get('/blob', (req, res) => {
    const { key, mode, blobUrl } = req.query;
    if (mode === 'write') {
        blobs[key] = blobUrl;
    } else {
        res.json({ blobUrl: blobs[key] });
    }
});

router.get('/toplevel', (req, res) => {
    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    const gpcHeaderValue = req.header('Sec-GPC');
    console.log(ip);
    console.log({ gpcHeaderValue });
    res.send(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf8">
    <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon">
  </head>
  <body>
    <script src="/test-pages/post_data.js"></script>
    <script>
      const results = {
        "IP address leak": {
          "ipAddress": "${ip}",
          "description": "IP addresses can be used to uniquely identify a large percentage of users. A proxy, VPN, or Tor can mask a user's IP address."
        },
        "GPC enabled first-party": {
          "header value": "${gpcHeaderValue}",
          "description": "The Global Privacy Control is an HTTP header that can be sent by a browser to instruct a website not to sell the user's personal data to third parties. This test checks to see if the GPC header is sent by default to the top-level website.",
          "passed": ${gpcHeaderValue === '1'}
        }
      };
      postData(results, "toplevel");
    </script>
  </body>
</html>
`);
});

// router.listen(port, () => console.log(`listening for file requests on ${port}`));

// router.set('etag', true);

*/

module.exports = router;
