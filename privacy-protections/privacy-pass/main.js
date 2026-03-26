/* eslint-disable no-console */

const results = document.getElementById('results');
const summary = document.getElementById('summary');
let passed = 0;
let failed = 0;

function log (name, success, detail) {
    const div = document.createElement('div');
    div.className = 'test ' + (success ? 'pass' : 'fail');
    div.textContent = (success ? 'PASS' : 'FAIL') + ' — ' + name + (detail ? ': ' + detail : '');
    results.appendChild(div);
    if (success) passed++;
    else failed++;
}

function info (msg) {
    const div = document.createElement('div');
    div.className = 'test info';
    div.textContent = msg;
    results.appendChild(div);
}

async function runTests () {
    info('Starting Privacy Pass ACT prototype tests...');

    // Test 1: API exists
    const apiExists = typeof navigator.privacyPass === 'object' && navigator.privacyPass !== null;
    log('navigator.privacyPass exists', apiExists);
    if (!apiExists) {
        info('Cannot continue without navigator.privacyPass API. Is the privacyPass feature enabled?');
        updateSummary();
        return;
    }

    // Test 2: API methods exist
    const hasIssue = typeof navigator.privacyPass.issue === 'function';
    const hasSpend = typeof navigator.privacyPass.spend === 'function';
    const hasBalance = typeof navigator.privacyPass.balance === 'function';
    const hasRedeem = typeof navigator.privacyPass.redeem === 'function';
    log('issue() method exists', hasIssue);
    log('spend() method exists', hasSpend);
    log('balance() method exists', hasBalance);
    log('redeem() method exists', hasRedeem);

    if (!hasIssue || !hasSpend || !hasBalance || !hasRedeem) {
        info('Cannot continue without all API methods.');
        updateSummary();
        return;
    }

    // Test 3: Issue a credential with 10 credits
    let credential;
    try {
        credential = await navigator.privacyPass.issue({ issuer: 'https://example.com', credits: 10 });
        const issueOk = credential && typeof credential.credentialId === 'string' && credential.credits === 10;
        log('Issue credential (10 credits)', issueOk, JSON.stringify(credential));
    } catch (e) {
        log('Issue credential (10 credits)', false, e.message);
        updateSummary();
        return;
    }

    // Test 4: Spend 3 credits
    let spendResult;
    try {
        spendResult = await navigator.privacyPass.spend({ credentialId: credential.credentialId, amount: 3 });
        const spendOk = spendResult &&
            typeof spendResult.credentialId === 'string' &&
            spendResult.remainingCredits === 7 &&
            typeof spendResult.token === 'string';
        log('Spend 3 credits (expect 7 remaining)', spendOk, JSON.stringify(spendResult));
    } catch (e) {
        log('Spend 3 credits', false, e.message);
        updateSummary();
        return;
    }

    // Test 5: Query balance (should be 7)
    try {
        const balanceResult = await navigator.privacyPass.balance({ credentialId: spendResult.credentialId });
        const balanceOk = balanceResult && balanceResult.credits === 7;
        log('Balance check (expect 7)', balanceOk, JSON.stringify(balanceResult));
    } catch (e) {
        log('Balance check', false, e.message);
    }

    // Test 6: Redeem the token from the spend
    try {
        const redeemResult = await navigator.privacyPass.redeem({ token: spendResult.token });
        const redeemOk = redeemResult && redeemResult.valid === true;
        log('Redeem token', redeemOk, JSON.stringify(redeemResult));
    } catch (e) {
        log('Redeem token', false, e.message);
    }

    // Test 7: Spend remaining 7 credits
    let finalSpend;
    try {
        finalSpend = await navigator.privacyPass.spend({ credentialId: spendResult.credentialId, amount: 7 });
        const finalOk = finalSpend && finalSpend.remainingCredits === 0;
        log('Spend remaining 7 credits (expect 0)', finalOk, JSON.stringify(finalSpend));
    } catch (e) {
        log('Spend remaining 7 credits', false, e.message);
    }

    // Test 8: Attempt to overspend (should fail)
    if (finalSpend) {
        try {
            await navigator.privacyPass.spend({ credentialId: finalSpend.credentialId, amount: 1 });
            log('Overspend attempt (expect error)', false, 'Should have thrown an error');
        } catch (e) {
            log('Overspend attempt (expect error)', true, 'Correctly rejected: ' + e.message);
        }
    }

    // Test 9: Redeem with invalid token (should return valid=false)
    try {
        const badRedeem = await navigator.privacyPass.redeem({ token: 'invalid-token-12345' });
        const badRedeemOk = badRedeem && badRedeem.valid === false;
        log('Redeem invalid token (expect valid=false)', badRedeemOk, JSON.stringify(badRedeem));
    } catch (e) {
        // Also acceptable to throw
        log('Redeem invalid token (expect error or valid=false)', true, 'Rejected: ' + e.message);
    }

    // Test 10: Input validation - issue with 0 credits
    try {
        await navigator.privacyPass.issue({ issuer: 'https://example.com', credits: 0 });
        log('Input validation: issue with 0 credits (expect error)', false, 'Should have thrown');
    } catch (e) {
        log('Input validation: issue with 0 credits (expect error)', true, 'Correctly rejected: ' + e.message);
    }

    updateSummary();
}

function updateSummary () {
    const total = passed + failed;
    summary.textContent = passed + '/' + total + ' tests passed' + (failed > 0 ? ' (' + failed + ' failed)' : '');
    summary.style.color = failed === 0 ? '#155724' : '#721c24';
}

runTests().catch(function (e) {
    log('Unexpected error', false, e.message);
    updateSummary();
});
