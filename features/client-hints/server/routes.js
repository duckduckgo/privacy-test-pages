const express = require('express');
const router = express.Router();
const fs = require('fs');
const { ALL_CH } = require('../all-ch');

const EXCLUDED_HOSTS = ['good.third-party.site'];
const ALL_CH_STR = ALL_CH.join(',');

router.get('/', (req, res) => {
    // don't add header for excluded hosts so that we can test the default CHs easily
    if (!EXCLUDED_HOSTS.includes(req.hostname)) {
        res.set('accept-ch', ALL_CH_STR);
    }

    fs.readFile('./features/client-hints/main.html', { encoding: 'utf-8' }, (err, contents) => {
        if (err) {
            res.statusCode = 500;
            return res.end('error');
        }
        res.end(contents);
    });
});

module.exports = router;
