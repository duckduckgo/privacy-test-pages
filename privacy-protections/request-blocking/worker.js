self.addEventListener('message', msg => {
    if (msg.data.action && msg.data.action === 'fetch') {
        fetch(msg.data.url)
            .then(r => r.json())
            .then(data => {
                if (data.data.includes('fetch loaded')) {
                    postMessage('worker fetch loaded 👍');
                }
            })
            .catch(e => postMessage('worker fetch failed'));
    }
});
