/**
 * Live detectorPerf stats overlay for manual testing.
 *
 * Listens for the `detectorPerfDebugStats` CustomEvent that the C-S-S
 * detectorPerf feature broadcasts after every recorded detector run — but
 * only on builds where the platform sets the debug flag. On production
 * builds the event never fires and the overlay stays in its waiting state.
 *
 * The event detail is a JSON string (primitives cross isolated-world
 * boundaries on all platforms) with the shape:
 *   { combinedTotalMs, detectors: { [id]: { runs, totalMs, worstMs } },
 *     severe: [{ kind, detector, thresholdMs }], lastRun }
 */
(function initDetectorPerfOverlay() {
    const panel = document.createElement('div');
    panel.id = 'detector-perf-overlay';
    panel.style.cssText = [
        'position:fixed',
        'right:8px',
        'bottom:8px',
        'z-index:2147483647',
        'max-width:340px',
        'max-height:45vh',
        'overflow:auto',
        'background:rgba(20,20,24,0.92)',
        'color:#e8e8e8',
        'font:11px/1.45 ui-monospace,Menlo,monospace',
        'padding:8px 10px',
        'border-radius:6px',
        'box-shadow:0 2px 10px rgba(0,0,0,0.4)',
        'pointer-events:none',
        'white-space:pre',
    ].join(';');
    panel.textContent =
        'detectorPerf: waiting for debug events…\n' + '(requires a debug build with the\n detectorPerf feature enabled)';

    function attach() {
        document.body.appendChild(panel);
    }
    if (document.body) {
        attach();
    } else {
        document.addEventListener('DOMContentLoaded', attach);
    }

    let updates = 0;

    window.addEventListener('detectorPerfDebugStats', (event) => {
        let payload;
        try {
            payload = JSON.parse(event.detail);
        } catch (e) {
            panel.textContent = 'detectorPerf: unparseable event detail';
            return;
        }
        updates += 1;

        const lines = [];
        lines.push(`detectorPerf @ ${location.host || 'this frame'} (update #${updates})`);
        lines.push(`combined total: ${payload.combinedTotalMs} ms`);
        lines.push('');

        const names = Object.keys(payload.detectors || {}).sort();
        if (names.length === 0) {
            lines.push('no detector runs yet');
        } else {
            lines.push('detector            runs  total   worst');
            for (const name of names) {
                const stats = payload.detectors[name];
                lines.push(
                    `${name.slice(0, 19).padEnd(19)} ${String(stats.runs).padStart(4)} ${String(stats.totalMs).padStart(6)} ${String(stats.worstMs).padStart(7)}`
                );
            }
        }

        if (payload.severe && payload.severe.length > 0) {
            lines.push('');
            lines.push('SEVERE crossings:');
            for (const entry of payload.severe) {
                lines.push(`  ${entry.kind} ${entry.detector} >${entry.thresholdMs}ms`);
            }
        }

        if (payload.lastRun) {
            lines.push('');
            lines.push(`last: ${payload.lastRun.attributed} ${payload.lastRun.durationMs}ms`);
        }

        panel.textContent = lines.join('\n');
    });
})();
