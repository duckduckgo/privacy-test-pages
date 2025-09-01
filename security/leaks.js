window.addEventListener('load', async () => {
    const downloadButton = document.getElementById('download');
    const sections = {};
    ['added', 'removed', 'changed'].forEach((s) => {
        sections[s] = document.getElementById(s);
    });

    function addBullet (html, section) {
        const li = document.createElement('li');
        li.innerHTML = html;
        sections[section].appendChild(li);
    }

    function collectProps () {
        const objCache = new Set();
        // skip these
        objCache.add(window.self);
        // prevent us decending into the DOM
        objCache.add(document);
        objCache.add(document.activeElement);
        objCache.add(event?.currentTarget);
        const recursionAllowed = new Set();
        recursionAllowed.add('navigator');

        function extractObjectProps (obj, breadcrumbs = [], depth = 0) {
            if (depth >= 5) {
                return {};
            }
            const props = {};
            const proplist = Object.getOwnPropertyNames(obj);
            for (const prop in obj) {
              if (!proplist.includes(prop)) {
                proplist.push(prop);
              }
            }
            proplist.sort().forEach((prop) => {
                try {
                    const desc = Object.getOwnPropertyDescriptor(obj, prop) || {};
                    desc.type = typeof obj[prop];
                    if (desc.type === 'function') {
                        desc.value = obj[prop].toString();
                    } else if (desc.type === 'object') {
                        if (!objCache.has(obj[prop]) || recursionAllowed.has(prop)) {
                            objCache.add(obj[prop]);
                            desc.properties = extractObjectProps(obj[prop], [...breadcrumbs, prop], depth + 1);
                        }
                        delete desc.value;
                    }
                    props[prop] = desc;
                } catch (e) {
                    console.warn(`Error for ${breadcrumbs.join('.')}.${prop}`, e);
                }
            });
            return props;
        }

        return {
            window: extractObjectProps(window)
        };
    }

    async function run() {
        delete window.collectedProps;
        window.collectedProps = collectProps();
        // clear results
        Object.keys(sections).forEach((s) => {
            const ul = sections[s];
            while (ul.firstChild !== null) {
                ul.removeChild(ul.firstChild);
            }
        });

        const engine =
      document.querySelector('#browser-select').value;
        const platformExpected = await (await fetch(`./browser-profiles/${engine}.json`)).json();
        const results = window.results = {
            page: 'security-js-leaks',
            date: (new Date()).toUTCString(),
            reference_engine: engine,
            added: [],
            removed: [],
            changed: []
        };

        function compareObjects (expected, actual, breadcrumbs) {
            Object.keys(actual).forEach((k) => {
                const exp = expected[k];
                if (!exp) {
                    addBullet(`
                        <details>
                            <summary>new property <code>${breadcrumbs.join('.')}.${k}</code></summary>
                            <code>${JSON.stringify(actual[k], null, 2)}</code>
                        </details>
                    `, 'added');
                    results.added.push({
                        name: `${breadcrumbs.join('.')}.${k}`,
                        ...actual[k]
                    });
                    return;
                }
                const changed = ['configurable', 'enumerable', 'writable', 'type', 'value'].filter(attr => actual[k][attr] !== exp[attr]);
                if (changed.length === 1) {
                    addBullet(`
                        <details>
                            <summary><code>${breadcrumbs.join('.')}.${k}</code> changed ${changed.join(', ')}</summary>
                            <ul>
                                <li>Expected: <code>${JSON.stringify(exp[changed[0]], null, 2)}</code></li>
                                <li>Actual: <code>${JSON.stringify(actual[k][changed[0]], null, 2)}</code></li>
                            </ul>
                        </details>`, 'changed');
                    results.changed.push({
                        name: `${breadcrumbs.join('.')}.${k}`,
                        ...actual[k]
                    });
                } else if (changed.length > 0) {
                    addBullet(`
                        <details>
                            <summary><code>${breadcrumbs.join('.')}.${k}</code> changed ${changed.join(', ')}</summary>
                            <ul>
                                <li>Expected: <code>${JSON.stringify(exp, null, 2)}</code></li>
                                <li>Actual: <code>${JSON.stringify(actual[k], null, 2)}</code></li>
                            </ul>
                        </details>`, 'changed');
                    results.changed.push({
                        name: `${breadcrumbs.join('.')}.${k}`,
                        ...actual[k]
                    });
                }

                if (actual[k].properties) {
                    if (!exp.properties) {
                        addBullet(`
                        <details>
                            <summary><code>${breadcrumbs.join('.')}.${k}</code> changed</summary>
                            <ul>
                                <li>Expected: <code>${JSON.stringify(exp, null, 2)}</code></li>
                                <li>Actual: <code>${JSON.stringify(actual[k], null, 2)}</code></li>
                            </ul>
                        </details>`, 'changed');
                        results.changed.push({
                            name: `${breadcrumbs.join('.')}.${k}`,
                            ...actual[k]
                        });
                    } else {
                        compareObjects(exp.properties, actual[k].properties, [
                            ...breadcrumbs,
                            k
                        ]);
                    }
                }
            });
            Object.keys(expected).forEach((k) => {
                if (!actual[k]) {
                    addBullet(`
                        <details>
                            <summary>mising property <code>${breadcrumbs.join('.')}.${k}</code></summary>
                            <code>${JSON.stringify(expected[k], null, 2)}</code>
                        </details>
                    `, 'removed');
                    results.removed.push({
                        name: `${breadcrumbs.join('.')}.${k}`
                    });
                }
            });
        }

        compareObjects(platformExpected.window, window.collectedProps.window, ['window']);
        downloadButton.removeAttribute('disabled');
    }

    document.querySelector('#run').addEventListener('click', run);
    if (document.location.hash) {
        document.querySelector('#browser-select').value = document.location.hash.slice(1);
        run();
    }

    function download (data, name) {
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(new Blob([data], { type: 'application/json' }));
        a.href = url;
        a.download = `${name}.json`;

        document.getElementById('debug').appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        a.remove();
    }

    downloadButton.addEventListener('click', () => {
        download(JSON.stringify(window.results, null, 2), 'results');
    });
    document.getElementById('profile-download').addEventListener('click', () => {
        download(JSON.stringify(window.collectedProps, null, 2), 'profile');
    });
});
