/**
 * @typedef {Record} ResultRow
 * @property {string} name The name of the test.
 * @property {any} result The result of the test.
 * @property {any} expected The expected result.
 */

function buildTableCell (value, tagName = 'td') {
    const td = document.createElement(tagName);
    td.textContent = value;
    return td;
}

/**
 * Builds a result table for the given results.
 * @param {Record<string, ResultRow>} results The results to build the table for.
 * @return {Element} The table element.
 */
// eslint-disable-next-line no-unused-vars
function buildResultTable (results) {
    const table = document.createElement('table');
    table.className = 'results';
    const thead = document.createElement('thead');
    let tr = document.createElement('tr');
    tr.appendChild(buildTableCell('Test', 'th'));
    tr.appendChild(buildTableCell('Result', 'th'));
    tr.appendChild(buildTableCell('Expected', 'th'));
    thead.appendChild(tr);
    table.appendChild(thead);
    for (const name in results) {
        const resultSection = results[name];
        const tbody = document.createElement('tbody');
        tr = document.createElement('tr');
        const heading = buildTableCell(name, 'th');
        heading.colSpan = 3;
        tr.appendChild(heading);
        tbody.appendChild(tr);

        resultSection.forEach((result) => {
            const resultOut = JSON.stringify(result.result);
            const expectedOut = JSON.stringify(result.expected);
            tr = document.createElement('tr');
            tr.appendChild(buildTableCell(result.name));
            tr.appendChild(buildTableCell(resultOut));
            tr.appendChild(buildTableCell(expectedOut));
            tr.classList.add(resultOut === expectedOut ? 'pass' : 'fail');
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }
    return table;
}

window.ongoingTests = [];
// eslint-disable-next-line no-unused-vars
function it (name, test) {
    window.ongoingTests.push({ name, test });
}
// eslint-disable-next-line no-unused-vars
async function renderResults () {
    const results = {};
    for (const test of window.ongoingTests) {
        const result = await test.test();
        results[test.name] = result;
    }
    document.body.appendChild(buildResultTable(results));
}
