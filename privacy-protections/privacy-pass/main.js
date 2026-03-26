/* eslint-disable no-console */

/**
 * Privacy Pass ACT test page.
 *
 * Tests the browser's HTTP-level Privacy Pass implementation by making
 * requests to the ACT test server. The browser should transparently handle
 * the 401 challenge → issuance → spend → retry flow at the network layer.
 *
 * If the browser does NOT implement Privacy Pass, the raw 401 responses
 * are visible to JavaScript via fetch(), which we detect as "not implemented".
 */

var SERVER = 'http://127.0.0.1:8443';
var results = document.getElementById('results');
var summary = document.getElementById('summary');
var passed = 0;
var failed = 0;

function log (name, success, detail) {
    var div = document.createElement('div');
    div.className = 'test ' + (success ? 'pass' : 'fail');
    div.textContent = (success ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? ': ' + detail : '');
    results.appendChild(div);
    if (success) passed++;
    else failed++;
}

function info (msg) {
    var div = document.createElement('div');
    div.className = 'test info';
    div.textContent = msg;
    results.appendChild(div);
}

async function runTests () {
    info('Privacy Pass ACT test suite — testing HTTP-level protocol handling');

    // Test 1: Server is reachable
    try {
        var statusResp = await fetch(SERVER + '/status');
        var statusData = await statusResp.json();
        log('Server reachable', statusResp.ok, 'default_credits=' + statusData.default_credits);
    } catch (e) {
        log('Server reachable', false, 'Cannot reach ' + SERVER + ': ' + e.message);
        info('Start the test server: cd act-core && cargo run --example test_server');
        updateSummary();
        return;
    }

    // Test 2: /protected returns 401 with PrivateToken challenge (without auth)
    // Note: if the browser implements Privacy Pass, it should intercept this
    // and we'd get a 200 transparently. Getting a 401 means the browser
    // doesn't (yet) handle the challenge.
    try {
        var protectedResp = await fetch(SERVER + '/protected');
        if (protectedResp.status === 200) {
            // Browser handled it transparently!
            var body = await protectedResp.json();
            log('Protected resource (browser handled challenge)', true, body.message);

            // Test 3: Check server status — should show credits issued
            var status2 = await (await fetch(SERVER + '/status')).json();
            log('Credits were issued', status2.total_issued > 0, 'total_issued=' + status2.total_issued);
            log('Spend was processed', status2.total_spent > 0, 'total_spent=' + status2.total_spent);

            // Test 4: Make another request — should succeed with remaining credits
            var protectedResp2 = await fetch(SERVER + '/protected');
            log('Second access (spending more credits)', protectedResp2.status === 200,
                'status=' + protectedResp2.status);

        } else if (protectedResp.status === 401) {
            // Browser didn't handle the challenge — expected for browsers
            // that haven't implemented Privacy Pass ACT yet
            var authHeader = protectedResp.headers.get('WWW-Authenticate');
            var hasChallenge = authHeader && authHeader.includes('PrivateToken');
            log('401 + WWW-Authenticate: PrivateToken challenge received', hasChallenge,
                'Header: ' + (authHeader || 'missing'));

            if (hasChallenge) {
                info('The server sent a valid PrivateToken challenge. ' +
                     'A Privacy Pass ACT-capable browser should intercept this 401 at the ' +
                     'network layer and transparently run the issuance + spend protocol.');

                // Parse the challenge header
                var challengeMatch = authHeader.match(/challenge="([^"]+)"/);
                var tokenTypeMatch = authHeader.match(/token-type=([^\s,]+)/);
                var issuerMatch = authHeader.match(/issuer="([^"]+)"/);

                log('Challenge contains public key', !!challengeMatch,
                    challengeMatch ? 'length=' + challengeMatch[1].length + ' chars (base64)' : 'missing');
                log('Token type is 0xDA15 (ACT)', tokenTypeMatch && tokenTypeMatch[1] === '0xDA15',
                    tokenTypeMatch ? tokenTypeMatch[1] : 'missing');
                log('Issuer URL present', !!issuerMatch,
                    issuerMatch ? issuerMatch[1] : 'missing');
            } else {
                log('Valid challenge header', false, 'WWW-Authenticate header missing or malformed');
            }

            info('Browser does not yet handle Privacy Pass ACT challenges. ' +
                 'This is expected — native integration is needed at the HTTP layer.');
        } else {
            log('Protected resource response', false, 'Unexpected status: ' + protectedResp.status);
        }
    } catch (e) {
        log('Protected resource request', false, e.message);
    }

    // Test: Public key endpoint
    try {
        var pkResp = await fetch(SERVER + '/public-key');
        var pkData = await pkResp.json();
        log('Public key available', pkResp.ok && pkData.cbor && pkData.cbor.length > 0,
            'CBOR length=' + (pkData.cbor ? pkData.cbor.length : 0) + ' chars (base64)');
    } catch (e) {
        log('Public key endpoint', false, e.message);
    }

    updateSummary();
}

function updateSummary () {
    var total = passed + failed;
    summary.textContent = passed + '/' + total + ' tests passed' + (failed > 0 ? ' (' + failed + ' failed)' : '');
    summary.style.color = failed === 0 ? '#155724' : '#721c24';
}

runTests().catch(function (e) {
    log('Unexpected error', false, e.message);
    updateSummary();
});
