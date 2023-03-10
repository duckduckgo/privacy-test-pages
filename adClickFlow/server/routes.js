async function routeInit () {
    const express = require('express');
    const routes = express.Router();

    const { getPubUrl, getPubCompleteUrl } = await import('../shared/utils.mjs');

    function getRedirectStatusCode (req) {
        const codeFromUri = parseInt(req.query.customRedirect);
        return isNaN(codeFromUri) ? 302 : codeFromUri;
    }

    routes.get('/ad/aclick', (req, res) => {
        const adPath = getPubUrl(req.query.ID, req.hostname);
        res.redirect(getRedirectStatusCode(req), adPath);
    });

    routes.get('/serp/y.js', (req, res) => {
        res.redirect(getRedirectStatusCode(req), decodeURIComponent(req.query.u));
    });

    routes.get('/serp/m.js', (req, res) => {
        res.redirect(getRedirectStatusCode(req), decodeURIComponent(req.query.u));
    });

    function redirectToPubComplete (req, res) {
        const pubCompleteUrl = getPubCompleteUrl(req.hostname);
        res.redirect(getRedirectStatusCode(req), pubCompleteUrl);
    }

    routes.post('/pay/process.html', redirectToPubComplete);
    routes.post('/pub/process.html', redirectToPubComplete);
    return routes;
}

exports.init = routeInit;
