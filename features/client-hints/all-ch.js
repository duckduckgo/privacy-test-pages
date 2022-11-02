// source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#client_hints
const ALL_CH = ['Sec-CH-UA',
    'Sec-CH-UA-Arch',
    'Sec-CH-UA-Bitness',
    'Sec-CH-UA-Full-Version',
    'Sec-CH-UA-Full-Version-List',
    'Sec-CH-UA-Mobile',
    'Sec-CH-UA-Model',
    'Sec-CH-UA-Platform',
    'Sec-CH-UA-Platform-Version',
    'Content-DPR',
    'Device-Memory',
    'DPR',
    'Viewport-Width',
    'Width',
    'Downlink',
    'ECT',
    'RTT',
    'Save-Data'].map(h => h.toLowerCase());

// source: https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues
const ALL_CH_JS = [
    // low-entropy
    'brands',
    'mobile',
    'platform',
    // high-entropy
    'architecture',
    'bitness',
    'model',
    'platformVersion',
    'uaFullVersion',
    'fullVersionList'
];

if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = { ALL_CH, ALL_CH_JS };
}
