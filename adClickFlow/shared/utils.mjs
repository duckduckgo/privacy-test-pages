
function getSearchDomain (hostname) {
    const isLocalTest = hostname.endsWith('.example');
    return isLocalTest ? 'www.search-company.example' : 'www.search-company.site';
}

function getPubDomain (hostname) {
    const isLocalTest = hostname.endsWith('.example');
    return isLocalTest ? 'www.publisher-company.example' : 'www.publisher-company.site';
}

function getAdHostname (hostname) {
    const isLocalTest = hostname.endsWith('.example');
    return isLocalTest ? 'ad-company.example' : 'ad-company.site';
}

function getAdUrl (id, hostname) {
    // Build Ad Redirection URL
    const adHostname = getAdHostname(hostname);
    const adPath = `https://www.${adHostname}/aclick`;
    const adUrl = new URL(adPath);
    const params = ['ld', 'u', 'rlid', 'vqd', 'iurl', 'CID'];
    // add some fake values
    for (const param of params) {
        adUrl.searchParams.append(param, `${param}Value`);
    }
    adUrl.searchParams.append('ID', id)

    // Build Search Redirection URL
    const useMPath = 'useMPath' in ads[id];
    const includeParam = 'includeParam' in ads[id];
    const searchPath =  useMPath ? '/m.js' : '/y.js';
    const searchFullPath = `https://${getSearchDomain(hostname)}${searchPath}`
    const searchUrl = new URL(searchFullPath);
    if ('supportAdDomain' in ads[id]) {
        searchUrl.searchParams.append('ad_domain', getPubDomain(hostname));
    } else if ('emptyAdDomain' in ads[id]) {
        searchUrl.searchParams.append('ad_domain', '');
    } else if ('incorrectAdDomain' in ads[id]) {
        searchUrl.searchParams.append('ad_domain', 'example.com');
    } else if ('unparsableAdDomain' in ads[id]) {
        searchUrl.searchParams.append('ad_domain', 'abcdefg');
    } else if ('differentSubdomainAdDomain' in ads[id]) {
        searchUrl.searchParams.append('ad_domain', `foo.${getPubDomain(hostname)}`);
    }
    // add static params
    if (useMPath) {
        searchUrl.searchParams.append('iurl', 'foo');
        searchUrl.searchParams.append('ivu', 'foo');
        searchUrl.searchParams.append('sfexp', '0');
        searchUrl.searchParams.append('shopping', '1');
        searchUrl.searchParams.append('spld', 'foo');
        searchUrl.searchParams.append('styp', 'entitydetails');
    } else {
        searchUrl.searchParams.append('eddgt', 'nothing');
        searchUrl.searchParams.append('rut', 'else');
    }
    // add params used for detection
    if (useMPath && includeParam) {
        searchUrl.searchParams.append('dsl', '1');
    } else if (includeParam) {
        searchUrl.searchParams.append('u3', 'foo');
    }
    // normal URLs use a different param, but we use 'u' here to avoid conflict with other params.
    searchUrl.searchParams.append('u', encodeURIComponent(adUrl));
    return searchUrl.href;
}

