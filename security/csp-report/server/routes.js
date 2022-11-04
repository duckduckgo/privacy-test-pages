const express = require('express');
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');

const cspIds = new Map();
router.get('/index.html', (req, res) => {
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

router.post('/csp-report', (req, res) => {
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

router.get('/reports', (req, res) => {
    if (cspIds.has(req.query.id)) {
        const reports = cspIds.get(req.query.id);
        res.json(reports);
        cspIds.delete(req.query.id);
    }
});

module.exports = router;
