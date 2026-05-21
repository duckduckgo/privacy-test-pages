/*
 * Device enumeration chaos test page.
 *
 * Repro tool for OPS-7378: the Windows browser (MSIX) is showing the OS
 * camera permission prompt on sites that silently probe media-device APIs
 * (claude.ai, linkedin.com, youtube.com). The C-S-S deviceEnumerationFix
 * only intercepts enumerateDevices(); this page also exercises every
 * adjacent API (getUserMedia, permissions.query, RTCPeerConnection,
 * getDisplayMedia, iframe contexts) so a tester can isolate which call
 * still triggers the OS prompt on a build under test.
 */

const IFRAME_CHILD_URL = new URL('./iframe-child.html', window.location.href).href;
const IFRAME_RESPONSE_TIMEOUT_MS = 8000;

const logEl = document.getElementById('log');
const techniquesEl = document.getElementById('techniques');
const unleashButton = document.getElementById('unleash');
const unleashProgress = document.getElementById('unleash-progress');
const overallPromptSelect = document.getElementById('overall-prompt');
const downloadButton = document.getElementById('download');
const resetButton = document.getElementById('reset');
const confirmDialog = document.getElementById('confirm-dialog');
const confirmGoButton = document.getElementById('confirm-go');
const confirmCancelButton = document.getElementById('confirm-cancel');

const state = {
    startedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    diagnostics: collectDiagnostics(),
    overallPromptObserved: 'not-answered',
    results: {},
};

function log(message, detail) {
    const ts = new Date().toISOString();
    const detailStr = detail === undefined ? '' : ` ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`;
    logEl.textContent = `${logEl.textContent}[${ts}] ${message}${detailStr}\n`;
    logEl.scrollTop = logEl.scrollHeight;
}

function describeError(err) {
    if (err == null) return 'unknown';
    if (err instanceof Error) return `${err.name}: ${err.message}`;
    return String(err);
}

async function stopStreamTracks(stream) {
    if (!stream || typeof stream.getTracks !== 'function') return [];
    const tracks = stream.getTracks();
    const summary = tracks.map((t) => ({ kind: t.kind, label: t.label, readyState: t.readyState }));
    for (const track of tracks) {
        try {
            track.stop();
        } catch (e) {
            // ignore
        }
    }
    return summary;
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
 * Promise-wraps an enumerateDevices() call scheduled via an arbitrary
 * callback (setTimeout, requestAnimationFrame, MessageChannel, ...). The
 * scheduled callback body is wrapped in try/catch so that a synchronous
 * throw (e.g. navigator.mediaDevices being undefined in a non-secure
 * context) propagates as a Promise rejection instead of escaping the
 * Promise executor and leaving the outer Promise hanging.
 */
function scheduledEnumerate(schedule) {
    return new Promise((resolve, reject) => {
        schedule(() => {
            try {
                navigator.mediaDevices.enumerateDevices()
                    .then((d) => resolve({ count: d.length }))
                    .catch(reject);
            } catch (e) {
                reject(e);
            }
        });
    });
}

/*
 * Spawn a Web Worker built from a Blob URL that probes for navigator.mediaDevices
 * inside worker scope. Per spec mediaDevices is NOT exposed in workers, but
 * reCAPTCHA Enterprise's webworker.js literally importScripts() the full
 * recaptcha bundle (which expects mediaDevices) — so this is worth verifying
 * on the build under test.
 */
function runInWebWorker() {
    return new Promise((resolve, reject) => {
        const source = `
            self.addEventListener('message', async () => {
                const result = {
                    selfNavigatorPresent: typeof self.navigator !== 'undefined',
                    mediaDevicesPresent: typeof self.navigator !== 'undefined' && Boolean(self.navigator.mediaDevices),
                    enumerateDevicesPresent: typeof self.navigator !== 'undefined'
                        && Boolean(self.navigator.mediaDevices)
                        && typeof self.navigator.mediaDevices.enumerateDevices === 'function',
                    getUserMediaPresent: typeof self.navigator !== 'undefined'
                        && Boolean(self.navigator.mediaDevices)
                        && typeof self.navigator.mediaDevices.getUserMedia === 'function',
                };
                try {
                    if (result.enumerateDevicesPresent) {
                        const devices = await self.navigator.mediaDevices.enumerateDevices();
                        result.enumerateDevicesCount = devices.length;
                        result.enumerateDevicesKinds = devices.map((d) => d.kind);
                    }
                } catch (e) {
                    result.enumerateDevicesError = (e && (e.name + ': ' + e.message)) || String(e);
                }
                try {
                    if (result.getUserMediaPresent) {
                        const stream = await self.navigator.mediaDevices.getUserMedia({ video: true });
                        result.getUserMediaOk = true;
                        for (const t of stream.getTracks()) t.stop();
                    }
                } catch (e) {
                    result.getUserMediaError = (e && (e.name + ': ' + e.message)) || String(e);
                }
                self.postMessage(result);
            });
        `;
        const blob = new Blob([source], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        let worker;
        try {
            worker = new Worker(url);
        } catch (e) {
            URL.revokeObjectURL(url);
            reject(e);
            return;
        }
        const cleanup = () => {
            URL.revokeObjectURL(url);
            try { worker.terminate(); } catch (e) { /* ignore */ }
        };
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error('worker-response-timeout'));
        }, IFRAME_RESPONSE_TIMEOUT_MS);
        worker.addEventListener('message', (event) => {
            clearTimeout(timer);
            cleanup();
            resolve(event.data);
        });
        worker.addEventListener('error', (event) => {
            clearTimeout(timer);
            cleanup();
            reject(new Error(event.message || 'worker-error'));
        });
        worker.postMessage('go');
    });
}

