const express = require('express');
const router = express.Router();

function downloadPDF (res) {
    res.download('./features/download/download.pdf');
}

function downloadJSON (res, suggestedFilename) {
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
    const suggestedFilename = req.query.suggestedFilename || 'data.json'
    switch (req.params.type) {
    case 'json':
        downloadJSON(res, suggestedFilename);
        break;
    case 'pdf':
        downloadPDF(res);
        break;
    }
});

module.exports = router;
