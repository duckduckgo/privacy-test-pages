// dummy CMP
const button = document.createElement('button');
button.innerText = 'Reject all';
button.id = 'reject-all';
document.getElementById('privacy-test-page-cmp-test').appendChild(button);
button.addEventListener('click', (ev) => {
    ev.target.innerText = 'I was clicked!';
    window.results.results.push('button_clicked');
    // reload the page to simulate a reload loop
    location.reload();
});

const acceptButton = document.createElement('button');
acceptButton.innerText = 'Accept all';
acceptButton.id = 'accept-all';
document.getElementById('privacy-test-page-cmp-test').appendChild(acceptButton);
acceptButton.addEventListener('click', (ev) => {
    ev.target.innerText = 'Accept was clicked!';
    window.results.results.push('accept_button_clicked');
    // reload the page to simulate a reload loop
    location.reload();
});

window.results = {
    page: 'autoconsent',
    results: []
};
