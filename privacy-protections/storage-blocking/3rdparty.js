/**
 * document.cookie test run in a 3rd party script.
 *
 * As we load this script via a 3rd party origin in the test, when running `store` the 3rd party
 * origin will be visible in the call stack to document.cookie.
 */
commonTests.push({
    id: 'JS cookie (3rd party script)',
    store: (data) => {
        document.cookie = `tpdata=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC;`
    },
    retrive: () => {
        return document.cookie.match(/tpdata=([0-9]+)/)[1]
    }
})