/*
 * Full ICE-leak pattern as used by LinkedIn's first-party getIPs() in
 * static.licdn.com/aero-v1/.../CtQciDL0.js and by countless fingerprinting
 * libraries. Creates a peer connection with a STUN server, opens a data
 * channel (needed to gather candidates without addTrack), creates and
 * sets a local offer, then accumulates candidates for the given duration.
 */
function collectIceCandidates(timeoutMs) {
    return new Promise((resolve, reject) => {
        let pc;
        try {
            pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
        } catch (e) {
            reject(e);
            return;
        }
        const candidates = [];
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                candidates.push({
                    type: event.candidate.type,
                    protocol: event.candidate.protocol,
                    address: event.candidate.address,
                    port: event.candidate.port,
                    candidate: event.candidate.candidate,
                });
            }
        };
        try {
            pc.createDataChannel('chaos-icetest');
        } catch (e) {
            try { pc.close(); } catch (closeErr) { /* ignore */ }
            reject(e);
            return;
        }
        pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .catch((e) => {
                try { pc.close(); } catch (closeErr) { /* ignore */ }
                reject(e);
            });
        setTimeout(() => {
            const result = {
                candidateCount: candidates.length,
                types: Array.from(new Set(candidates.map((c) => c.type))),
                addresses: Array.from(new Set(candidates.map((c) => c.address).filter(Boolean))),
                gatheringState: pc.iceGatheringState,
            };
            try { pc.close(); } catch (e) { /* ignore */ }
            resolve(result);
        }, timeoutMs);
    });
}

function collectDiagnostics() {
    const md = navigator.mediaDevices;
    const enumerateFnSource = md && md.enumerateDevices ? Function.prototype.toString.call(md.enumerateDevices) : null;
    const getUserMediaFnSource = md && md.getUserMedia ? Function.prototype.toString.call(md.getUserMedia) : null;
    return {
        hasMediaDevices: Boolean(md),
        hasEnumerateDevices: Boolean(md && md.enumerateDevices),
        hasGetUserMedia: Boolean(md && md.getUserMedia),
        hasGetDisplayMedia: Boolean(md && md.getDisplayMedia),
        hasLegacyGetUserMedia: typeof navigator.getUserMedia === 'function',
        hasPermissionsApi: Boolean(navigator.permissions && navigator.permissions.query),
        hasRTCPeerConnection: typeof window.RTCPeerConnection === 'function',
        crossOriginIsolated: Boolean(window.crossOriginIsolated),
        isSecureContext: Boolean(window.isSecureContext),
        enumerateDevicesAppearsNative: enumerateFnSource ? /\[native code\]/.test(enumerateFnSource) : null,
        getUserMediaAppearsNative: getUserMediaFnSource ? /\[native code\]/.test(getUserMediaFnSource) : null,
        enumerateDevicesSourcePrefix: enumerateFnSource ? enumerateFnSource.slice(0, 200) : null,
    };
}

/*
 * Iframe helpers (Group E).
 *
 * Each factory returns a Promise<HTMLIFrameElement> for an iframe that has
 * loaded iframe-child.html and posted its `chaos-iframe-ready` handshake.
 * The caller must remove the iframe after use.
 */

function waitForFrameReady(iframe) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            reject(new Error('iframe-ready-timeout'));
        }, IFRAME_RESPONSE_TIMEOUT_MS);

        function onMessage(event) {
            if (event.source !== iframe.contentWindow) return;
            if (!event.data || event.data.type !== 'chaos-iframe-ready') return;
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(iframe);
        }
        window.addEventListener('message', onMessage);
    });
}

