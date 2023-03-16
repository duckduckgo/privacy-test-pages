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
 * @param {ResultRow} results The results to build the table for.
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
    const tbody = document.createElement('tbody');
    results.forEach((result) => {
        tr = document.createElement('tr');
        tr.appendChild(buildTableCell(result.name));
        tr.appendChild(buildTableCell(result.result));
        tr.appendChild(buildTableCell(result.expected));
        tr.classList.add(result.result === result.expected ? 'pass' : 'fail');
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
}
