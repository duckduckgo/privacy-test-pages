import { products } from './shared/utils.mjs'
function scriptLoadedCallback(event) {
    console.log('Script loaded:', event.target.src, event.detail.src);
}
window.addEventListener('scriptloaded', scriptLoadedCallback);


const productId = new URL(location.href).searchParams.get('p') || 12;
const mainElement = document.querySelector('main');
const productTemplate = document.getElementById('myproduct');
renderProduct(products[productId] || products[12]);

function renderProduct(product) {
    const productElement = productTemplate.content.cloneNode(true);
    const link = productElement.querySelector('h2 a');
    link.textContent = product.name
    document.title = 'Publisher ' + product.name
    const summary = productElement.querySelector('summary');
    summary.textContent = product.summary;
    const price = productElement.querySelector('.price');
    price.textContent = '$' + product.price.join('.');
    mainElement.appendChild(productElement);
} 