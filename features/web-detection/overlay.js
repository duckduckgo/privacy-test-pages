/**
 * Detections panel for the web detection test pages.
 *
 * - Page measures: what the page measured itself, from the performance timeline and the DOM.
 * - Web events: the `webEventDebug` CustomEvent, a copy of each web event the C-S-S webEvents
 *   feature sends, with detail `JSON.stringify({ type, data })`.
 * - Breakage report: the `breakageReportDebug` CustomEvent, with detail
 *   `JSON.stringify({ source, result, breakageData })`. `source` is `report` for a report the browser
 *   asked for, and `request` for an answer to the `breakageReportDebugRequest` event this panel
 *   dispatches.
 *
 * C-S-S dispatches both events only when the platform sets its debug flag.
 *
 * - Debug: the tab's debug flag, read and changed through the `ddgExtensionDebugRequest` event, with
 *   detail `JSON.stringify({ action })` for `get`, `enable` or `disable`. The extension answers with
 *   `ddgExtensionDebugResponse`, detail `JSON.stringify({ available, enabled, devtools })`; developer
 *   builds act on `enable` and `disable` and reload the tab, release builds answer
 *   `{ available: false }`. Other browsers set the flag in their own debug settings.
 *
 * The panel lives in a closed shadow root on a host outside <body>, so detectors that read the
 * page's text do not see it. Closed, it is a transparent square that shows only under the pointer,
 * so the page's first paint is its own; opening it paints text and covers part of the viewport. The
 * script removes its own element, so the page holds one element more than without the panel.
 *
 * `?nooverlay` on the page URL leaves the panel out. `data-measures="off"` on the script tag leaves
 * out the page measures.
 */
