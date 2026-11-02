const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

// Helper routes for the web detection pages. The detectors read the navigation and resource
// timeline, `responseStatus` and the load event, so these failures are real network behaviour:
//
// | Route                         | Does                                                        |
// |-------------------------------|-------------------------------------------------------------|
// | `<page>.html?status=&delay=`  | The page, its response delayed by `delay` ms, with `status` |
// | `_ok?type=&w=&h=`             | A valid body of `type`                                      |
// | `_delay?ms=&type=`            | A valid body of `type`, after `ms`                          |
// | `_status?code=&type=`         | A valid body of `type` with status `code`                   |
// | `_hang`                       | No response, until the socket is closed after `HANG_MS`     |
// | `_drop`                       | Destroys the socket                                         |
// | `_corrupt?type=`              | Status 200, the right content type, bytes that do not decode |
//
// Every route also takes `ms` to delay its response.

const PAGES_ROOT = path.join(__dirname, '..');
const MAX_DELAY_MS = 30000;
const HANG_MS = 120000;

const CONTENT_TYPES = {
    html: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'text/javascript; charset=utf-8',
    json: 'application/json',
    img: 'image/png',
    svg: 'image/svg+xml',
    font: 'font/woff2',
    text: 'text/plain; charset=utf-8'
};

// A 1x1 transparent PNG
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

function typeOf (query) {
    return Object.prototype.hasOwnProperty.call(CONTENT_TYPES, query.type) ? query.type : 'text';
}

function delayOf (query) {
    const ms = Number(query.ms ?? query.delay ?? 0);
    return Number.isFinite(ms) ? Math.min(Math.max(ms, 0), MAX_DELAY_MS) : 0;
}

function statusOf (value, fallback) {
    const code = parseInt(value, 10);
    return code >= 100 && code <= 599 ? code : fallback;
}

function dimensionOf (value, fallback) {
    const n = parseInt(value, 10);
    return n > 0 && n <= 4000 ? n : fallback;
}

function validBody (type, query) {
    switch (type) {
    case 'css':
        return 'body { font-family: sans-serif; }\n';
    case 'js':
        return '/* ok */\n';
    case 'json':
        return '{"ok": true}\n';
    case 'img':
        return PNG_1X1;
    case 'svg': {
        const w = dimensionOf(query.w, 200);
        const h = dimensionOf(query.h, 120);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#8ab"/></svg>`;
    }
    case 'font':
        // Only the error and corrupt cases use a font route
        return Buffer.alloc(0);
    case 'html':
        return '<!doctype html><title>ok</title><p>ok</p>';
    default:
        return 'ok\n';
    }
}

function corruptBody (type) {
    if (type === 'img' || type === 'font' || type === 'svg') {
        return Buffer.from('this is not an image or a font, despite its content type');
    }
    if (type === 'css') return '}}} not css {{{';
    if (type === 'js') return 'this is not javascript (';
    if (type === 'json') return '{ not json';
    return '\u0000\u0001\u0002';
}

function send (res, status, type, body) {
    if (res.destroyed) return;
    res.status(status);
    res.set({
        'Content-Type': CONTENT_TYPES[type],
        'Cache-Control': 'no-store',
        // Resource entries carry `responseStatus` and sizes only when timing is allowed
        'Timing-Allow-Origin': '*'
    });
    res.end(body);
}

function later (req, fn) {
    const timer = setTimeout(fn, delayOf(req.query));
    req.on('close', () => clearTimeout(timer));
}

router.get('/_ok', (req, res) => later(req, () => send(res, 200, typeOf(req.query), validBody(typeOf(req.query), req.query))));
router.get('/_delay', (req, res) => later(req, () => send(res, 200, typeOf(req.query), validBody(typeOf(req.query), req.query))));
router.get('/_status', (req, res) => later(req, () => send(res, statusOf(req.query.code, 500), typeOf(req.query), validBody(typeOf(req.query), req.query))));
router.get('/_corrupt', (req, res) => later(req, () => send(res, 200, typeOf(req.query), corruptBody(typeOf(req.query)))));

router.get('/_hang', (req, res) => {
    const timer = setTimeout(() => res.destroy(), HANG_MS);
    req.on('close', () => clearTimeout(timer));
});

router.get('/_drop', (req, res) => {
    res.destroy();
});

// A page with `status` or `delay`. Without either, express.static serves it.
router.get(/^\/([a-z0-9-]+)\.html$/, (req, res, next) => {
    if (req.query.status === undefined && req.query.delay === undefined) {
        return next();
    }
    fs.readFile(path.join(PAGES_ROOT, `${req.params[0]}.html`), (err, body) => {
        if (err) return next();
        later(req, () => send(res, statusOf(req.query.status, 200), 'html', body));
    });
});

module.exports = router;
