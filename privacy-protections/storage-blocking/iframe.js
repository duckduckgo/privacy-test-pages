/* globals commonTests */

function storeData (randomNumber) {
    return Promise.all(commonTests.map(test => {
        try {
            const result = test.store(randomNumber);

            if (result instanceof Promise) {
                return result
                    .then(() => ({
                        test: test.id,
                        value: 'OK'
                    }))
                    .catch(e => ({
                        test: test.id,
                        value: e.message
                    }));
            } else {
                return Promise.resolve({
                    test: test.id,
                    value: 'OK'
                });
            }
        } catch (e) {
            return Promise.resolve({
                test: test.id,
                value: e.message ? e.message : e
            });
        }
    }));
}

function retrieveData () {
    return Promise.all(commonTests.map(async (test) => {
        try {
            const result = test.retrive();
            const value = (result instanceof Promise) ? await result : result;
            let extra;

            if (test.extra) {
                const extraResult = test.extra();
                extra = (extraResult instanceof Promise) ? await extraResult : extraResult;
            }

            return {
                test: test.id,
                value,
                extra
            };
        } catch (e) {
            return {
                test: test.id,
                value: null,
                error: e.message ? e.message : e
            };
        }
    }));
}

const match = location.search.match(/data=([0-9]+)/);

// if number passed in the url - store it
if (match) {
    const number = match[1];

    storeData(number)
        .then(result => {
            window.parent.postMessage(result, '*');
        });
} else {
// otherwise retrive the number
    retrieveData()
        .then(result => {
            window.parent.postMessage(result, '*');
        });
}