async function makeIframeFromSrc(extraAttrs = {}) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'camera; microphone');
    iframe.style.cssText = 'width:320px;height:80px;border:1px dashed #aaa;margin:4px';
    for (const [k, v] of Object.entries(extraAttrs)) iframe.setAttribute(k, v);
    iframe.src = IFRAME_CHILD_URL;
    document.body.appendChild(iframe);
    await waitForFrameReady(iframe);
    return iframe;
}

async function makeIframeSrcdoc(srcdocBody) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'camera; microphone');
    iframe.style.cssText = 'width:320px;height:80px;border:1px dashed #aaa;margin:4px';
    iframe.srcdoc = srcdocBody;
    document.body.appendChild(iframe);
    await waitForFrameReady(iframe);
    return iframe;
}

async function makeIframeDocumentWrite() {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('allow', 'camera; microphone');
    iframe.style.cssText = 'width:320px;height:80px;border:1px dashed #aaa;margin:4px';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    const res = await fetch(IFRAME_CHILD_URL);
    const html = await res.text();
    doc.open();
    doc.write(html);
    doc.close();
    await waitForFrameReady(iframe);
    return iframe;
}

function sendChaosToFrame(iframe, technique) {
    return new Promise((resolve, reject) => {
        const requestId = `req-${Math.random().toString(36).slice(2)}`;
        const timer = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            reject(new Error('iframe-response-timeout'));
        }, IFRAME_RESPONSE_TIMEOUT_MS);

        function onMessage(event) {
            if (event.source !== iframe.contentWindow) return;
            const data = event.data || {};
            if (data.type !== 'chaos-result' || data.requestId !== requestId) return;
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            if (data.response && data.response.error) {
                reject(new Error(data.response.error));
            } else {
                resolve(data.response && data.response.value);
            }
        }
        window.addEventListener('message', onMessage);
        iframe.contentWindow.postMessage({ type: 'chaos-run', requestId, technique }, '*');
    });
}

/*
 * Chaos technique catalogue.
 *
 * Each technique runs exactly one mode of triggering a media-device API.
 * Keep run() side-effects bounded: stop any tracks, close any peer
 * connections, and remove any created iframes before returning.
 */

