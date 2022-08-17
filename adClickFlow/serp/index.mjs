import { getAds } from '../shared/utils.mjs';

const mainElement = document.querySelector('main');
const myadTemplate = document.getElementById('myad');
const ads = getAds(globalThis.location.hostname);

for (const adId in ads) {
    const ad = ads[adId];
    const adElement = myadTemplate.content.cloneNode(true);
    const link = adElement.querySelector('h2 a');
    link.href = ad.url;
    link.id = `ad-id-${adId}`;
    if (ad.url.includes('m.js')) {
        const linkHandler = (e) => {
            e.preventDefault()
            window.open(link.href)
        };
        link.addEventListener('click', linkHandler);
        link.addEventListener('touchend', linkHandler);
    }
    link.textContent = ad.title;
    const summary = adElement.querySelector('summary');
    summary.textContent = ad.summary;
    mainElement.appendChild(adElement);
}
