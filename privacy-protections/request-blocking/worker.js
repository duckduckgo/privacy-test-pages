fetch(`./block-me/fetch.json?${Math.random()}`)
    .then(r => r.json())
    .then(data => {
        if (data.data.includes('fetch loaded')) {
            postMessage('worker fetch loaded 👍');
        }
    })
    .catch(e => postMessage('worker fetch failed'));