const TECHNIQUES = [
    // Group A — enumerateDevices() variants
    {
        id: 'A1',
        group: 'A',
        title: 'enumerateDevices() — single call',
        code: 'navigator.mediaDevices.enumerateDevices()',
        async run() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return { count: devices.length, kinds: devices.map((d) => d.kind) };
        },
    },
    {
        id: 'A2',
        group: 'A',
        title: 'enumerateDevices() x50 sequential',
        code: 'for (50) await enumerateDevices()',
        async run() {
            let last = 0;
            for (let i = 0; i < 50; i++) {
                last = (await navigator.mediaDevices.enumerateDevices()).length;
            }
            return { iterations: 50, lastCount: last };
        },
    },
    {
        id: 'A3',
        group: 'A',
        title: 'enumerateDevices() x50 parallel (Promise.all)',
        code: 'Promise.all([enumerateDevices() * 50])',
        async run() {
            const results = await Promise.all(Array.from({ length: 50 }, () => navigator.mediaDevices.enumerateDevices()));
            return { iterations: 50, lastCount: results[results.length - 1].length };
        },
    },
    {
        id: 'A4',
        group: 'A',
        title: 'enumerateDevices() from setTimeout(0)',
        code: 'setTimeout(() => enumerateDevices(), 0)',
        run: () => scheduledEnumerate((cb) => setTimeout(cb, 0)),
    },
    {
        id: 'A5',
        group: 'A',
        title: 'enumerateDevices() x10 from setInterval / 100ms',
        code: 'setInterval(() => enumerateDevices(), 100) x10',
        async run() {
            const pending = await new Promise((resolve, reject) => {
                const promises = [];
                const id = setInterval(() => {
                    try {
                        promises.push(navigator.mediaDevices.enumerateDevices());
                    } catch (e) {
                        clearInterval(id);
                        reject(e);
                        return;
                    }
                    if (promises.length >= 10) {
                        clearInterval(id);
                        resolve(promises);
                    }
                }, 100);
            });
            const settled = await Promise.allSettled(pending);
            const errors = settled.filter((s) => s.status === 'rejected').map((s) => describeError(s.reason));
            if (errors.length) throw new Error(errors.join(' | '));
            return { iterations: settled.length };
        },
    },
    {
        id: 'A6',
        group: 'A',
        title: 'enumerateDevices() from requestAnimationFrame',
        code: 'requestAnimationFrame(() => enumerateDevices())',
        run: () => scheduledEnumerate((cb) => requestAnimationFrame(cb)),
    },
    {
        id: 'A7',
        group: 'A',
        title: 'enumerateDevices() from MessageChannel callback',
        code: 'channel.port1.onmessage = () => enumerateDevices()',
        run: () => scheduledEnumerate((cb) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = cb;
            channel.port2.postMessage('go');
        }),
    },
    {
        id: 'A8',
        group: 'A',
        title: 'enumerateDevices() from queueMicrotask',
        code: 'queueMicrotask(() => enumerateDevices())',
        run: () => scheduledEnumerate((cb) => queueMicrotask(cb)),
    },
    {
        id: 'A9',
        group: 'A',
        title: 'devicechange subscription + enumerateDevices()',
        code: "mediaDevices.addEventListener('devicechange', ...); enumerateDevices()",
        async run() {
            const onChange = () => {};
            navigator.mediaDevices.addEventListener('devicechange', onChange);
            navigator.mediaDevices.ondevicechange = onChange;
            try {
                const d = await navigator.mediaDevices.enumerateDevices();
                return { count: d.length };
            } finally {
                navigator.mediaDevices.removeEventListener('devicechange', onChange);
                navigator.mediaDevices.ondevicechange = null;
            }
        },
    },
    {
        id: 'A10',
        group: 'A',
        title: 'enumerateDevices() + check for videoinput/audioinput/audiooutput (reCAPTCHA pattern)',
        code: "devices.some(d => d.kind === 'videoinput')",
        async run() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const kinds = devices.map((d) => d.kind);
            return {
                count: devices.length,
                hasVideoInput: kinds.includes('videoinput'),
                hasAudioInput: kinds.includes('audioinput'),
                hasAudioOutput: kinds.includes('audiooutput'),
                allLabelsEmpty: devices.every((d) => d.label === ''),
                allDeviceIdsEmpty: devices.every((d) => d.deviceId === ''),
            };
        },
    },
    {
        id: 'A11',
        group: 'A',
        title: 'enumerateDevices() x100 tight sync loop, fire-and-forget (DaveV repro)',
        code: 'for (let i = 0; i < 100; i++) navigator.mediaDevices.enumerateDevices();',
        async run() {
            const unhandled = [];
            const onUnhandled = (event) => {
                unhandled.push(describeError(event.reason));
                event.preventDefault();
            };
            window.addEventListener('unhandledrejection', onUnhandled);
            const before = performance.now();
            for (let i = 0; i < 100; i++) {
                navigator.mediaDevices.enumerateDevices();
            }
            const syncReturnMs = Math.round(performance.now() - before);
            await delay(2500);
            window.removeEventListener('unhandledrejection', onUnhandled);
            return {
                fired: 100,
                syncReturnMs,
                unhandledRejectionsAfter2_5s: unhandled.length,
                sampleUnhandled: unhandled.slice(0, 3),
                hint: unhandled.length > 0
                    ? 'Some calls rejected. Under the C-S-S deviceEnumerationFix the 2000ms native messaging timeout will fall back to the real enumerateDevices() — which is what triggers the OS prompt on Windows MSIX. Click this technique repeatedly to sustain the queue pressure.'
                    : 'No unhandled rejections seen. If the OS prompt still appeared, the trigger is likely upstream of the shim or in a native-side path.',
            };
        },
    },

    // Group B — getUserMedia probes (suspected actual trigger).
    // Each B technique stops the resulting stream immediately so the LED
    // does not stay on, but the OS prompt will fire on the *attempt*.
    {
        id: 'B1',
        group: 'B',
        title: 'getUserMedia({ video: true })',
        code: 'getUserMedia({ video: true })',
        async run() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            return { tracks: await stopStreamTracks(stream) };
        },
    },
    {
        id: 'B2',
        group: 'B',
        title: 'getUserMedia({ audio: true })',
        code: 'getUserMedia({ audio: true })',
        async run() {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return { tracks: await stopStreamTracks(stream) };
        },
    },
    {
        id: 'B3',
        group: 'B',
        title: 'getUserMedia({ video: true, audio: true })',
        code: 'getUserMedia({ video: true, audio: true })',
        async run() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            return { tracks: await stopStreamTracks(stream) };
        },
    },
    {
        id: 'B4',
        group: 'B',
        title: 'getUserMedia({ video: { facingMode: "user" } })',
        code: "getUserMedia({ video: { facingMode: 'user' } })",
        async run() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            return { tracks: await stopStreamTracks(stream) };
        },
    },
    {
        id: 'B5',
        group: 'B',
        title: 'getUserMedia with bogus exact deviceId',
        code: "getUserMedia({ video: { deviceId: { exact: 'nope' } } })",
        async run() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: 'nope-this-id-does-not-exist' } } });
            return { tracks: await stopStreamTracks(stream) };
        },
    },
    {
        id: 'B6',
        group: 'B',
        title: 'Legacy navigator.getUserMedia (callback form)',
        code: 'navigator.getUserMedia({ video: true }, cb, cb)',
        run() {
            return new Promise((resolve, reject) => {
                const legacy = navigator.getUserMedia
                    || navigator.webkitGetUserMedia
                    || navigator.mozGetUserMedia
                    || navigator.msGetUserMedia;
                if (typeof legacy !== 'function') {
                    reject(new Error('legacy-getUserMedia-unavailable'));
                    return;
                }
                legacy.call(
                    navigator,
                    { video: true },
                    async (stream) => resolve({ tracks: await stopStreamTracks(stream) }),
                    (err) => reject(err),
                );
            });
        },
    },
    {
        id: 'B7',
        group: 'B',
        title: 'getUserMedia x5 parallel',
        code: 'Promise.allSettled([getUserMedia(...) x5])',
        async run() {
            const results = await Promise.allSettled(
                Array.from({ length: 5 }, () => navigator.mediaDevices.getUserMedia({ video: true })),
            );
            const summaries = [];
            for (const r of results) {
                if (r.status === 'fulfilled') {
                    summaries.push({ ok: true, tracks: await stopStreamTracks(r.value) });
                } else {
                    summaries.push({ ok: false, error: describeError(r.reason) });
                }
            }
            return { results: summaries };
        },
    },
    {
        id: 'B8',
        group: 'B',
        title: 'Web Worker probe (mediaDevices availability + enumerateDevices + getUserMedia)',
        code: "new Worker(blob); self.navigator.mediaDevices?.enumerateDevices()",
        async run() {
            return runInWebWorker();
        },
    },

    // Group C — Permissions / supporting APIs
    {
        id: 'C1',
        group: 'C',
        title: "permissions.query({ name: 'camera' })",
        code: "navigator.permissions.query({ name: 'camera' })",
        async run() {
            const status = await navigator.permissions.query({ name: 'camera' });
            return { state: status.state };
        },
    },
    {
        id: 'C2',
        group: 'C',
        title: "permissions.query({ name: 'microphone' })",
        code: "navigator.permissions.query({ name: 'microphone' })",
        async run() {
            const status = await navigator.permissions.query({ name: 'microphone' });
            return { state: status.state };
        },
    },
    {
        id: 'C3',
        group: 'C',
        title: 'getSupportedConstraints()',
        code: 'navigator.mediaDevices.getSupportedConstraints()',
        run() {
            const c = navigator.mediaDevices.getSupportedConstraints();
            return Promise.resolve({ keys: Object.keys(c) });
        },
    },
    {
        id: 'C4',
        group: 'C',
        title: 'getDisplayMedia({ video: true })',
        code: 'navigator.mediaDevices.getDisplayMedia({ video: true })',
        async run() {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            return { tracks: await stopStreamTracks(stream) };
        },
    },
    {
        id: 'C5',
        group: 'C',
        title: 'getUserMedia + track.getCapabilities/Settings/Constraints',
        code: 'gum().then(s => s.getVideoTracks()[0].getCapabilities()/getSettings()/getConstraints())',
        async run() {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            try {
                const track = stream.getVideoTracks()[0];
                const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : null;
                const settings = typeof track.getSettings === 'function' ? track.getSettings() : null;
                const constraints = typeof track.getConstraints === 'function' ? track.getConstraints() : null;
                return {
                    capabilityKeys: capabilities ? Object.keys(capabilities) : null,
                    settingKeys: settings ? Object.keys(settings) : null,
                    constraintKeys: constraints ? Object.keys(constraints) : null,
                };
            } finally {
                await stopStreamTracks(stream);
            }
        },
    },

    // Group D — RTCPeerConnection (often used in fingerprinting / WebRTC ICE)
    {
        id: 'D1',
        group: 'D',
        title: 'new RTCPeerConnection() + close()',
        code: 'new RTCPeerConnection(); pc.close()',
        async run() {
            const pc = new RTCPeerConnection();
            const ok = { connectionState: pc.connectionState, iceConnectionState: pc.iceConnectionState };
            pc.close();
            return ok;
        },
    },
    {
        id: 'D2',
        group: 'D',
        title: 'pc.createOffer({ offerToReceiveVideo, offerToReceiveAudio })',
        code: 'pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })',
        async run() {
            const pc = new RTCPeerConnection();
            try {
                const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
                return { sdpType: offer.type, sdpLength: offer.sdp.length };
            } finally {
                pc.close();
            }
        },
    },
    {
        id: 'D3',
        group: 'D',
        title: 'pc.addTransceiver("video", recvonly)',
        code: "pc.addTransceiver('video', { direction: 'recvonly' })",
        async run() {
            const pc = new RTCPeerConnection();
            try {
                const tx = pc.addTransceiver('video', { direction: 'recvonly' });
                return { direction: tx.direction, kind: tx.receiver.track ? tx.receiver.track.kind : null };
            } finally {
                pc.close();
            }
        },
    },
    {
        id: 'D4',
        group: 'D',
        title: 'Full WebRTC ICE-leak pattern (LinkedIn first-party getIPs)',
        code: "new RTCPeerConnection({iceServers}); createDataChannel(); createOffer(); setLocalDescription(); collect candidates 3s",
        async run() {
            return collectIceCandidates(3000);
        },
    },

    // Group E — iframe contexts. Each runs A1 (enumerateDevices) then B1
    // (getUserMedia) inside a different iframe variant. Same-origin only —
    // a cross-origin variant already exists at features/iframe-media-prompt.html.
    {
        id: 'E1',
        group: 'E',
        title: 'Regular same-origin iframe — A1 + B1',
        code: '<iframe src="iframe-child.html" allow="camera; microphone">',
        async run() {
            const iframe = await makeIframeFromSrc();
            try {
                const a = await sendChaosToFrame(iframe, 'A1');
                let b = null;
                let bError = null;
                try {
                    b = await sendChaosToFrame(iframe, 'B1');
                } catch (e) {
                    bError = describeError(e);
                }
                return { a, b, bError };
            } finally {
                iframe.remove();
            }
        },
    },
    {
        id: 'E2',
        group: 'E',
        title: 'Sandboxed same-origin iframe — A1 + B1',
        code: 'sandbox="allow-scripts allow-same-origin"',
        async run() {
            const iframe = await makeIframeFromSrc({ sandbox: 'allow-scripts allow-same-origin' });
            try {
                const a = await sendChaosToFrame(iframe, 'A1');
                let b = null;
                let bError = null;
                try {
                    b = await sendChaosToFrame(iframe, 'B1');
                } catch (e) {
                    bError = describeError(e);
                }
                return { a, b, bError };
            } finally {
                iframe.remove();
            }
        },
    },
    {
        id: 'E3',
        group: 'E',
        title: 'srcdoc iframe — A1 + B1',
        code: '<iframe srcdoc="...">',
        async run() {
            const res = await fetch(IFRAME_CHILD_URL);
            const html = await res.text();
            const iframe = await makeIframeSrcdoc(html);
            try {
                const a = await sendChaosToFrame(iframe, 'A1');
                let b = null;
                let bError = null;
                try {
                    b = await sendChaosToFrame(iframe, 'B1');
                } catch (e) {
                    bError = describeError(e);
                }
                return { a, b, bError };
            } finally {
                iframe.remove();
            }
        },
    },
    {
        id: 'E4',
        group: 'E',
        title: 'document.write iframe — A1 + B1',
        code: 'doc.open(); doc.write(html); doc.close()',
        async run() {
            const iframe = await makeIframeDocumentWrite();
            try {
                const a = await sendChaosToFrame(iframe, 'A1');
                let b = null;
                let bError = null;
                try {
                    b = await sendChaosToFrame(iframe, 'B1');
                } catch (e) {
                    bError = describeError(e);
                }
                return { a, b, bError };
            } finally {
                iframe.remove();
            }
        },
    },
    {
        id: 'E5',
        group: 'E',
        title: 'Iframe inserted 3s after click — A1 + B1',
        code: 'await delay(3000); insert iframe; run',
        async run() {
            await delay(3000);
            const iframe = await makeIframeFromSrc();
            try {
                const a = await sendChaosToFrame(iframe, 'A1');
                let b = null;
                let bError = null;
                try {
                    b = await sendChaosToFrame(iframe, 'B1');
                } catch (e) {
                    bError = describeError(e);
                }
                return { a, b, bError };
            } finally {
                iframe.remove();
            }
        },
    },
    {
        id: 'E6',
        group: 'E',
        title: 'Hidden (display:none) iframe — A1 + B1',
        code: 'iframe.style.display = "none"',
        async run() {
            const iframe = await makeIframeFromSrc({ style: 'display:none' });
            try {
                const a = await sendChaosToFrame(iframe, 'A1');
                let b = null;
                let bError = null;
                try {
                    b = await sendChaosToFrame(iframe, 'B1');
                } catch (e) {
                    bError = describeError(e);
                }
                return { a, b, bError };
            } finally {
                iframe.remove();
            }
        },
    },

    // Group F — Macro sequences (compositions of other techniques).
    // The runner records each constituent in its own row alongside the macro,
    // so the tester can see which step within the sequence triggered the prompt.
    {
        id: 'F0',
        group: 'F',
        title: 'PerimeterX-style probe sequence (C1 → C2 → B5 → B1)',
        code: "permissions.query({name:'camera'}); permissions.query({name:'microphone'}); getUserMedia({deviceId:{exact:'nope'}}); getUserMedia({video:true})",
        async run() {
            const steps = ['C1', 'C2', 'B5', 'B1'];
            const results = [];
            for (const step of steps) {
                const entry = await runSingle(step);
                results.push({ id: step, ok: entry && entry.ok, error: entry && entry.error, value: entry && entry.value });
                await delay(300);
            }
            return { steps: results };
        },
    },
];

