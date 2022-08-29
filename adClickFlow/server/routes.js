async function routeInit () {
    const express = require('express');
    const routes = express.Router();

    const { getPubUrl, getPubCompleteUrl } = await import('../shared/utils.mjs');
    routes.get('/ad/aclick', (req, res) => {
        const adPath = getPubUrl(req.query.ID, req.hostname);
        res.redirect(302, adPath);
    });

    routes.get('/serp/y.js', (req, res) => {
        res.redirect(302, decodeURIComponent(req.query.u));
    });

    routes.get('/serp/m.js', (req, res) => {
        res.redirect(302, decodeURIComponent(req.query.u));
    });

    function redirectToPubComplete (req, res) {
        const pubCompleteUrl = getPubCompleteUrl(req.hostname);
        res.redirect(302, pubCompleteUrl);
    }

    routes.post('/pay/process.html', redirectToPubComplete);
    routes.post('/pub/process.html', redirectToPubComplete);
    return routes;
}

exports.init = routeInit;
