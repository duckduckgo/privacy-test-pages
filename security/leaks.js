window.addEventListener('load', async () => {
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
            const proplist = [];
            for (const prop in obj) {
                proplist.push(prop);
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

    window.collectedProps = collectProps();

    async function run () {
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
    }

    document.querySelector('#run').addEventListener('click', run);
    if (document.location.hash) {
        document.querySelector('#browser-select').value = document.location.hash.slice(1);
        run();
    }
});