const GROUPS = [
    { id: 'A', title: 'A — enumerateDevices() variants', description: 'Directly probe MediaDevices.enumerateDevices() across call shapes and event-loop contexts.' },
    { id: 'B', title: 'B — getUserMedia() probes', description: 'Direct media-stream requests. These will legitimately prompt for camera/mic on any browser; the question for OPS-7378 is whether they ALSO surface the Windows OS prompt above the in-app prompt.' },
    { id: 'C', title: 'C — Permissions and supporting APIs', description: 'Permissions API + adjacent MediaDevices APIs (getSupportedConstraints, getDisplayMedia, MediaStreamTrack.getCapabilities).' },
    { id: 'D', title: 'D — RTCPeerConnection', description: 'WebRTC paths commonly used for fingerprinting (offer/transceiver creation, full ICE-leak pattern).' },
    { id: 'E', title: 'E — Iframe contexts (same-origin)', description: 'Same-origin iframe variants run A1+B1 inside an embedded document. A cross-origin variant already exists at features/iframe-media-prompt.html.' },
    { id: 'F', title: 'F — Macro sequences', description: 'Compositions of other techniques. Each constituent records into its own row in the catalogue above, so the tester can see which step within the sequence triggered the prompt.' },
];

function renderTechniques() {
    for (const group of GROUPS) {
        const groupTechs = TECHNIQUES.filter((t) => t.group === group.id);
        const section = document.createElement('section');
        section.className = 'group';

        const header = document.createElement('div');
        header.className = 'group-header';
        const h3 = document.createElement('h3');
        h3.textContent = group.title;
        const p = document.createElement('p');
        p.textContent = group.description;
        header.appendChild(h3);
        header.appendChild(p);
        section.appendChild(header);

        for (const tech of groupTechs) {
            const row = document.createElement('div');
            row.className = 'tech-row';
            row.id = `row-${tech.id}`;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tech-button';
            button.textContent = `Run ${tech.id}`;
            button.dataset.techniqueId = tech.id;
            button.addEventListener('click', () => runSingle(tech.id));

            const meta = document.createElement('div');
            meta.className = 'tech-meta';
            const titleEl = document.createElement('strong');
            titleEl.textContent = tech.title;
            const codeEl = document.createElement('code');
            codeEl.textContent = tech.code;
            meta.appendChild(titleEl);
            meta.appendChild(codeEl);

            const status = document.createElement('div');
            status.className = 'tech-status';
            status.dataset.state = 'idle';
            status.textContent = 'idle';
            status.id = `status-${tech.id}`;

            const promptSelect = document.createElement('select');
            promptSelect.className = 'tech-prompt';
            promptSelect.id = `prompt-${tech.id}`;
            for (const opt of [
                ['not-answered', 'OS prompt? (not answered)'],
                ['yes', 'Yes — OS prompt appeared'],
                ['no', 'No prompt'],
                ['in-browser-only', 'In-browser prompt only'],
                ['already-granted', 'Already granted'],
                ['already-denied', 'Already denied'],
            ]) {
                const o = document.createElement('option');
                o.value = opt[0];
                o.textContent = opt[1];
                promptSelect.appendChild(o);
            }
            promptSelect.addEventListener('change', () => {
                if (!state.results[tech.id]) state.results[tech.id] = {};
                state.results[tech.id].osPromptObserved = promptSelect.value;
            });

            row.appendChild(button);
            row.appendChild(meta);
            row.appendChild(status);
            row.appendChild(promptSelect);
            section.appendChild(row);
        }

        techniquesEl.appendChild(section);
    }
}

