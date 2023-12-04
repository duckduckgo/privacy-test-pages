const fs = require('fs');
const express = require('express');
const router = express.Router();

router.get('/case/', (req, res) => {
    let tag = '';
    if (typeof req.query.content !== 'undefined') {
        const sanitizedContent = String.prototype.replaceAll.call(req.query.content, /[^a-zA-Z0-9,; =-]/g, '');
        tag = `<meta name="viewport" content="${sanitizedContent}">`;
    }
    fs.readFile('./viewport/server/viewport-template.html', { encoding: 'utf-8' }, (err, contents) => {
        if (err) {
            res.statusCode = 500;
            return res.end('error');
        }
        res.end(contents.replace('{{ VIEWPORT_TAG }}', tag));
    });
});

module.exports = router;
