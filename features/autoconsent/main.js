// populate test sites
const testSites = {
    Sourcepoint: [
        'https://www.brianmadden.com/',
        'https://www.channelpro.co.uk/news',
        'https://www.csoonline.com/blogs',
        'https://www.theguardian.com/',
        'https://www.independent.co.uk/',
        'https://www.n-tv.de/'
    ],
    Onetrust: [
        'https://www.accenture.com/',
        'https://edition.cnn.com/',
        'https://mailchimp.com/',
        'https://www.okcupid.com/',
        'https://arstechnica.com/',
        'https://www.jeux.fr/',
        'https://www.adobe.com/de/',
        'https://genius.com/',
        'https://bitbucket.org/',
        'https://www.atlassian.com/',
        'https://www.digitaltrends.com/',
        'https://about.gitlab.com',
        'https://research.polyu.edu.hk/en/publications/a-survey-of-intel-sgx-and-its-applications',
        'https://www.lifewire.com/write-if-statements-in-bash-script-2200578',
        'https://www.zoom.us'
    ],
    Cybotcookiebot: [
        'https://www.ab-in-den-urlaub.de/',
        'https://www.vatera.hu/',
        'https://www.smartsheet.com/'
    ],
    Sirdata: [
        'https://www.futura-sciences.com/',
        'https://www.abcbourse.com/',
        'https://www.journaldugeek.com/'
    ],
    quantcast: [
        'https://imgur.com',
        'https://www.cyclingnews.com/',
        'https://9gag.com',
        'https://www.anandtech.com/',
        'https://myanimelist.net/',
        'https://www.techradar.com/',
        'https://www.livescience.com',
        'https://www.gamesradar.com'
    ],
    'funding-choices': [
        'https://www.dinarguru.com/'
    ],
    'com_onetrust-stackoverflow': [
        'https://stackoverflow.com/'
    ]
};
const root = document.getElementById('test-sites');
const cmpTemplate = document.getElementById('test-cmp-row');
const siteTemplate = document.getElementById('test-site-row');

Object.keys(testSites).forEach((cmpName) => {
    const cmpEntry = cmpTemplate.content.cloneNode(true);
    cmpEntry.querySelector('.cmp-name').innerText = cmpName;
    const siteList = cmpEntry.querySelector('.cmp-sites');
    testSites[cmpName].forEach((site) => {
        const siteEntry = siteTemplate.content.cloneNode(true);
        const link = siteEntry.querySelector('a');
        link.setAttribute('href', site);
        link.innerText = site;
        siteList.appendChild(siteEntry);
    });
    root.appendChild(cmpEntry);
});

// dummy CMP
document.getElementById('reject-all').addEventListener('click', (ev) => {
    ev.target.innerText = 'I was clicked!';
    window.results.results.push('button_clicked');
});

window.results = {
    page: 'autoconsent',
    results: []
};
