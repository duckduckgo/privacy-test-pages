const startButton = document.querySelector('#start');
const downloadButton = document.querySelector('#download');

const testsDiv = document.querySelector('#tests');
const testsSummaryDiv = document.querySelector('#tests-summary');
const testsDetailsDiv = document.querySelector('#tests-details');

const saveToLS = document.querySelector('#save-to-ls');
const compareWithLS = document.querySelector('#compare-with-ls');
const compareWithFile = document.querySelector('#compare-with-file');

const diffDiv = document.querySelector('#diff');
const diffDetailsDiv = document.querySelector('#diff-details');
const diffSummaryDiv = document.querySelector('#diff-summary');

const includeAllPropsCheckbox = document.querySelector('#include-all-props');
const includeEventsCheckbox = document.querySelector('#include-events');

const headers = fetch('/reflect-headers').then(r => r.json());

// object that contains results of all tests
const results = {
    page: 'fingerprinting',
    date: null,
    results: []
};

/**
 * Test runner
 */
function runTests() {
    startButton.setAttribute('disabled', 'disabled');
    downloadButton.removeAttribute('disabled');
    testsDiv.removeAttribute('hidden');

    results.results.length = 0;
    results.date = (new Date()).toUTCString();
    let all = 0;
    let failed = 0;

    testsDetailsDiv.innerHTML = '';

    function updateSummary() {
        testsSummaryDiv.innerText = `Collected ${all} datapoints${failed > 0 ? ` (${failed} failed)` : ''}. Click for details.`;
    }

    tests.forEach(test => {
        if (test.category === 'all-props' && !includeAllPropsCheckbox.checked) {
            return;
        }
        if (test.category === 'events' && !includeEventsCheckbox.checked) {
            return;
        }

        all++;

        const resultObj = {
            id: test.id,
            category: test.category
        };
        results.results.push(resultObj);

        let categoryUl = document.querySelector(`.category-${test.category} ul`);

        if (!categoryUl) {
            const category = document.createElement('div');
            category.classList.add(`category-${test.category}`);
            category.innerText = test.category;
            categoryUl = document.createElement('ul');
            category.appendChild(categoryUl);

            testsDetailsDiv.appendChild(category);
        }

        const li = document.createElement('li');
        li.id = `test-${test.category}-${test.id}`;
        li.innerHTML = `${test.id} - <span class='value'></span>`;
        const valueSpan = li.querySelector('.value');

        categoryUl.appendChild(li);

        try {
            const value = test.getValue();

            if (value instanceof Promise) {
                value.then(v => {
                    valueSpan.innerHTML = `(${Array.isArray(v) ? 'array' : (typeof v)}) - <code>${JSON.stringify(v, null, 2)}</code>`;
                    resultObj.value = v;
                }).catch(e => {
                    valueSpan.innerHTML = `❌ error thrown ("${e}")`;
                    failed++;
                    updateSummary();
                });
            } else {
                valueSpan.innerHTML = `(${Array.isArray(value) ? 'array' : (typeof value)}) - <code>${JSON.stringify(value, null, 2)}</code>`;
                resultObj.value = value;
            }
        } catch (e) {
            valueSpan.innerHTML = `❌ error thrown ("${e}")`;
            failed++;
        }
    });

    updateSummary();

    startButton.removeAttribute('disabled');
    saveToLS.removeAttribute('disabled');
    compareWithFile.removeAttribute('disabled');

    // when there is data in localStorage enable comparing with localStorage
    if (localStorage.getItem('results')) {
        compareWithLS.removeAttribute('disabled');
    }
}

function downloadTheResults() {
    const data = JSON.stringify(results, null, 2);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], {type: 'application/json'}));
    a.href = url;
    a.download = 'fingerprinting-results.json';
    
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

function compareResults(resultsA, resultsB) {
    const resultsAObj = {};
    const resultsBObj = {};

    resultsA.results.forEach(result => resultsAObj[result.id] = result);
    resultsB.results.forEach(result => resultsBObj[result.id] = result);

    const diff = DeepDiff(resultsAObj, resultsBObj).filter(item => {
        // filter out differences where on object A property doesn't exist, but on object B it exists with value 'undefined'
        if (item.kind === 'N' && item.rhs === undefined) {
            return false;
        }
        return true;
    });

    console.log(diff);
    const list = document.createDocumentFragment();

    if (diff === undefined) {
        diffSummaryDiv.innerText = 'Results are identical.';
    } else {
        diffSummaryDiv.innerText = `There are ${diff.length} difference${diff.length === 1 ? '' : 's'} between those results. Click for details.`;

        diff.forEach(change => {
            const li = document.createElement('li'); 

            const testId = change.path[0];
            let path = '';

            change.path.forEach((segment, idx) => {
                if (idx < 2) {
                    return;
                }

                path += '→ ' + segment;
            });

            const testA = resultsAObj[testId];
            const testB = resultsBObj[testId];

            if (change.kind === 'E') { // modified property
                li.innerHTML = `<strong>${testId}</strong> ${path} - value <span class='changed'>changed</span> from <code>${JSON.stringify(change.lhs, null, 2)}</code> to <code>${JSON.stringify(change.rhs, null, 2)}</code>`;
            } else if (change.kind === 'A') { // array change
                if (change.item.kind === 'N') {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - new item <code>${JSON.stringify(change.item.rhs, null, 2)}</code> <span class='added'>added</span>`;
                } else if (change.item.kind === 'D') {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - item <code>${JSON.stringify(change.item.lhs, null, 2)}</code> <span class='removed'>removed</span>`;
                }
            } else if (change.kind === 'D') { // deleted property
                if (change.item) {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - item <code>${JSON.stringify(change.item.rhs, null, 2)}</code> <span class='removed'>removed</span>`;
                } else {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - property <span class='removed'>missing</span>`;
                }
            } else if (change.kind === 'N') { // added property
                if (change.item) {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - new item <span class='added'>added</span> <code>${JSON.stringify(change.item.lhs, null, 2)}</code> (<code>${JSON.stringify(testB.value, null, 2)}</code>)`;
                } else {
                    li.innerHTML = `<strong>${testId}</strong> ${path} - <span class='added'>new</span> property (<code>${JSON.stringify(change.rhs, null, 2)}</code>)`;
                }
            }

            list.appendChild(li);
        });
    }

    diffDetailsDiv.innerHTML = '';
    diffDetailsDiv.appendChild(list);

    diffDiv.removeAttribute('hidden');
}

saveToLS.addEventListener('click', () => {
    localStorage.setItem('results', JSON.stringify(results, null, 2));
});

compareWithLS.addEventListener('click', () => {
    const oldResults = JSON.parse(localStorage.getItem('results'));

    compareResults(oldResults, results);
});

compareWithFile.addEventListener('change', event => {
    const reader = new FileReader();
    reader.onload = () => {
      const oldResults = JSON.parse(reader.result);

      compareResults(oldResults, results);
    };
    reader.readAsText(compareWithFile.files[0]);
})

downloadButton.addEventListener('click', () => downloadTheResults());

// run tests if button was clicked or…
startButton.addEventListener('click', () => runTests());

// if url contains 'run-tests'
if (document.location.search === '?run') {
    runTests();
}
