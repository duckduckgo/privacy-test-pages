/**
 * document.cookie test run in a 3rd party script.
 *
 * As we load this script via a 3rd party origin in the test, when running `store` the 3rd party
 * origin will be visible in the call stack to document.cookie.
 */
(function () {
    const src = document.currentScript.src;
    const trackingDomain = src.indexOf('https://broken.third-party.site/') === 0;
    const cookieName = trackingDomain ? 'tptdata' : 'tpsdata';

    commonTests.push({
        id: `JS cookie (3rd party ${trackingDomain ? 'tracking' : 'safe'} script)`,
        store: (data) => {
            document.cookie = `${cookieName}=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC;`;
        },
        retrive: () => {
            return trackingDomain ? document.cookie.match(/tptdata=([0-9]+)/)[1] : document.cookie.match(/tpsdata=([0-9]+)/)[1];
        },
        extra: () => {
            if (window.cookieStore) {
                return window.cookieStore.get(cookieName).then(cookie => {
                    return 'expires in ' + ((cookie.expires - Date.now()) / (1000 * 60 * 60 * 24)).toFixed(2) + ' days';
                });
            }
        }
    });
})();
