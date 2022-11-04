// sources: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#client_hints, https://chromium.googlesource.com/chromium/src/+/refs/heads/main/services/network/public/cpp/client_hints.cc, https://chromium.googlesource.com/chromium/src/+/refs/heads/main/components/client_hints/README.md
const ALL_CH = [
    'Sec-CH-UA',
    'Sec-CH-UA-Arch',
    'Sec-CH-UA-Bitness',
    'Sec-CH-UA-Full',
    'Sec-CH-UA-Full-Version',
    'Sec-CH-UA-Full-Version-List',
    'Sec-CH-UA-Mobile',
    'Sec-CH-UA-Model',
    'Sec-CH-UA-Platform',
    'Sec-CH-UA-Reduced',
    'Sec-CH-UA-WoW64',
    'Sec-CH-UA-Platform-Version',
    'Sec-CH-Prefers-Color-Scheme',
    'Sec-CH-Prefers-Reduced-Motion',
    'Sec-CH-Viewport-Height',
    'Sec-CH-Device-Memory',
    'Sec-CH-DPR',
    'Sec-CH-Width',
    'Sec-CH-Viewport-Width',
    'Content-DPR',
    'Device-Memory',
    'DPR',
    'Viewport-Width',
    'Width',
    'Downlink',
    'ECT',
    'RTT',
    'Save-Data'].map(h => h.toLowerCase());

// sources: https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues, https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/frame/navigator_ua_data.h
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
    'fullVersionList',
    'wow64'
];

if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = { ALL_CH, ALL_CH_JS };
}
