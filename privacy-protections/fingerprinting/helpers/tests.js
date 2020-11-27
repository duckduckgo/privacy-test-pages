const tests = [
    // headers
    {
        id: 'headers - accept',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept'])
    },
    {
        id: 'headers - accept-encoding',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept-encoding'])
    },
    {
        id: 'headers - accept-language',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept-language'])
    },
    {
        id: 'headers - dnt',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['dnt'])
    },
    {
        id: 'headers - user-agent',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['user-agent'])
    },
    {
        id: 'headers - other',
        category: 'headers',
        getValue: () => headers.then(res => {
            const exclude = [
                'accept', 'accept-encoding', 'accept-language', 'dnt', 'user-agent', // already covered above
                'referer' // not useful
            ];
            const other = {};

            Object.keys(res.headers).forEach(k => {
                if (!exclude.includes(k)) {
                    other[k] = res.headers[k];
                }
            })

            return other;
        })
    },

    // navigator
    {
        id: 'navigator.userAgent',
        category: 'navigator',
        getValue: () => navigator.userAgent
    },
    {
        id: 'navigator.deviceMemory',
        category: 'navigator',
        getValue: () => navigator.deviceMemory
    },
    {
        id: 'navigator.hardwareConcurrency',
        category: 'navigator',
        getValue: () => navigator.hardwareConcurrency
    },
    {
        id: 'navigator.product',
        category: 'navigator',
        getValue: () => navigator.product
    },
    {
        id: 'navigator.productSub',
        category: 'navigator',
        getValue: () => navigator.productSub
    },
    {
        id: 'navigator.appName',
        category: 'navigator',
        getValue: () => navigator.appName
    },
    {
        id: 'navigator.appVersion',
        category: 'navigator',
        getValue: () => navigator.appVersion
    },
    {
        id: 'navigator.appCodeName',
        category: 'navigator',
        getValue: () => navigator.appCodeName
    },
    {
        id: 'navigator.language',
        category: 'navigator',
        getValue: () => navigator.language
    },
    {
        id: 'navigator.languages',
        category: 'navigator',
        getValue: () => navigator.languages
    },
    {
        id: 'navigator.platform',
        category: 'navigator',
        getValue: () => navigator.platform
    },
    {
        id: 'navigator.vendor',
        category: 'navigator',
        getValue: () => navigator.vendor
    },
    {
        id: 'navigator.vendorSub',
        category: 'navigator',
        getValue: () => navigator.vendorSub
    },
    {
        id: 'navigator.mimeTypes',
        category: 'navigator',
        getValue: () => Array.from(navigator.mimeTypes).map(mtype => mtype.type)
    },
    {
        id: 'navigator.cookieEnabled',
        category: 'navigator',
        getValue: () => navigator.cookieEnabled
    },
    {
        id: 'navigator.doNotTrack',
        category: 'navigator',
        getValue: () => navigator.doNotTrack
    },
    {
        id: 'navigator.maxTouchPoints',
        category: 'navigator',
        getValue: () => navigator.maxTouchPoints
    },
    {
        id: 'navigator.connection',
        category: 'navigator',
        getValue: () => ({
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData,
        })
    },
    {
        id: 'navigator.storage.estimate()',
        category: 'navigator',
        getValue: () => navigator.storage.estimate()
    },
    {
        id: 'navigator.plugins',
        category: 'navigator',
        getValue: () => Array.from(navigator.plugins).map(p => ({
            name: p.name,
            filename: p.filename,
            description: p.description,
        }))
    },
    {
        id: 'navigator.javaEnabled()',
        category: 'navigator',
        getValue: () => navigator.javaEnabled()
    },
    {
        id: 'navigator.getBattery()',
        category: 'navigator',
        getValue: () => navigator.getBattery().then(b => ({
            charging: b.charging,
            chargingTime: b.chargingTime,
            level: b.level
        }))
    },
    {
        id: 'navigator.getGamepads()',
        category: 'navigator',
        getValue: () => {
            return Array.from(navigator.getGamepads()).map(gamepad => {
                if (!gamepad) {
                    return null;
                }
        
                return {
                    id: gamepad.id,
                    buttons: gamepad.buttons.length,
                    axes: gamepad.axes.length
                }
            });
        }
    },
    {
        id: 'navigator.permissions.query()',
        category: 'navigator',
        getValue: () => {
            function getPermissionIfKnown(pName) {
                return navigator.permissions.query({name: pName})
                    .then(r => ({name: pName, state: r.state}))
                    .catch(e => ({name: pName, state: 'failure'}))
            }

            return Promise.all([
                getPermissionIfKnown('camera'),
                getPermissionIfKnown('clipboard'),
                getPermissionIfKnown('device-info'),
                getPermissionIfKnown('geolocation'),
                getPermissionIfKnown('gyroscope'),
                getPermissionIfKnown('magnetometer'),
                getPermissionIfKnown('microphone'),
                getPermissionIfKnown('midi'),
                getPermissionIfKnown('notifications'),
                getPermissionIfKnown('persistent-storage'),
                getPermissionIfKnown('push'),
                getPermissionIfKnown('speaker'),
            ]).then(results => {
                const resultsObj = {};

                results.forEach(r => resultsObj[r.name] = r.state);

                return resultsObj;
            });
        }
    },
    {
        id: 'navigator.bluetooth.getAvailability()',
        category: 'navigator',
        getValue: () => navigator.bluetooth.getAvailability()
    },
    {
        id: 'navigator.buildID',
        category: 'navigator',
        getValue: () => navigator.buildID
    },
    {
        id: 'navigator.webdriver',
        category: 'navigator',
        getValue: () => navigator.webdriver
    },

    // window
    {
        id: 'window.devicePixelRatio',
        category: 'window',
        getValue: () => window.devicePixelRatio
    },
    {
        id: 'window.localStorage',
        category: 'window',
        getValue: () => Boolean(window.localStorage)
    },
    {
        id: 'window.sessionStorage',
        category: 'window',
        getValue: () => Boolean(window.sessionStorage)
    },
    {
        id: 'window.indexedDB',
        category: 'window',
        getValue: () => Boolean(window.indexedDB)
    },
    {
        id: 'window.innerHeight',
        category: 'window',
        getValue: () => window.innerHeight
    },
    {
        id: 'window.outerHeight',
        category: 'window',
        getValue: () => window.outerHeight
    },
    {
        id: 'window.innerWidth',
        category: 'window',
        getValue: () => window.innerWidth
    },
    {
        id: 'window.outerWidth',
        category: 'window',
        getValue: () => window.outerWidth
    },
    {
        id: 'window.openDatabase("test", "1.0", "test", 1024)',
        category: 'window',
        getValue: () => Boolean(window.openDatabase("test", "1.0", "test", 1024))
    },
    {
        id: 'window.locationbar.visible',
        category: 'window',
        getValue: () => window.locationbar.visible
    },
    {
        id: 'window.menubar.visible',
        category: 'window',
        getValue: () => window.menubar.visible
    },
    {
        id: 'window.personalbar.visible',
        category: 'window',
        getValue: () => window.personalbar.visible
    },
    {
        id: 'window.scrollbars.visible',
        category: 'window',
        getValue: () => window.scrollbars.visible
    },
    {
        id: 'window.statusbar.visible',
        category: 'window',
        getValue: () => window.statusbar.visible
    },
    {
        id: 'window.toolbar.visible',
        category: 'window',
        getValue: () => window.toolbar.visible
    },
    {
        id: 'window.offscreenBuffering',
        category: 'window',
        getValue: () => window.offscreenBuffering
    },


    // console
    {
        id: 'console.memory',
        category: 'console',
        getValue: () => ({
            jsHeapSizeLimit: console.memory.jsHeapSizeLimit,
            totalJSHeapSize: console.memory.totalJSHeapSize,
            usedJSHeapSize: console.memory.usedJSHeapSize
        })
    },

    // Performance
    {
        id: 'performance.memory',
        category: 'performance',
        getValue: () => ({
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            usedJSHeapSize: performance.memory.usedJSHeapSize
        })
    },

    // Screen
    {
        id: 'PerformanceNavigationTiming.nextHopProtocol',
        category: 'performance',
        getValue: () => performance.getEntries()[0].nextHopProtocol
    },
    {
        id: 'screen.width',
        category: 'screen',
        getValue: () => screen.width
    },
    {
        id: 'screen.height',
        category: 'screen',
        getValue: () => screen.height
    },
    {
        id: 'screen.availWidth',
        category: 'screen',
        getValue: () => screen.availWidth
    },
    {
        id: 'screen.availHeight',
        category: 'screen',
        getValue: () => screen.availHeight
    },
    {
        id: 'screen.colorDepth',
        category: 'screen',
        getValue: () => screen.colorDepth
    },
    {
        id: 'screen.pixelDepth',
        category: 'screen',
        getValue: () => screen.pixelDepth
    },
    {
        id: 'screen.availLeft',
        category: 'screen',
        getValue: () => screen.availLeft
    },
    {
        id: 'screen.availTop',
        category: 'screen',
        getValue: () => screen.availTop
    },
    {
        id: 'screen.orientation',
        category: 'screen',
        getValue: () => ({
            angle: screen.orientation.angle,
            type: screen.orientation.type
        })
    },

    // date
    {
        id: '(new Date()).getTimezoneOffset()',
        category: 'date',
        getValue: () => (new Date()).getTimezoneOffset()
    },
    {
        id: '(new Date()).toTimeString()',
        category: 'date',
        getValue: () => (new Date()).toTimeString().match('[0-9:]+ (.*)')[1]
    },

    {
        id: 'WebGLRenderingContext - static values',
        category: 'webgl',
        getValue: () => ({
            ALIASED_LINE_WIDTH_RANGE: WebGLRenderingContext.ALIASED_LINE_WIDTH_RANGE,
            ALPHA_BITS: WebGLRenderingContext.ALPHA_BITS,
            BLUE_BITS: WebGLRenderingContext.BLUE_BITS,
            DEPTH_BITS: WebGLRenderingContext.DEPTH_BITS,
            GREEN_BITS: WebGLRenderingContext.GREEN_BITS,
            RED_BITS: WebGLRenderingContext.RED_BITS,
            MAX_COMBINED_TEXTURE_IMAGE_UNITS: WebGLRenderingContext.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
            MAX_CUBE_MAP_TEXTURE_SIZE: WebGLRenderingContext.MAX_CUBE_MAP_TEXTURE_SIZE,
            MAX_FRAGMENT_UNIFORM_VECTORS: WebGLRenderingContext.MAX_FRAGMENT_UNIFORM_VECTORS,
            MAX_RENDERBUFFER_SIZE: WebGLRenderingContext.MAX_RENDERBUFFER_SIZE,
            MAX_TEXTURE_IMAGE_UNITS: WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS,
            MAX_TEXTURE_SIZE: WebGLRenderingContext.MAX_TEXTURE_SIZE,
            MAX_VARYING_VECTORS: WebGLRenderingContext.MAX_VARYING_VECTORS,
            MAX_VERTEX_ATTRIBS: WebGLRenderingContext.MAX_VERTEX_ATTRIBS,
            MAX_VERTEX_TEXTURE_IMAGE_UNITS: WebGLRenderingContext.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
            MAX_VERTEX_UNIFORM_VECTORS: WebGLRenderingContext.MAX_VERTEX_UNIFORM_VECTORS,
            MAX_VIEWPORT_DIMS: WebGLRenderingContext.MAX_VIEWPORT_DIMS,
            RENDERER: WebGLRenderingContext.RENDERER,
            SHADING_LANGUAGE_VERSION: WebGLRenderingContext.SHADING_LANGUAGE_VERSION,
            VENDOR: WebGLRenderingContext.VENDOR,
            VERSION: WebGLRenderingContext.VERSION,
            VERTEX_SHADER: WebGLRenderingContext.VERTEX_SHADER,
            FRAGMENT_SHADER: WebGLRenderingContext.FRAGMENT_SHADER,
            COLOR_BUFFER_BIT: WebGLRenderingContext.COLOR_BUFFER_BIT,
            DEPTH_BUFFER_BIT: WebGLRenderingContext.DEPTH_BUFFER_BIT,
        })
    },
    {
        id: 'WebGLRenderingContext.getSupportedExtensions()',
        category: 'webgl',
        getValue: () => {
            const c = document.createElement("canvas");
            return c.getContext("webgl").getSupportedExtensions();
        }
    },
    {
        id: 'WebGLRenderingContext.getContextAttributes()',
        category: 'webgl',
        getValue: () => {
            const c = document.createElement("canvas");
            return c.getContext("webgl").getContextAttributes();
        }
    },
    {
        id: 'WebGLRenderingContext.getShaderPrecisionFormat()',
        category: 'webgl',
        getValue: () => {
            const c = document.createElement("canvas");
            const result = c.getContext("webgl").getShaderPrecisionFormat(WebGLRenderingContext.FRAGMENT_SHADER, WebGLRenderingContext.LOW_FLOAT);

            return {
                precision: result.precision,
                rangeMin: result.rangeMin,
                rangeMax: result.rangeMax
            };
        }
    },
    {
        id: 'WebGLRenderingContext.getParameter()',
        category: 'webgl',
        getValue: () => {
            const elem = document.createElement("canvas");
            const context = elem.getContext("webgl");
            const result = {};

            webglConstantsList.forEach(name => {
                result[name] = context.getParameter(context[name]);
            });

            return result;
        }
    },

    // WebRTC
    {
        id: 'RTCIceCandidate.candiate',
        category: 'webrtc',
        getValue: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const c = new RTCPeerConnection({
                iceServers: [{urls: "stun:stun.l.google.com:19302?transport=udp"}]
            });
            
            c.onicecandidate = result => {
                console.log(result.candidate);
                if (result.candidate !== null) {
                    resolve(result.candidate.candidate);
                    c.close();
                }
            };
            c.createDataChannel("");
        
            c.createOffer().then(a => {
                c.setLocalDescription(a, () => {}, () => {})
            });

            return promise;
        }
    },

    // Intl
    {
        id: 'Intl.DateTimeFormat().resolvedOptions()',
        category: 'intl',
        getValue: () => Intl.DateTimeFormat().resolvedOptions()
    },

    // fonts
    {
        id: 'CanvasRenderingContext2D.measureText',
        category: 'fonts',
        getValue: () => {
            // inspiration: https://www.kirupa.com/html5/detect_whether_font_is_installed.htm

            // creating our in-memory Canvas element where the magic happens
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            
            // the text whose final pixel size I want to measure
            const text = "abcdefghijklmnopqrstuvwxyz0123456789 !@#$%^&*()_-+=";
            
            // specifying the baseline font
            context.font = "72px monospace";
            
            // checking the size of the baseline text
            const baselineSize = context.measureText(text);

            return fontList.filter(fontName => {
                // specifying the font whose existence we want to check
                context.font = "72px '" + fontName + "', monospace";

                // checking the size of the font we want to check
                const newSize = context.measureText(text);

                //
                // If the size of the two text instances is the same, the font does not exist because it is being rendered
                // using the default sans-serif font
                //
                return (newSize.width !== baselineSize.width) || (newSize.height !== baselineSize.height);
            });
        }
    },
    {
        id: 'document.fonts.check',
        category: 'fonts',
        getValue: () => fontList.filter(font => document.fonts.check(`small "${font}"`))
    },

    // codecs
    {
        id: 'HTMLVideoElement.canPlayType()',
        category: 'codecs',
        getValue: () => {
            const video = document.createElement("video");
            const result = {};

            codecsList.forEach(codec => {
                result[codec] = video.canPlayType(codec);
            });

            return result;
        }
    },
    {
        id: 'MediaSource.isTypeSupported()',
        category: 'codecs',
        getValue: () => {
            const result = {};

            codecsList.forEach(codec => {
                result[codec] = MediaSource.isTypeSupported(codec);
            });

            return result;
        }
    },

    // speechSyntesis
    {
        id: 'speechSynthesis.getVoices()',
        category: 'speechSynthesis',
        getValue: () => {
            return speechSynthesis.getVoices().map(voice => {
                const result = {
                    name: voice.name,
                    lang: voice.lang,
                    voiceURI: voice.voiceURI
                };
        
                if (voice.default) {
                    result.default = true;
                }
        
                if (!voice.localService) {
                    result.external = true;
                }
        
                return result;
            });
        }
    },

    // Notification
    {
        id: 'Notification.permission',
        category: 'Notification',
        getValue: () => Notification.permission
    },

    // Sensors
    {
        id: 'AmbientLightSensor',
        category: 'sensors',
        getValue: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const sensor = new AmbientLightSensor();
            sensor.onreading = () => {
              resolve({illuminance: sensor.illuminance});
            };
            sensor.onerror = (event) => {
              reject(event.error.name + ': ' + event.error.message);
            };
            sensor.start();

            return promise;
        }
    },
    {
        id: 'Gyroscope',
        category: 'sensors',
        getValue: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const sensor = new Gyroscope();
            sensor.onreading = () => {
              resolve({
                  x: sensor.x,
                  y: sensor.y,
                  z: sensor.z
              });
            };
            sensor.onerror = (event) => {
              reject(event.error.name + ': ' + event.error.message);
            };
            sensor.start();

            return promise;
        }
    },
    {
        id: 'Magnetometer',
        category: 'sensors',
        getValue: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => {resolve = res; reject = rej});

            const sensor = new Magnetometer();
            sensor.onreading = () => {
              resolve({
                  x: sensor.x,
                  y: sensor.y,
                  z: sensor.z
              });
            };
            sensor.onerror = (event) => {
              reject(event.error.name + ': ' + event.error.message);
            };
            sensor.start();

            return promise;
        }
    },

    // chrome
    {
        id: 'chrome.loadTimes()',
        category: 'chrome',
        getValue: () => {
            const lt = chrome.loadTimes();

            return {
                connectionInfo: lt.connectionInfo,
                npnNegotiatedProtocol: lt.npnNegotiatedProtocol,
                wasAlternateProtocolAvailable: lt.wasAlternateProtocolAvailable,
                wasFetchedViaSpdy: lt.wasFetchedViaSpdy,
                wasNpnNegotiated: lt.wasNpnNegotiated
            };
        }
    },

    // css
    {
        id: 'any-hover: hover',
        category: 'css',
        getValue: () => window.matchMedia("(any-hover: hover)").matches
    },
    {
        id: 'any-pointer',
        category: 'css',
        getValue: () => ({
            fine: window.matchMedia("(any-pointer: fine)").matches,
            coarse: window.matchMedia("(any-pointer: coarse)").matches,
            none: window.matchMedia("(any-pointer: none)").matches,
        })
    },
    {
        id: 'color',
        category: 'css',
        getValue: () => window.matchMedia("(color)").matches
    },
    {
        id: 'color-gamut',
        category: 'css',
        getValue: () => ({
            srgb: window.matchMedia("(color-gamut: srgb)").matches,
            p3: window.matchMedia("(color-gamut: p3)").matches,
            rec2020: window.matchMedia("(color-gamut: rec2020)").matches,
        })
    },
    {
        id: 'color-index',
        category: 'css',
        getValue: () => window.matchMedia("(color-index)").matches
    },
    {
        id: 'display-mode',
        category: 'css',
        getValue: () => ({
            fullscreen: window.matchMedia("(display-mode: fullscreen)").matches,
            standalone: window.matchMedia("(display-mode: standalone)").matches,
            minimalui: window.matchMedia("(display-mode: minimal-ui)").matches,
            browser: window.matchMedia("(display-mode: browser)").matches,
        })
    },
    {
        id: 'forced-colors: active',
        category: 'css',
        getValue: () => window.matchMedia("(forced-colors: active)").matches
    },
    {
        id: 'grid: 1',
        category: 'css',
        getValue: () => window.matchMedia("(grid: 1)").matches
    },
    {
        id: 'hover: hover',
        category: 'css',
        getValue: () => window.matchMedia("(hover: hover)").matches
    },
    {
        id: 'inverted-colors: inverted',
        category: 'css',
        getValue: () => window.matchMedia("(inverted-colors: inverted)").matches
    },
    {
        id: 'monochrome',
        category: 'css',
        getValue: () => window.matchMedia("(monochrome)").matches
    },
    {
        id: 'orientation: landscape',
        category: 'css',
        getValue: () => window.matchMedia("(orientation: landscape)").matches
    },
    {
        id: 'overflow-block',
        category: 'css',
        getValue: () => ({
            scroll: window.matchMedia("(overflow-block: scroll)").matches,
            optionalpaged: window.matchMedia("(overflow-block: optional-paged)").matches,
            paged: window.matchMedia("(overflow-block: paged)").matches,
            none: window.matchMedia("(overflow-block: none)").matches,
        })
    },
    {
        id: 'overflow-inline: scroll',
        category: 'css',
        getValue: () => window.matchMedia("(overflow-inline: scroll)").matches
    },
    {
        id: 'pointer',
        category: 'css',
        getValue: () => ({
            fine: window.matchMedia("(pointer: fine)").matches,
            coarse: window.matchMedia("(pointer: coarse)").matches,
            none: window.matchMedia("(pointer: none)").matches,
        })
    },
    {
        id: 'prefers-color-scheme',
        category: 'css',
        getValue: () => ({
            dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
            light: window.matchMedia("(prefers-color-scheme: light)").matches,
        })
    },
    {
        id: 'prefers-contrast',
        category: 'css',
        getValue: () => ({
            more: window.matchMedia("(prefers-contrast: more)").matches,
            less: window.matchMedia("(prefers-contrast: less)").matches,
            nopreference: window.matchMedia("(prefers-contrast: no-preference)").matches,
        })
    },
    {
        id: 'prefers-reduced-motion: reduce',
        category: 'css',
        getValue: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
    },
    {
        id: 'prefers-reduced-transparency: reduce',
        category: 'css',
        getValue: () => window.matchMedia("(prefers-reduced-transparency: reduce)").matches
    },
    {
        id: 'scan: interlace',
        category: 'css',
        getValue: () => window.matchMedia("(scan: interlace)").matches
    },
    {
        id: 'scripting',
        category: 'css',
        getValue: () => ({
            none: window.matchMedia("(scripting: none)").matches,
            initialonly: window.matchMedia("(scripting: initial-only)").matches,
            enabled: window.matchMedia("(scripting: enabled)").matches,
        })
    },
    {
        id: 'update',
        category: 'css',
        getValue: () => ({
            none: window.matchMedia("(update: none)").matches,
            slow: window.matchMedia("(update: slow)").matches,
            fast: window.matchMedia("(update: fast)").matches,
        })
    },


    // OfflineAudioContext fingerprint
    //HTMLCanvasElement
    // TODO name: 'mediaCapabilities'}, // codecs, mime types, display
    // TODO {name: 'mediaDevices'}, // s
    // TODO {name: 'presentation'}, //TODO nees double checking
    // {name: 'getUserMedia'},
    // css

    // {
    //     proto: 'DeviceOrientationEvent',
    //     props: [
    //         {name: 'alpha'},
    //         {name: 'beta'},
    //         {name: 'gamma'},
    //         {name: 'absolute'},
    //     ],
    //     methods: []
    // },
    // {
    //     proto: 'DeviceMotionEvent',
    //     props: [
    //         {name: 'acceleration'},
    //         {name: 'accelerationIncludingGravity'},
    //         {name: 'rotationRate'}
    //     ],
    //     methods: []
    // },
    // {
    //     proto: 'WheelEvent',
    //     props: [
    //         {name: 'deltaX'},
    //         {name: 'deltaY'},
    //         {name: 'deltaZ'}
    //     ],
    //     methods: []
    // },
    // {
    //     proto: 'Touch',// behavioral fingerprinting,
    //     props: [
    //         {name: 'force'},
    //         {name: 'radiusX'},
    //         {name: 'radiusY'},
    //         {name: 'rotationAngle'}
    //     ],
    //     methods: []
    // },
    // {
    //     proto: 'KeyboardEvent',
    //     props: [
    //         {name: 'code'},// behavioral fingerprinting, keyboard layout
    //         {name: 'keyCode'},// behavioral fingerprinting, keyboard layout
    //     ],
    //     methods: []
    // },
        // {// works only on mobile
        //     proto: 'TouchEvent',
        //     props: [],
        //     methods: [
        //         {
        //             name: 'constructor',
        //             test: 'document.createEvent("TouchEvent")'
        //         }// testing touch capabilities
        //     ]
        // },
];