const ads = {
    1: {
        title: '[Ad 1] SERP Ad (heuristic)',
        summary: '/y.js; No ad_domain parameter; Includes u3 param',
        product: 12,
        includeParam: true
    },
    2: {
        title: '[Ad 2] Shopping Tab Ad (heuristic)',
        summary: '/m.js; No ad_domain parameter; Includes dsl=1 param',
        product: 200,
        useMPath: true,
        includeParam: true
    },
    3: {
        title: '[Ad 3] SERP Ad (heuristic)',
        summary: '/y.js; No ad_domain parameter; No u3 param',
        product: 12
    },
    4: {
        title: '[Ad 4] Shopping Tab Ad (heuristic)',
        summary: '/m.js; No ad_domain parameter; No dsl=1 param',
        product: 200,
        useMPath: true
    },
    5: {
        title: '[Ad 5] SERP Ad (heuristic)',
        summary: '/y.js; Empty ad_domain parameter; No u3 param',
        product: 12,
        emptyAdDomain: true
    },
    6: {
        title: '[Ad 6] Shopping Tab Ad (heuristic)',
        summary: '/m.js; Empty ad_domain parameter; No dsl=1 param',
        product: 200,
        useMPath: true,
        emptyAdDomain: true
    },
    7: {
        title: '[Ad 7] SERP Ad (SERP-provided)',
        summary: '/y.js; Includes ad_domain parameter; No u3 param',
        product: 12,
        supportAdDomain: true
    },
    8: {
        title: '[Ad 8] Shopping Tab Ad (SERP-provided)',
        summary: '/m.js; Includes ad_domain parameter; No dsl=1 param',
        product: 200,
        useMPath: true,
        supportAdDomain: true
    },
    9: {
        title: '[Ad 9] SERP Ad (SERP-provided)',
        summary: '/y.js; Includes INCORRECT ad_domain parameter; No u3 param',
        product: 12,
        incorrectAdDomain: true
    },
    10: {
        title: '[Ad 10] Shopping Tab Ad (SERP-provided)',
        summary: '/m.js; Includes INCORRECT ad_domain parameter; No dsl=1 param',
        product: 200,
        useMPath: true,
        incorrectAdDomain: true
    },
    11: {
        title: '[Ad 11] SERP Ad (heuristic)',
        summary: '/y.js; Includes UNPARSABLE ad_domain parameter; No u3 param',
        product: 12,
        unparsableAdDomain: true
    },
    12: {
        title: '[Ad 12] Shopping Tab Ad (heuristic)',
        summary: '/m.js; Includes UNPARSABLE ad_domain parameter; No dsl=1 param',
        product: 200,
        useMPath: true,
        unparsableAdDomain: true
    },
    13: {
        title: '[Ad 13] SERP Ad (SERP-provided)',
        summary: '/y.js; Includes ad_domain parameter set to a different subdomain; No u3 param',
        product: 12,
        differentSubdomainAdDomain: true
    },
    14: {
        title: '[Ad 14] Shopping Tab Ad (SERP-provided)',
        summary: '/m.js; Includes ad_domain parameter set to a different subdomain; No dsl=1 param',
        product: 200,
        useMPath: true,
        differentSubdomainAdDomain: true
    }
};

export function getAds (hostname) {
    for (const adId in ads) {
        const ad = ads[adId];
        ad.url = getAdUrl(adId, hostname);
        ads[adId] = ad;
    }
    return ads;
}

/**
 * Returns a publisher product URL
 * @param {*} id 
 * @param {string} hostname 
 * @returns {string}
 */
export function getPubUrl(id, hostname) {
    const pubDomain = getPubDomain(hostname);
    const ad = ads[id];
    return `https://${pubDomain}/product.html?p=${ad.product}`
}

export function getPubCompleteUrl(hostname) {
    const pubDomain = getPubDomain(hostname);
    return `https://${pubDomain}/convert.html`
}

export function getPaymentGatewayUrl(hostname) {
    const isLocalTest = hostname.endsWith('.example');
    return isLocalTest ? 'https://www.payment-company.example/pay.html' : 'https://www.payment-company.site/pay.html';
}

export function getAdConvertScriptUrl (hostname) {
    const adHostname = getAdHostname(hostname);
    return `https://convert.${adHostname}/convert.js?ad=1`
}

export function getTrackingScriptUrl (hostname) {
    const adHostname = getAdHostname(hostname);
    return `https://www.${adHostname}/track.js?ad=1`
}

export const products = {
    12: {
        name: 'Green T-shirt',
        summary: 'Cotton t-shirt',
        price: ['3', '10']
    },
    200: {
        name: 'Red shoes',
        summary: 'Red running shoes',
        price: ['2', '00']
    },
    1231: {
        name: 'Corduroy beige pants',
        summary: 'Pants for the office.',
        price: ['12', '00']
    }
}

export function getProducts (hostname) {
    const productsOut = {}
    for (const productId in products) {
        const product = products[productId];
        productsOut[productId] = product;
    }
    return productsOut;
}

/**
 * Loads the tracking and conversion scripts.
 * Initializes the finish observer which will report the completed status to testing.
 */
export function initializeBoilerplate () {
    const convertScriptUrl = getAdConvertScriptUrl(globalThis.location.hostname);
    const trackingScriptUrl = getTrackingScriptUrl(globalThis.location.hostname);
    const convertPixelUrl = new URL('/ping.gif', convertScriptUrl);
    const trackingPixelUrl = new URL('/ping.gif', trackingScriptUrl);

    new FinishObserver([
        {
            url: convertScriptUrl,
            subresources: [
                {
                    url: convertPixelUrl.href
                }
            ]
        },
        {
            url: trackingScriptUrl,
            subresources: [
                {
                    url: trackingPixelUrl.href
                }
            ]
        }
    ])

    function createAndAppendScript(url) {
        const scriptElement = document.createElement('script');
        scriptElement.src = url;
        scriptElement.onload = () => {
            fireResource(url, 'loaded');
        }
        scriptElement.onerror = () => {
            fireResource(url, 'blocked');
        }
        document.documentElement.appendChild(scriptElement);
    }

    createAndAppendScript(convertScriptUrl);
    createAndAppendScript(trackingScriptUrl);
}

