const express = require('express');
const router = express.Router();

function downloadPDF (res, suggestedFilename) {
    res.download('./features/download/download.pdf', suggestedFilename);
}

function downloadJSON (res, suggestedFilename = 'data.json') {
    const json = JSON.stringify({ example: 'test' });
    const buf = Buffer.from(json);
    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-disposition': `attachment; filename="${suggestedFilename}"`
    });
    res.write(buf);
    res.end();
}

router.get('/file/:type', (req, res) => {
    const suggestedFilename = req.query.suggestedFilename;
    switch (req.params.type) {
    case 'json':
        downloadJSON(res, suggestedFilename);
        break;
    case 'pdf':
        downloadPDF(res, suggestedFilename);
        break;
    }
});

module.exports = router;
