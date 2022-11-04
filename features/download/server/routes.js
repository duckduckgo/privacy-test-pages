const express = require('express');
const router = express.Router();

function downloadPDF (res) {
    res.download('./features/download/download.pdf');
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

router.get('/file/:type', (req, res) => {
    switch (req.params.type) {
    case 'json':
        downloadJSON(res);
        break;
    case 'pdf':
        downloadPDF(res);
        break;
    }
});

module.exports = router;
