const express = require('express');
const ws = require('ws');
const app = express();
const port = process.env.PORT || 3000;

// start server
const listener = app.listen(port, () => {
  console.log(`Server listening at port ${listener.address().port}`)
});

// serve all static files
app.use(express.static('.', {
    setHeaders: (res, path) => {
        res.set("Access-Control-Allow-Origin", "*");

        // send CSP header when fetching request blocking test site
        if (path.endsWith('privacy-protections/request-blocking/index.html')) {
            res.set("Content-Security-Policy-Report-Only", "img-src http: https:; report-uri /block-me/csp");
        }
    }
}));

// // endpoint for updating the app
// app.post('/git', (req, res) => {
//     if (req.headers['x-github-event'] == "push") { 
//         /* Here will be our updating code */
//     }

//     return res.sendStatus(200);
// });

// dummy websocket server
const wss = new ws.Server({server: listener, path: '/block-me/web-socket'});

wss.on('connection', (ws) => {
    ws.send('It works 👍');
    ws.close();
});

// dummy server sent events
app.get('/block-me/server-sent-events', (req, res) => {
    res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
    });
    res.flushHeaders();

    res.write(`data: It works 👍\n\n`);
});

// dummy CSP report endopoint
app.post('/block-me/csp', (req, res) => {
    return res.sendStatus(200);
});

// reflects request headers back
app.get('/reflect-headers', (req, res) => {
    return res.json({headers: req.headers});
});

// sets a cookie with provided value
app.get('/set-cookie', (req, res) => {
    const expires = new Date((Date.now() + (7 * 24 * 60 * 60 * 1000)));
    
    if (!req.query['value']) {
        return res.sendStatus(401);
    }
    return res.cookie('headerdata', req.query['value'], {expires, httpOnly: true}).sendStatus(200);
});

app.get('/cached-random-number', (req, res) => {
    res.setHeader('Cache-Control', 'max-age=31556926');

    const random = (Math.round(Math.random() * 1000)).toString();

    res.end(random);
});