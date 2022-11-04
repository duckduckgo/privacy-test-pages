const express = require('express');
const router = express.Router();

// dummy server sent events
router.get('/server-sent-events', (req, res) => {
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
router.post('/csp', (req, res) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Server-Timing', 'loaded');
    return res.sendStatus(200);
});

// dummy sednBeacon endopoint
router.post('/beacon', (req, res) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Server-Timing', 'loaded');
    return res.sendStatus(204);
});

module.exports = router;
