const acceptButton = document.createElement('button');
acceptButton.innerText = 'Accept all';
acceptButton.id = 'accept-all';
const banner = document.getElementById('privacy-test-page-cmp-test-banner');
banner.appendChild(acceptButton);
acceptButton.addEventListener('click', (ev) => {
    ev.target.innerText = 'Accept was clicked!';
    window.results.results.push('accept_button_clicked');
});

setTimeout(() => {
    if (window.getComputedStyle(banner).display === 'none') {
        window.results.results.push('banner_hidden');
    }
}, 500);

window.results = {
    page: 'autoconsent-banner',
    results: []
};