function fireResource (url, status) {
    window.dispatchEvent(new CustomEvent('resourceLoad', {
        detail: {
            url,
            status
        }
    }));
}

/**
 * @typedef ResourceLoad
 * @property {string} src
 * @property {'loaded', 'blocked', 'parent blocked'} [status]
 * @property {ResourceLoad[]} [subresources]
 */

export class FinishObserver {
    /**
     * @param {ResourceLoad[]} resourceLoads
     * @param {number} timeout
     */
    constructor(resources, timeout) {
        // Validate that resources passed match expectations due to limitations in knowing the initiator.
        const uniqueUrls = new Set();
        function addUnique(url) {
            if (uniqueUrls.has(url)) {
                throw new Error('Each url observed must be unique: ' + url);
            }
            uniqueUrls.add(url);
        }
        for (const resource of resources) {
            addUnique(resource.url);
            if (resource.subresources) {
                resource.subresources.every(subresource => {
                    addUnique(subresource.url);
                    if ('subresources' in subresource) {
                        throw new Error('Child subresources are not supported');
                    }
                });
            }
        }
        this.resources = resources;

        this.observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.map((entry) => {
                // Safari doesn't support serverTiming nor does it fire events for blocked loads either.
                if (entry.serverTiming) {
                    if (entry.serverTiming.length === 0) {
                        this.setResourceStatus(entry.name, 'blocked');
                    } else {
                        this.setResourceStatus(entry.name, 'loaded');
                    }
                }
            });
            this.fireFinishIfFinished()
        });
        this.observer.observe({entryTypes: ["resource"]});

        // Support for Safari as it doesn't support serverTiming
        window.addEventListener('resourceLoad', (event) => {
            this.setResourceStatus(event.detail.url, event.detail.status);
            this.fireFinishIfFinished()
        });
    }

    fireFinishIfFinished() {
        if (this.isFinished()) {
            this.fireFinish();
        }
    }

    setResourceStatus(url, status) {
        this.resources.forEach((resource) => {
            if (resource.url === url) {
                resource.status = status;
                if (status === 'blocked' && resource.subresources) {
                    resource.subresources.forEach((child) => {
                        child.status = 'parent blocked';
                    });
                }
            } else if ('subresources' in resource) {
                resource.subresources.forEach((subresource) => {
                    if (subresource.url === url) {
                        subresource.status = status;
                    }
                });
            }
        });
    }

    isFinished() {
        for (const resource of this.resources) {
            if (!('status' in resource)) {
                return false
            }
            if ('subresources' in resource) {
                for (const child of resource.subresources) {
                    if (!('status' in child)) {
                        return false;
                    }
                }
            }
        }
        return true
    }

    fireFinish() {
        if (this.hasFinished) {
            return;
        }
        this.hasFinished = true;
        this.observer.disconnect();
        window.dispatchEvent(new CustomEvent('pageFinished', {
            detail: {
                loads: this.resources
            }
        }));
        /**
         * Flatten output to global.
         * ```
         * window.resources = [
         *   { status: "loaded", url: "https://convert.ad-company.example/convert.js?ad=1" }
         *   { status: "loaded", url: "https://convert.ad-company.example/ping.gif" }
         *   { status: "blocked", url: "https://www.ad-company.example/track.js?ad=1" }
         *   { status: "parent blocked", url: "https://www.ad-company.example/ping.gif" }
         * ]
         * ```
         */
        const output = []
        for (const resource of this.resources) {
            output.push({status: resource.status, url: resource.url});
            if (resource.subresources) {
                for (const child of resource.subresources) {
                    output.push({status: child.status, url: child.url});
                }
            }
        }
        window.resources = output
        this.render();
    }

    render() {
        const detailsElement = document.createElement('details');
        const summaryElement = document.createElement('summary');
        summaryElement.textContent = 'Resources';
        const tableElement = document.createElement('table');
        for (const resource of window.resources) {
            const resourceElement = document.createElement('tr');

            const urlCellElement = document.createElement('td');
            urlCellElement.textContent = resource.url;
            resourceElement.appendChild(urlCellElement);

            const statusCellElement = document.createElement('td');
            statusCellElement.textContent = resource.status;
            resourceElement.appendChild(statusCellElement);

            tableElement.appendChild(resourceElement);
        }
        detailsElement.appendChild(summaryElement);
        detailsElement.appendChild(tableElement);
        document.body.appendChild(detailsElement);
    }
}
