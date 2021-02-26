/**
 * document.cookie test run in a 3rd party script.
 *
 * As we load this script via a 3rd party origin in the test, when running `store` the 3rd party
 * origin will be visible in the call stack to document.cookie.
 */
(function () {
    const src = document.currentScript.src;
    const trackingDomain = src.indexOf('https://broken.third-party.site/') === 0;

    commonTests.push({
        id: `JS cookie (3rd party ${trackingDomain ? 'tracking' : 'safe'} script)`,
        store: (data) => {
            document.cookie = `tp${trackingDomain ? 't' : 's'}data=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC;`;
        },
        retrive: () => {
            return trackingDomain ? document.cookie.match(/tptdata=([0-9]+)/)[1] : document.cookie.match(/tpsdata=([0-9]+)/)[1];
        }
    });
})();