function setStatus(techId, stateName, text) {
    const el = document.getElementById(`status-${techId}`);
    if (!el) return;
    el.dataset.state = stateName;
    el.textContent = text;
}

function setButtonsDisabled(disabled) {
    for (const btn of document.querySelectorAll('.tech-button')) {
        btn.disabled = disabled;
    }
}

async function runSingle(techId) {
    const tech = TECHNIQUES.find((t) => t.id === techId);
    if (!tech) return null;

    setStatus(techId, 'running', 'running...');
    log(`${techId} start: ${tech.title}`);

    const started = performance.now();
    const entry = {
        id: techId,
        title: tech.title,
        startedAt: new Date().toISOString(),
        osPromptObserved: state.results[techId]?.osPromptObserved ?? 'not-answered',
    };

    try {
        const value = await tech.run();
        entry.ok = true;
        entry.value = value;
        entry.durationMs = Math.round(performance.now() - started);
        setStatus(techId, 'ok', `ok (${entry.durationMs}ms)`);
        log(`${techId} ok`, value);
    } catch (err) {
        entry.ok = false;
        entry.error = describeError(err);
        entry.durationMs = Math.round(performance.now() - started);
        setStatus(techId, 'error', entry.error);
        log(`${techId} error`, entry.error);
    }

    state.results[techId] = { ...(state.results[techId] || {}), ...entry };
    return entry;
}

