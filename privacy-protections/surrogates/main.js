function loadSurrogates () {

    for (const [name, test] of Object.entries(surrogates)) {
        const s = document.createElement('script')
        test.crossOrigin ? s.crossOrigin = test.crossOrigin : ''
        s.src = test.url
        
        s.onload = () => updateTable({name, test: test.test, notes: test.notes})
        s.onerror = (error) => updateTable({name, error, test: test.test, notes: test.notes, shouldFail: test.shouldFail})

        document.body.appendChild(s)

    }
}   

function updateTable ({name, test, error='', notes = '', shouldFail}) {


    const table = document.getElementById('results-table')
    const row = table.insertRow(-1)

    const testName = row.insertCell(0)
    const loaded = row.insertCell(1)
    const passed = row.insertCell(2)
    const note = row.insertCell(3)

    // set default values
    testName.innerText = name
    loaded.innerText = 'failed'
    passed.innerText = 'failed'
    row.style.backgroundColor = '#f97268'
    note.style.backgroundColor = "#ffff"

    if (!error || shouldFail) {
        loaded.innerText = "pass"

        const result = test()
        if (result) {
            passed.innerText = "pass"
            row.style.backgroundColor = '#71bf69'
        } else {
            loaded.innerText = "failed"
        }
    }

    if (notes) {
        note.innerText = notes
    }
}

const surrogates = {
    'google-analytics, analytics.js, crossOrigin': {
        url: "https://google-analytics.com/analytics.js",
        crossOrigin: "anonymous",
        notes: "Test loading with crossOrigin set on element (should fail on Firefox) https://bugzilla.mozilla.org/show_bug.cgi?id=1694679",
        test: () => { return window.ga.answer === 42 }
    },
    'google-analytics, analytics.js': {
        url: "https://google-analytics.com/analytics.js",
        test: () => { return window.ga.answer === 42 }
    },
    'google-analytics, ga.js': {
        url: "https://google-analytics.com/ga.js",
        test: () => { return !!window._gaq }
    },
    'Directly accessing a web resouce' : {
        url: "chrome-extension://lfpgfgegioonagopmelghcelfgffmjnh/web_accessible_resources/analytics.js",
        notes: "Chromium browsers Only: need access key for web resources",
        shouldFail: true,
        test: () => { return true } 
    }
}
        
