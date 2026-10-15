const composer = document.querySelector('#composer');
const message = document.querySelector('#message');
const messages = document.querySelector('#messages');
const measurements = document.querySelector('#measurements');

for (let i = 1; i <= 12; i++) {
    const item = document.createElement('li');
    item.textContent = `Sample message ${i}. Scroll the conversation with the keyboard open and closed to check the pinned input.`;
    messages.append(item);
}

function updateMeasurements () {
    const viewport = window.visualViewport;
    const bounds = composer.getBoundingClientRect();
    measurements.textContent = JSON.stringify({
        innerHeight: window.innerHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollY: window.scrollY,
        visualViewportHeight: viewport?.height ?? null,
        visualViewportOffsetTop: viewport?.offsetTop ?? null,
        visualViewportScale: viewport?.scale ?? null,
        composerTop: bounds.top,
        composerBottom: bounds.bottom,
        inputFocused: document.activeElement === message
    }, null, 2);
}

composer.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!message.value.trim()) return;
    const item = document.createElement('li');
    item.className = 'sent';
    item.textContent = message.value;
    messages.append(item);
    message.value = '';
    message.focus();
    window.scrollTo(0, document.documentElement.scrollHeight);
    updateMeasurements();
});

window.addEventListener('resize', updateMeasurements);
window.addEventListener('scroll', updateMeasurements);
window.visualViewport?.addEventListener('resize', updateMeasurements);
window.visualViewport?.addEventListener('scroll', updateMeasurements);
message.addEventListener('focus', updateMeasurements);
message.addEventListener('blur', updateMeasurements);
updateMeasurements();
