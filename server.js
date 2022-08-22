const express = require('express');
const ws = require('ws');
const app = express();
const port = process.env.PORT || 3000;
const url = require('url');
const cmd = require('node-cmd');
const crypto = require('crypto');
const fs = require('fs');
const { json } = require('body-parser');
const https = require('https');

function fullUrl (req) {
    return url.format({
        // note: if server is behind a proxy, and it probably is, you may see 'http' here even if request was 'https'
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl
    });
}

// Start the HTTP server. On Glitch the proxy will forward both HTTP and HTTPS
// traffic to this server.
const listener = app.listen(port, () => {
    console.log(`HTTP Server listening at port ${listener.address().port}`);
});

// Start HTTPS server for https://first-party.example and https://third-party.example
// See README.md for setup instructions
if (fs.existsSync('first-party.example+11.pem') && fs.existsSync('first-party.example+11-key.pem')) {
    console.log('Running local HTTPS server.');
    const httpsOptions = {
        key: fs.readFileSync('first-party.example+11-key.pem'),
        cert: fs.readFileSync('first-party.example+11.pem')
    };
    const httpsListener = https.createServer(httpsOptions, app).listen(443, () => {
        console.log(`HTTPS server listening on port ${httpsListener.address().port}`);
    });
} else {
    console.log('HTTPS key and certificate not found. Skipping HTTPS server.');
}

app.use(express.json());
// Parse post request data as JSON for requests with content-type 'application/csp-report'
app.use(json({
    type: 'application/csp-report'
}));

// Import storage partitioning routes
const partitioningRoutes = require('./privacy-protections/storage-partitioning/server/routes');
app.use('/partitioning', partitioningRoutes);

function joinPath () {
    return '/' + [...arguments].map(s => s.replace(/^[/]/, '').replace(/[/]$/, '')).join('/');
}

function isSearchHostname (req) {
    return req.hostname === 'www.search-company.example' || req.hostname === 'www.search-company.site';
}

function isAdHostname (req) {
    return (
        req.hostname === 'www.ad-company.example' ||
        req.hostname === 'www.ad-company.site' ||
        req.hostname === 'convert.ad-company.example' ||
        req.hostname === 'convert.ad-company.site'
    );
}

function isPubHostname (req) {
    return req.hostname === 'www.publisher-company.example' || req.hostname === 'www.publisher-company.site';
}

function isPayHostname (req) {
    return req.hostname === 'www.payment-company.example' || req.hostname === 'www.payment-company.site';
}

// Handle internal redirects to adClickFlow directories
app.all('*', (req, res, next) => {
    const AD_FLOW = '/adClickFlow';
    if (
        // If we're not a ad click flow domain ignore.
        !(isSearchHostname(req) || isAdHostname(req) || isPubHostname(req) || isPayHostname(req)) ||
        // If we've already passed to the ad dir then ignore.
        req.path.startsWith(AD_FLOW)
    ) {
        next();
        return;
    }
    if (req.path.includes('/shared/')) {
        req.url = joinPath(AD_FLOW, '/', req.path);
        app.handle(req, res);
        return;
    }
    if (isSearchHostname(req)) {
        req.url = joinPath(AD_FLOW, '/serp/', req.path);
        app.handle(req, res);
        return;
    }
    if (isAdHostname(req)) {
        req.url = joinPath(AD_FLOW, '/ad/', req.path);
        app.handle(req, res);
        return;
    }
    if (isPubHostname(req)) {
        req.url = joinPath(AD_FLOW, '/pub/', req.path);
        app.handle(req, res);
        return;
    }
    if (isPayHostname(req)) {
        req.url = joinPath(AD_FLOW, '/pay/', req.path);
        app.handle(req, res);
    }
});

async function adClickFlow () {
    const adClickFlow = require('./adClickFlow/server/routes');
    const adClickFlowRoutes = await adClickFlow.init();
    app.use('/adClickFlow', adClickFlowRoutes);
}
adClickFlow();

// serve all static files
app.use(express.static('.', {
    setHeaders: (res, path) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Timing-Allow-Origin', '*');
        res.set('Server-Timing', 'loaded');

        // send CSP header when fetching request blocking test site
        if (path.endsWith('privacy-protections/request-blocking/index.html')) {
            res.set('Content-Security-Policy-Report-Only', 'img-src http: https:; report-uri https://bad.third-party.site/block-me/csp');
        }

        // send Referrer-policy header when fetching referrer trimming test site
        if (path.endsWith('privacy-protections/referrer-trimming/index.html')) {
            res.set('Referrer-Policy', 'unsafe-url');
        }
    }
}));

// endpoint for updating the app (https://support.glitch.com/t/tutorial-how-to-auto-update-your-project-with-github/8124)
app.post('/git', (req, res) => {
    const hmac = crypto.createHmac('sha1', process.env.SECRET);
    const sig = 'sha1=' + hmac.update(JSON.stringify(req.body)).digest('hex');

    // don't deploy if push was to a branch other than main
    if (req.body.ref !== 'refs/heads/main') {
        return res.sendStatus(204);
    }

    if (req.headers['x-github-event'] === 'push' && crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(req.headers['x-hub-signature'], 'utf8'))) {
        try {
            fs.chmodSync('git.sh', '777'); /* Fix no perms after updating */
            cmd.runSync('./git.sh');
            cmd.runSync('refresh'); // Refresh project

            console.log('> 💚 Deploy successful!');

            return res.sendStatus(200);
        } catch (e) {
            console.log('> 💥 Error deploying: ', e);
            return res.sendStatus(500);
        }
    } else {
        return res.sendStatus(403);
    }
});

