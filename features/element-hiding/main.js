const TEST_DOMAIN = 'good.third-party.site';
const expectedResults = [
    { id: 'hide-basic', description: 'hide rule: element containing text is hidden', hidden: true },
    { id: 'hide-frame-contents', description: 'hide rule: element containing iframe is hidden', hidden: true },
    { id: 'hide-delayed-frame', description: 'hide rule: element that loads 3p frame after delay is hidden', hidden: true },
    { id: 'hide-delayed', description: 'hide rule: element added to page after delay is hidden', hidden: true },
    { id: 'hide-empty-no-content', description: 'hide-empty rule: element containing no content is hidden', hidden: true },
    { id: 'hide-empty-ad-label', description: 'hide-empty rule: element containing ad label content is hidden', hidden: true },
    { id: 'hide-empty-text-content', description: 'hide-empty rule: element containing text content is not hidden', hidden: false },
    { id: 'hide-empty-frame-content', description: 'hide-empty rule: element containing iframe is not hidden', hidden: false },
    { id: 'hide-empty-delayed-frame', description: 'hide-empty rule: element that loads 3p frame after delay is not hidden', hidden: false },
    { id: 'hide-empty-delayed', description: 'hide-empty rule: empty element added to page after delay is hidden', hidden: true },
    { id: 'closest-empty-single-div', description: 'closest-empty rule: element containing no content is hidden', hidden: true },
    { id: 'closest-empty-single-nested-div', description: 'closest-empty rule: parent of target element is hidden', hidden: true },
    { id: 'closest-empty-siblings-nested-div', description: 'closest-empty rule: parent of target element with empty siblings is hidden', hidden: true },
    { id: 'closest-empty-siblings-content-nested-div', description: 'closest-empty rule: parent of target element with non-empty siblings is not hidden', hidden: false },
    { id: 'closest-empty-frame-content', description: 'closest-empty rule: parent of element containing iframe is not hidden', hidden: false },
    { id: 'closest-empty-delayed-frame', description: 'closest-empty rule: parent of element that loads 3p frame after delay is not hidden', hidden: false },
    { id: 'closest-empty-intermediate-element', description: 'closest-empty rule: only outermost element should be hidden when target is nested', hidden: false },
    { id: 'closest-empty-delayed-parent', description: 'closest-empty rule: parent of empty element added to page after delay is hidden', hidden: true },
    { id: 'override-basic', description: 'override rule: element is not hidden when override rule present', hidden: false }
];

const results = {
    page: 'element-hiding',
    date: (new Date()).toUTCString(),
    results: []
};

const delayedSelectors = [
    { id: 'hide-delayed', class: 'hide-test', parent: 'hide' },
    { id: 'hide-empty-delayed', class: 'hide-empty-test', parent: 'hide-empty' },
    { id: 'closest-empty-delayed', class: 'closest-empty-test', parent: 'closest-empty-delayed-parent' }
];

function init () {
    // inject iframes
    loadFrames();

    // inject frames and other content after delay
    injectDelayedContent();

    // wait 2s then check results
    setTimeout(checkResults, 2000);
}

function checkResults () {
    for (const testCase of expectedResults) {
        const element = document.getElementById(testCase.id);
        const isHidden = element.style.getPropertyValue('display') === 'none';
        const result = testCase.hidden === isHidden;
        updateTable(testCase.id, testCase.description, result);
    }
}

function updateTable (name, description, testPassed) {
    const table = document.getElementById('results-table');
    const row = table.insertRow(-1);

    const descriptionCell = row.insertCell(0);
    const testCell = row.insertCell(1);

    // set default values and colors
    descriptionCell.innerText = description;

    const result = {
        id: name,
        hiddenProperly: testPassed
    };

    if (testPassed) {
        testCell.innerText = 'Success';
        testCell.style.backgroundColor = '#71bf69';
    } else {
        testCell.innerText = 'Failed';
        testCell.style.backgroundColor = '#f97268';
    }

    results.results.push(result);
}

function injectDelayedContent () {
    setTimeout(function () {
        // inject iframes
        const delayedFrameContainers = [...document.querySelectorAll('.frame-container-delayed')];
        delayedFrameContainers.forEach((container) => {
            const iframe = createFrame();
            container.appendChild(iframe);
        });
        // inject elements
        delayedSelectors.forEach((element) => {
            const parentElement = document.getElementById(element.parent);
            const div = document.createElement('div');
            div.setAttribute('class', element.class);
            div.setAttribute('id', element.id);
            parentElement.appendChild(div);
        });
    }, 600);
}

function loadFrames () {
    const iframeContainers = [...document.querySelectorAll('.frame-container')];
    iframeContainers.forEach((container) => {
        const iframe = createFrame();
        container.appendChild(iframe);
    });
}

function createFrame () {
    const iframe = document.createElement('iframe');
    iframe.frameborder = 0;
    iframe.scrolling = 'no';
    iframe.width = '400';
    iframe.height = '200';
    iframe.style.setProperty('border', 'none');
    iframe.style.setProperty('overflow', 'hidden');
    iframe.style.setProperty('display', 'block');
    iframe.src = `https://${TEST_DOMAIN}/features/element-hiding/frame.html`;
    return iframe;
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', (event) => {
        init();
    });
} else {
    init();
}
