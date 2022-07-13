let facebookCalls = 0;

// object that contains results of all tests
const results = {
    page: 'facebook-click-to-load',
    date: (new Date()).toUTCString(),
    results: []
};

function updateResults () {
    results.results = [
        {
            id: 'facebookCalls',
            value: facebookCalls
        }
    ];
}

// This initializes the facebook SDK.
window.fbAsyncInit = function () {
    // eslint-disable-next-line no-undef
    FB.init({
        appId: '',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v9.0'
    });

    function fbLogin () {
        const displayArea = document.getElementById('loginResponse');
        displayArea.innerHTML = 'Calling FB SDK... ';
        // eslint-disable-next-line no-undef
        FB.login(function (response) {
            if (response.authResponse) {
                displayArea.innerHTML = 'Starting FB login... ';
                // eslint-disable-next-line no-undef
                FB.api('/me', function (response) {
                    displayArea.innerHTML = `Logged in as ${response.name}`;
                });
            } else {
                displayArea.innerHTML = 'User cancelled login or did not fully authorize.';
            }
        });
    }

    const loginButton = document.getElementById('custom-fb-login-button');
    loginButton.addEventListener('click', fbLogin);
};

function facebookObserver (list, observer) {
    const resourceLoads = list.getEntriesByType('resource');
    for (const resource of resourceLoads) {
        if (resource.name.match(/facebook.com|facebook.net/)) {
            /* Observer still counts calls that fail, but the duration is less. In testing,
             * failed iFrames always returned in around 100 or less, with success generally being
             * above 200. Occasionally, a loaded resource comes in around 150. If Facebook requests
             * are allowed, there will also be other resources that load - scripts and content
             * which will always be counted.
            */
            if (resource.initiatorType !== 'iframe' || resource.duration > 150) {
                facebookCalls += 1;
            }
        }
    }

    updateResults();
}

const observer = new PerformanceObserver(facebookObserver);
observer.observe({ entryTypes: ['resource'] });

function downloadTheResults () {
    const data = JSON.stringify(results);
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.href = url;
    a.download = 'facebook-click-to-load-results.json';

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

const downloadButton = document.querySelector('#download');
downloadButton.addEventListener('click', () => downloadTheResults());

window.onload = function() {
  document.getElementById('facebook_call_count').innerHTML = facebookCalls ? '<span style="color:RED;">DETECTED</span>' : '<span style="color:GREEN;">NONE</span>';
}