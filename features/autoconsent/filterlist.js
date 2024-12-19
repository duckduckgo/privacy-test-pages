const acceptButton = document.createElement('button');
acceptButton.innerText = 'Accept all';
acceptButton.id = 'accept-all';
const banner = document.querySelector('#privacy-test-page-cmp-test-banner-filterlist');
banner.appendChild(acceptButton);
acceptButton.addEventListener('click', (ev) => {
    ev.target.innerText = 'Accept was clicked!';
    window.results.results.push('accept_button_clicked');
});

setTimeout(() => {
    if (window.getComputedStyle(banner).opacity === '0') {
        window.results.results.push('banner_hidden');
    }
}, 500);

window.results = {
    page: 'autoconsent-filterlist',
    results: []
};
