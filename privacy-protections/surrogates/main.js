function loadSurrogates () {

    for (const [name, testData] of Object.entries(surrogates)) {
        const s = document.createElement('script')
        testData.crossOrigin ? s.crossOrigin = testData.crossOrigin : ''
        s.src = testData.url
        
        s.onload = () => updateTable({name, testData})
        s.onerror = (error) => updateTable({name, testData, error})

        document.body.appendChild(s)
    }
}   

function updateTable ({name, testData, error}) {

    const table = document.getElementById('results-table')
    const row = table.insertRow(-1)
    const testName = row.insertCell(0)
    const loaded = row.insertCell(1)
    const passed = row.insertCell(2)
    const note = row.insertCell(3)

    // set default values and colors
    testName.innerText = name
    loaded.innerText = 'failed'
    passed.innerText = 'failed'
    row.style.backgroundColor = '#f97268'
    note.style.backgroundColor = "#ffff"

    if (!error || testData.shouldFail) {
        loaded.innerText = "pass"

        const result = testData.test()
        if (result) {
            passed.innerText = "pass"
            row.style.backgroundColor = '#71bf69'
        } else {
            loaded.innerText = "failed"
        }
    }

    if (testData.notes) {
        note.innerText = testData.notes
    }

    if (testData.cleanup) {
        testData.cleanup()
    }
}

const surrogates = {
    "google-analytics.com/analytics.js, crossOrigin" : {
        url: "https://google-analytics.com/analytics.js",
        crossOrigin: "anonymous",
        notes: "Test loading with crossOrigin set on element (should fail on Firefox) https://bugzilla.mozilla.org/show_bug.cgi?id=1694679",
        test: () => { return window.ga.answer === 42 },
        cleanUp: () => { delete window.ga }
    },
    "google-analytics.com/analytics.js": {
        url: "https://google-analytics.com/analytics.js",
        test: () => { return window.ga.answer === 42 },
        cleanUp: () => { delete window.ga }
    },
    'google-analytics, ga.js': {
        url: "https://google-analytics.com/ga.js",
        test: () => { return !!window._gaq },
        cleanUp: () => { delete window._gaq }
    },
    'Directly accessing a web resouce' : {
        url: "chrome-extension://lfpgfgegioonagopmelghcelfgffmjnh/web_accessible_resources/analytics.js",
        notes: "Chromium browsers Only: need access key for web resources",
        shouldFail: true,
        test: () => { return true } 
    }
}
        