async function unleashAll() {
    setButtonsDisabled(true);
    unleashButton.disabled = true;
    const total = TECHNIQUES.length;
    let i = 0;
    log(`Unleash chaos: running ${total} techniques`);
    for (const tech of TECHNIQUES) {
        i++;
        unleashProgress.textContent = `Running ${i} / ${total}: ${tech.id}`;
        await runSingle(tech.id);
        await delay(150);
    }
    unleashProgress.textContent = `Done — ran ${total} techniques.`;
    log('Unleash chaos: complete');
    setButtonsDisabled(false);
    unleashButton.disabled = false;
    logEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadResults() {
    state.overallPromptObserved = overallPromptSelect.value;
    state.finishedAt = new Date().toISOString();
    state.diagnosticsAtDownload = collectDiagnostics();
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-enumeration-chaos-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function resetResults() {
    state.results = {};
    state.overallPromptObserved = 'not-answered';
    overallPromptSelect.value = 'not-answered';
    unleashProgress.textContent = '';
    logEl.textContent = '';
    for (const tech of TECHNIQUES) {
        setStatus(tech.id, 'idle', 'idle');
        const p = document.getElementById(`prompt-${tech.id}`);
        if (p) p.value = 'not-answered';
    }
    log('State reset');
}

function renderDiagnostics() {
    const dl = document.getElementById('diagnostic-list');
    for (const [key, value] of Object.entries(state.diagnostics)) {
        const dt = document.createElement('dt');
        dt.textContent = key;
        const dd = document.createElement('dd');
        dd.textContent = typeof value === 'string' ? value : JSON.stringify(value);
        dl.appendChild(dt);
        dl.appendChild(dd);
    }
}

unleashButton.addEventListener('click', () => {
    confirmDialog.showModal();
});
confirmGoButton.addEventListener('click', () => {
    confirmDialog.close();
    unleashAll();
});
confirmCancelButton.addEventListener('click', () => confirmDialog.close());
downloadButton.addEventListener('click', downloadResults);
resetButton.addEventListener('click', resetResults);
overallPromptSelect.addEventListener('change', () => {
    state.overallPromptObserved = overallPromptSelect.value;
});

function renderEnvironmentWarnings() {
    const warnings = [];
    if (!navigator.mediaDevices) {
        warnings.push(
            'navigator.mediaDevices is undefined on this page. Most techniques will fail with TypeError. '
            + 'This usually means the page is not running in a secure context (HTTPS or localhost). '
            + 'Try opening the page over HTTPS, or via the privacy-test-pages site rather than a plain IP.',
        );
    }
    if (!window.isSecureContext) {
        warnings.push('isSecureContext is false — media-device APIs may be unavailable or behave unexpectedly.');
    }
    if (!warnings.length) return;
    const warningEl = document.getElementById('environment-warnings');
    warningEl.hidden = false;
    for (const text of warnings) {
        const p = document.createElement('p');
        p.textContent = text;
        warningEl.appendChild(p);
    }
}

renderDiagnostics();
renderEnvironmentWarnings();
renderTechniques();
log(`Ready — ${TECHNIQUES.length} techniques loaded.`);