// dummy websocket server
const wss = new ws.Server({ server: listener, path: '/block-me/web-socket' });

wss.on('connection', (ws) => {
    ws.send('It works 👍');
    ws.close();
});

// dummy server sent events
app.get('/block-me/server-sent-events', (req, res) => {
    res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Timing-Allow-Origin': '*'
    });
    res.flushHeaders();

    res.write('data: It works 👍\n\n');

    setTimeout(() => {
        res.end();
    }, 1000);
});

// dummy CSP report endopoint
app.post('/block-me/csp', (req, res) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Server-Timing', 'loaded');
    return res.sendStatus(200);
});

// dummy sednBeacon endopoint
app.post('/block-me/beacon', (req, res) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Server-Timing', 'loaded');
    return res.sendStatus(204);
});

// reflects request headers and request url back
app.get('/reflect-headers', (req, res) => {
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Timing-Allow-Origin', '*');

    const result = { url: fullUrl(req), headers: req.headers };

    // when navigating to this page firefox will show JSON in it's JSON viewer, sometimes we don't want that
    // in those cases add ?text=1 to url and it will load as plain text and not trigger the viewer
    if (req.query.text) {
        res.write(JSON.stringify(result));

        return res.end();
    } else {
        return res.json(result);
    }
});

// sets a cookie with provided value
app.get('/set-cookie', (req, res) => {
    res.set('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Timing-Allow-Origin', '*');

    const expires = new Date((Date.now() + (10 * 24 * 60 * 60 * 1000)));

    if (!req.query.value) {
        return res.sendStatus(401);
    }
    return res.cookie('headerdata', req.query.value, { expires, httpOnly: true, sameSite: 'none', secure: true }).sendStatus(200);
});

// returns a random number and sets caching for a year
app.get('/cached-random-number', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=31556926, immutable');

    const random = (Math.round(Math.random() * 1000)).toString();

    res.end(random);
});

// returns referrer found in the header and in js back to the test page
app.get('/come-back', (req, res) => {
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <title>Redirecting</title>
</head>
<body>
<script>
    const jsReferrer = document.referrer;
    document.body.innerHTML += '<p>header: <strong>${req.headers.referer || ''}</strong></p><p>js: <strong>' + jsReferrer + '</strong></p>';
    setTimeout(() => {
        location.href = 'https://privacy-test-pages.glitch.me/privacy-protections/referrer-trimming/?run&header=${req.headers.referer || ''}&js=' + jsReferrer;
    }, 1000);
</script>
</body>
</html>`);
});

const cspIds = new Map();
app.get('/security/csp-report/index.html', (req, res) => {
    const id = crypto.randomInt(2 ** 32).toString(16);
    cspIds.set(id, []);
    // req.protocol is always 'http' on glitch (beause proxy) - let's default to 'https' here (unless localhost)
    const protocol = (req.protocol === 'http' && !req.get('host').startsWith('localhost')) ? 'https' : req.protocol;
    const origin = `${protocol}://${req.get('host')}`;
    const policy = `default-src 'self'; img-src 'self'; media-src 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' 'nonce-${id}'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; report-uri ${origin}/security/csp-report/csp-report?id=${id}`;
    res.set('content-security-policy', policy);
    fs.readFile('./security/csp-report/index-template.html', { encoding: 'utf-8' }, (err, contents) => {
        if (err) {
            res.statusCode = 500;
            return res.end('error');
        }
        res.end(contents.replace('%%UID%%', id));
    });
    // ensure IDs get deleted after 60s
    setTimeout(() => cspIds.delete(id), 60000);
});

app.post('/security/csp-report/csp-report', (req, res) => {
    // req.protocol is always 'http' on glitch (beause proxy) - let's default to 'https' here (unless localhost)
    const protocol = (req.protocol === 'http' && !req.get('host').startsWith('localhost')) ? 'https' : req.protocol;
    const origin = `${protocol}://${req.get('host')}`;
    const reports = cspIds.get(req.query.id);
    if (reports) {
        const report = req.body['csp-report'];
        if (report['source-file'] && !report['source-file'].startsWith(origin)) {
            reports.push(req.body['csp-report']);
        }
    }
    res.end();
});

app.get('/security/csp-report/reports', (req, res) => {
    if (cspIds.has(req.query.id)) {
        const reports = cspIds.get(req.query.id);
        res.json(reports);
        cspIds.delete(req.query.id);
    }
});

function downloadPDF (res) {
    res.download('./features/download.pdf');
}

function downloadJSON (res) {
    const json = JSON.stringify({ example: 'test' });
    const buf = Buffer.from(json);
    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-disposition': 'attachment; filename=data.json'
    });
    res.write(buf);
    res.end();
}

app.get('/features/download/:type', (req, res) => {
    switch (req.params.type) {
    case 'json':
        downloadJSON(res);
        break;
    case 'pdf':
        downloadPDF(res);
        break;
    }
});
