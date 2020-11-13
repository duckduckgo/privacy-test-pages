const express = require('express');
const ws = require('ws');
const app = express();
const port = process.env.PORT || 3000;

// start server
const listener = app.listen(port, () => {
  console.log(`Server listening at port ${listener.address().port}`)
});

// serve all static files
app.use(express.static('.'));

// endpoint for updating the app
app.post('/git', (req, res) => {
    if (req.headers['x-github-event'] == "push") { 
        /* Here will be our updating code */
    }

    return res.sendStatus(200);
});

// dummy websocket server
const wss = new ws.Server({port: 40510, path: '/block-me/web-socket'});

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
