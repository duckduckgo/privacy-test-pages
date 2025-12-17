// dummy CMP
const button = document.createElement('button');
button.innerText = 'Reject all';
button.id = 'reject-all';
document.getElementById('privacy-test-page-cmp-test-heuristic').appendChild(button);
button.addEventListener('click', (ev) => {
    ev.target.innerText = 'Reject was clicked!';
    window.results.results.push('button_clicked');
});

const acceptButton = document.createElement('button');
acceptButton.innerText = 'Accept all';
acceptButton.id = 'accept-all';
document.getElementById('privacy-test-page-cmp-test-heuristic').appendChild(acceptButton);
acceptButton.addEventListener('click', (ev) => {
    ev.target.innerText = 'Accept was clicked!';
    window.results.results.push('accept_button_clicked');
});

window.results = {
    page: 'autoconsent',
    results: []
};