(function initDetectionsPanel () {
    const showMeasures = document.currentScript?.dataset.measures !== 'off';
    document.currentScript?.remove();
    if (new URLSearchParams(location.search).has('nooverlay')) return;

    const REQUEST_TIMEOUT_MS = 5000;

    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:2147483647;pointer-events:none';
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `
<style>
  :host { all: initial; }
  * { box-sizing: border-box; }
  .panel { font: 11px/1.45 ui-monospace, Menlo, monospace; color: #e8e8e8; border-radius: 6px; }
  .panel.open { background: rgba(20, 20, 24, 0.94); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4); }
  button { font: inherit; color: inherit; background: #33343a; border: 1px solid #55565e; border-radius: 4px;
    padding: 2px 8px; cursor: pointer; pointer-events: auto; }
  .toggle { display: block; width: 18px; height: 18px; margin-left: auto; padding: 0; border: 0; background: transparent; }
  .toggle:hover, .toggle:focus-visible { background: #6b6c74; }
  .toggle.events:hover, .toggle.events:focus-visible { background: #3fb950; }
  .panel.open .toggle { width: 100%; height: auto; text-align: left; background: transparent; padding: 6px 10px; }
  .body { display: none; width: min(380px, calc(100vw - 16px)); max-height: 55vh; overflow: auto; padding: 0 10px 10px;
    pointer-events: auto; }
  .panel.open .body { display: block; }
  h2 { font: inherit; font-weight: bold; color: #9ecbff; margin: 10px 0 4px; }
  pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
  .muted { color: #9a9aa2; }
  .row { display: flex; gap: 6px; margin: 4px 0; }
</style>
<div class="panel">
  <button class="toggle" type="button"></button>
  <div class="body">
    <h2>Debug</h2>
    <pre class="debug-out muted">Asking the browser…</pre>
    <div class="row"><button class="debug-toggle" type="button" hidden></button></div>
    <section class="measures">
      <h2>Page measures</h2>
      <pre class="measures-out"></pre>
    </section>
    <h2>Web events</h2>
    <pre class="events-out muted">Waiting for debug events (needs a build with the content-scope-scripts debug flag on).</pre>
    <h2>Breakage report</h2>
    <div class="row">
      <button class="collect" type="button">Collect report data</button>
      <button class="copy" type="button" disabled>Copy JSON</button>
    </div>
    <pre class="report-out muted">Collect report data, or send a breakage report from the browser.</pre>
  </div>
</div>`;

    const panel = root.querySelector('.panel');
    const toggle = root.querySelector('.toggle');
    const measuresOut = root.querySelector('.measures-out');
    const eventsOut = root.querySelector('.events-out');
    const reportOut = root.querySelector('.report-out');
    const collectButton = root.querySelector('.collect');
    const copyButton = root.querySelector('.copy');
    const debugOut = root.querySelector('.debug-out');
    const debugButton = root.querySelector('.debug-toggle');
    if (!showMeasures) root.querySelector('.measures').remove();

    const events = [];
    let lastReport = null;
    let requestTimer = null;

    function seconds (ms) {
        return `${(ms / 1000).toFixed(1)}s`;
    }

    function renderToggle () {
        const last = events.length > 0 ? `, last ${events[events.length - 1].type}` : '';
        const summary = `detections: ${events.length} web event${events.length === 1 ? '' : 's'}${last}`;
        toggle.classList.toggle('events', events.length > 0);
        toggle.setAttribute('aria-label', summary);
        // Text only while open: closed, the panel paints no text
        toggle.textContent = panel.classList.contains('open') ? `▾ ${summary}` : '';
    }

    toggle.addEventListener('click', () => {
        panel.classList.toggle('open');
        renderToggle();
    });

    // Page measures

    const measures = { fcp: null, failed: [], resourceStatus: null, firstInput: null, longTasks: [] };

    function observe (type, onEntries) {
        if (typeof PerformanceObserver === 'undefined' || !PerformanceObserver.supportedEntryTypes?.includes(type)) return false;
        new PerformanceObserver((list) => onEntries(list.getEntries())).observe({ type, buffered: true });
        return true;
    }

    function brokenImages () {
        let broken = 0;
        let total = 0;
        for (const img of document.images) {
            total += 1;
            if (img.complete && img.naturalWidth === 0) broken += 1;
        }
        return `${broken} of ${total}`;
    }

    function renderMeasures () {
        if (!showMeasures) return;
        const nav = performance.getEntriesByType('navigation')[0];
        const lines = [];
        if (nav) {
            lines.push(`status            ${nav.responseStatus ?? 'not exposed'}`);
            lines.push(`time to 1st byte  ${seconds(nav.responseStart)}`);
            lines.push(`load end          ${nav.loadEventEnd > 0 ? seconds(nav.loadEventEnd) : 'not yet'}`);
        }
        lines.push(`1st contentful    ${measures.fcp === null ? 'not yet' : seconds(measures.fcp)}`);
        lines.push(`broken images     ${brokenImages()}`);
        if (measures.resourceStatus === false) {
            lines.push('failed resources  responseStatus not exposed');
        } else {
            lines.push(`failed resources  ${measures.failed.length}`);
            for (const entry of measures.failed) {
                lines.push(`  ${entry.responseStatus} ${entry.initiatorType} ${new URL(entry.name).pathname.split('/').pop()}${new URL(entry.name).search}`);
            }
        }
        if (measures.firstInput) {
            const input = measures.firstInput;
            lines.push(`first input       ${input.name} at ${seconds(input.startTime)}, delay ${Math.round(input.processingStart - input.startTime)} ms`);
        } else {
            lines.push('first input       none yet');
        }
        if (measures.longTasks === null) {
            lines.push('long tasks        not exposed');
        } else {
            const total = measures.longTasks.reduce((sum, task) => sum + task.duration, 0);
            lines.push(`long tasks        ${measures.longTasks.length}, ${Math.round(total)} ms in all`);
        }
        measuresOut.textContent = lines.join('\n');
    }

    if (showMeasures) {
        observe('paint', (entries) => {
            const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
            if (fcp) measures.fcp = fcp.startTime;
            renderMeasures();
        });
        observe('resource', (entries) => {
            for (const entry of entries) {
                if (!('responseStatus' in entry)) {
                    measures.resourceStatus = false;
                } else if (entry.responseStatus >= 400) {
                    measures.failed.push(entry);
                }
            }
            renderMeasures();
        });
        observe('first-input', (entries) => {
            measures.firstInput = entries[0];
            renderMeasures();
        });
        if (!observe('longtask', (entries) => {
            measures.longTasks.push(...entries);
            renderMeasures();
        })) {
            measures.longTasks = null;
        }
        // Load end and broken images have no observer
        const started = performance.now();
        const timer = setInterval(() => {
            renderMeasures();
            if (performance.now() - started > 60000) clearInterval(timer);
        }, 1000);
        renderMeasures();
    }

    // Web events

    window.addEventListener('webEventDebug', (event) => {
        let parsed;
        try {
            parsed = JSON.parse(event.detail);
        } catch {
            parsed = { type: '(unparseable detail)', data: {} };
        }
        events.push({ at: performance.now(), type: parsed.type, data: parsed.data });
        eventsOut.classList.remove('muted');
        eventsOut.textContent = events
            .map((e) => `+${seconds(e.at)} ${e.type}${e.data && Object.keys(e.data).length > 0 ? ` ${JSON.stringify(e.data)}` : ''}`)
            .join('\n');
        renderToggle();
    });

    // Breakage report

    window.addEventListener('breakageReportDebug', (event) => {
        clearTimeout(requestTimer);
        collectButton.disabled = false;
        try {
            lastReport = JSON.parse(event.detail);
        } catch {
            reportOut.textContent = 'Unparseable report detail.';
            return;
        }
        const { source, result, breakageData } = lastReport;
        const lines = [`${source === 'request' ? 'Collected' : 'Report sent'} at +${seconds(performance.now())}`];
        const entries = breakageData?.webDetection ?? [];
        lines.push('', `webDetection: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`);
        for (const entry of entries) {
            lines.push(JSON.stringify(entry, null, 2));
        }
        if (breakageData?.detectorData) lines.push('', 'detectorData:', JSON.stringify(breakageData.detectorData, null, 2));
        if (breakageData?.detectorPerf) lines.push('', 'detectorPerf:', JSON.stringify(breakageData.detectorPerf, null, 2));
        const { breakageData: _encoded, ...rest } = result ?? {};
        lines.push('', 'other report values:', JSON.stringify(rest, null, 2));
        reportOut.classList.remove('muted');
        reportOut.textContent = lines.join('\n');
        copyButton.disabled = false;
    });

    collectButton.addEventListener('click', () => {
        collectButton.disabled = true;
        reportOut.classList.add('muted');
        reportOut.textContent = 'Collecting…';
        requestTimer = setTimeout(() => {
            collectButton.disabled = false;
            reportOut.textContent = 'No answer. This build does not have the content-scope-scripts debug flag on, or breakage reporting is off for this site.';
        }, REQUEST_TIMEOUT_MS);
        window.dispatchEvent(new CustomEvent('breakageReportDebugRequest'));
    });

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(lastReport, null, 2));
            copyButton.textContent = 'Copied';
        } catch {
            copyButton.textContent = 'Copy failed';
        }
        setTimeout(() => { copyButton.textContent = 'Copy JSON'; }, 1500);
    });

    // Debug flag

    const DEBUG_ANSWER_TIMEOUT_MS = 2000;
    let debugTimer = null;
    let debugAnswered = false;
    let reloading = false;

    function showDebug (text, action) {
        debugOut.classList.remove('muted');
        debugOut.textContent = text;
        debugButton.hidden = !action;
        if (action) {
            debugButton.dataset.action = action;
            debugButton.textContent = action === 'enable' ? 'Turn on debug for this tab' : 'Turn off debug for this tab';
        }
    }

    function askDebug (action) {
        clearTimeout(debugTimer);
        debugTimer = setTimeout(() => {
            if (!debugAnswered) showDebug('No answer from the browser: turn on the content-scope-scripts debug flag in the browser.');
        }, DEBUG_ANSWER_TIMEOUT_MS);
        window.dispatchEvent(new CustomEvent('ddgExtensionDebugRequest', { detail: JSON.stringify({ action }) }));
    }

    window.addEventListener('ddgExtensionDebugResponse', (event) => {
        let state;
        try {
            state = JSON.parse(event.detail);
        } catch {
            return;
        }
        debugAnswered = true;
        clearTimeout(debugTimer);
        if (reloading) return;
        if (!state.available) {
            showDebug("This build turns debug on only from the extension's devtools page: open it for this tab, then reload.");
        } else if (state.devtools) {
            showDebug("Debug is on: the extension's devtools page is connected to this tab.");
        } else if (state.enabled) {
            showDebug('Debug is on for this tab.', 'disable');
        } else {
            showDebug('Debug is off.', 'enable');
        }
    });

    debugButton.addEventListener('click', () => {
        reloading = true;
        showDebug('Reloading…');
        askDebug(debugButton.dataset.action);
    });

    // A debug event means the flag is on, whichever setting turned it on
    for (const type of ['webEventDebug', 'breakageReportDebug']) {
        window.addEventListener(type, () => {
            if (!debugAnswered && !reloading) showDebug('Debug is on.');
            debugAnswered = true;
        });
    }

    askDebug('get');
    renderToggle();
    document.documentElement.appendChild(host);
})();
