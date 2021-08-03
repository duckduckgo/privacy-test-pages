/* globals applyFpExampleDataToCanvas  */

// object that contains results of all tests
const results = {
    page: 'fingerprinting',
    date: null,
    didFail: false,
    complete: false,
    fails: [],
    results: []
};

function createCanvas (width, height) {
    const canvasElement = document.createElement('canvas');
    canvasElement.width = width;
    canvasElement.height = height;
    canvasElement.style.display = 'none';
    return canvasElement;
}

// Writes code input into the pixel data on a canvas, returned is a data URL of the image data for the canvas.
function generateDataURLWithCode (codeInput, alpha = 255) {
    const encodedCode = btoa(codeInput);
    const canvasElement = createCanvas(16, 16);
    const canvasContext = canvasElement.getContext('2d');
    const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
    let index = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = encodedCode.charCodeAt(index) || 255;
        // The browser optimises away transparent pixels so set alpha to fully opaque
        // If there's alpha it'll not be consistent even in non fp protected browsers too
        imageData.data[i + 3] = alpha;
        ++index;
    }
    canvasContext.putImageData(imageData, 0, 0);
    return canvasElement.toDataURL();
}

const tests = [
    // Render a random 4k canvas and then get the performance of getting the pixels
    {
        id: 'random noise performance',
        category: 'performance',
        value: async () => {
            const limit = 300;
            const canvasElement = createCanvas(3840, 2160);
            const canvasContext = canvasElement.getContext('2d');
            const before = performance.now();
            const canvasData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const after = performance.now();
            const time = after - before;
            ok(time < limit, `Getting image data must be under ${limit}ms (${time})`);

            for (let i = 0; i < canvasData.data.length; i++) {
                canvasData.data[i] = Math.floor(Math.random() * 256);
            }
            canvasContext.putImageData(canvasData, 0, 0);

            const before2 = performance.now();
            const canvasData2 = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const after2 = performance.now();
            const time2 = after2 - before2;
            ok(time2 < limit, `Getting image data must be under ${limit}ms (${time2})`);

            // Validate canvas caching didn't return blank pixels here
            // We can't check for equality as the browser may modify on put.
            ok(canvasData2.data.find((v) => v !== 0), 'Data in image must not be blank');
            return time2;
        }
    },

    {
        id: 'fp example performance',
        category: 'performance',
        value: async () => {
            const limit = 200;
            const canvasElement = createCanvas(2000, 200);
            const canvasContext = canvasElement.getContext('2d');
            const before = performance.now();
            const canvasData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const after = performance.now();
            const time = after - before;
            ok(time < limit, `Getting image data must be under ${limit}ms (${time})`);
            ok(canvasData.data.find((v) => v === 0) === 0, 'Data in image must be blank');

            const beforeDraw = performance.now();
            applyFpExampleDataToCanvas(canvasElement);
            const afterDraw = performance.now();
            const timeDraw = afterDraw - beforeDraw;
            ok(timeDraw < limit, `Drawing image data must be under ${limit}ms (${timeDraw})`);

            const before2 = performance.now();
            const canvasData2 = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const after2 = performance.now();
            const time2 = after2 - before2;
            ok(time2 < limit, `Getting image data must be under ${limit}ms (${time2})`);

            // Validate canvas caching didn't return blank pixels here
            // We can't check for equality as the browser may modify on put.
            ok(canvasData2.data.find((v) => v !== 0), 'Data in image must not be blank');
            return time2;
        }
    },

    {
        id: 'fp example heavy draw performance',
        category: 'performance',
        value: async () => {
            const limit = 250;
            const canvasElement = createCanvas(2000, 200);
            const canvasContext = canvasElement.getContext('2d');
            const before = performance.now();
            const canvasData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const after = performance.now();
            const time = after - before;
            ok(time < limit, `Getting image data must be under ${limit}ms (${time})`);
            ok(canvasData.data.find((v) => v === 0) === 0, 'Data in image must be blank');

            // Draw many times, the cost shouldn't be linear so after the first calls make each draw cost 1ms
            const multiplier = 1000;
            const drawLimit = limit + ((multiplier - 1) * 1);
            let timeDraw = 0;
            for (let i = 0; i < multiplier; i++) {
                const beforeDraw = performance.now();
                applyFpExampleDataToCanvas(canvasElement);
                const afterDraw = performance.now();
                timeDraw += afterDraw - beforeDraw;
            }
            ok(timeDraw < drawLimit, `Drawing image data ${multiplier} times must be under ${drawLimit}ms (${timeDraw})`);

            const before2 = performance.now();
            const canvasData2 = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const after2 = performance.now();
            const time2 = after2 - before2;
            ok(time2 < limit, `Getting image data must be under ${limit}ms (${time2})`);

            // Validate canvas caching didn't return blank pixels here
            // We can't check for equality as the browser may modify on put.
            ok(canvasData2.data.find((v) => v !== 0), 'Data in image must not be blank');
            return time2;
        }
    },

    {
        id: 'fp example performance getImageData heavy',
        category: 'performance',
        value: async () => {
            const limit = 200;
            const canvasElement = createCanvas(2000, 200);
            const canvasContext = canvasElement.getContext('2d');
            const before = performance.now();
            const canvasData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const after = performance.now();
            const time = after - before;
            ok(time < limit, `Getting image data must be under ${limit}ms (${time})`);
            ok(canvasData.data.find((v) => v === 0) === 0, 'Data in image must be blank');

            const beforeDraw = performance.now();
            applyFpExampleDataToCanvas(canvasElement);
            const afterDraw = performance.now();
            const timeDraw = afterDraw - beforeDraw;
            ok(timeDraw < limit, `Drawing image data must be under ${limit}ms (${timeDraw})`);

            let timeAll = 0;
            let canvasData2;
            const multiplier = 100;
            const multipleLimit = 4.5;
            // The cost for this shouldn't be linear based on `limit` there is a base cost that all browsers have but on successive calls the cost of hashing shouldn't add up to create slowdown.
            const timeLimit = (multipleLimit * (multiplier - 1)) + limit;
            for (let i = 0; i < multiplier; i++) {
                const before2 = performance.now();
                canvasData2 = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
                const after2 = performance.now();
                const time2 = after2 - before2;
                timeAll += time2;
            }
            ok(timeAll < timeLimit, `Getting image data ${multiplier} times must be under ${timeLimit}ms (${timeAll})`);

            // Validate canvas caching didn't return blank pixels here
            // We can't check for equality as the browser may modify on put.
            ok(canvasData2.data.find((v) => v !== 0), 'Data in image must not be blank');
            return timeAll;
        }
    },

    // Load a known pixel image and check the values when rendered to the canvas
    {
        id: 'known pixel render',
        category: 'correctness',
        value: async () => {
            const limit = 25;
            const image = document.createElement('img');
            image.src = './pixel.gif';
            let res;
            const promise = new Promise((resolve) => {
                res = resolve;
            });
            image.onload = (e) => {
                const refImage = e.target;
                const canvasElement = createCanvas(refImage.width, refImage.height);
                const canvasContext = canvasElement.getContext('2d');
                canvasContext.drawImage(refImage, 0, 0);
                const before = performance.now();
                const canvasData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
                const after = performance.now();
                eq(canvasData.data[0], 18, 'Red should be 18');
                eq(canvasData.data[1], 18, 'Blue should be 18');
                eq(canvasData.data[2], 255, 'Green should be 255');
                eq(canvasData.data[3], 255, 'Alpha should be 255');
                const time = after - before;
                ok(time < limit, `Getting image data must be under ${limit}ms (${time})`);
                const knownOutputUrls = [
                    // Firefox
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWMQEvr/HwADgAIj6OBrXgAAAABJRU5ErkJggg==',

                    // Chrome
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjEBL6/x8AA4ACI+VyxooAAAAASUVORK5CYII=',

                    // Safari
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAADUlEQVQIHWMQEvr/HwADgAIjiyE/wQAAAABJRU5ErkJggg=='
                ];
                const value = canvasElement.toDataURL();
                ok(knownOutputUrls.includes(value), 'Output conversion has expected values');
                res(value);
            };
            document.body.appendChild(image);
            return promise;
        }
    },

    // Writes code into a first canvas, to push it into an image.
    // The image is then placed into another canvas and the pixels are read to build an eval string.
    {
        category: 'correctness',
        id: 'read canvas into image and back into canvas',
        value: async () => {
            const secretKey = 'secretKeyHereJustCheckThatThisIsCorrect';
            const dataURL = generateDataURLWithCode(`codeCallback('${secretKey}')`);
            const image = document.createElement('img');
            image.src = dataURL;
            let res;
            const promise = new Promise((resolve) => {
                res = resolve;
            });
            // Once the image has loaded we can push it into a new canvas
            // to read the data back out and eval it
            image.onload = (e) => {
                const refImage = e.target;
                const canvasElement = createCanvas(refImage.width, refImage.height);
                let codeOutput = '';
                const canvasContext = canvasElement.getContext('2d');
                canvasContext.drawImage(refImage, 0, 0);
                const canvasData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
                for (let i = 0; i < canvasData.data.length; i += 4) {
                    const item = canvasData.data[i];
                    codeOutput += (item && item < 250) ? String.fromCharCode(item) : '';
                }
                window.codeCallback = (value) => {
                    ok(value === secretKey, 'Triggered callback must pass correct key');
                    res(value);
                };
                try {
                    // Eval the code
                    // eslint-disable-next-line no-new-func
                    new Function(unescape(decodeURIComponent(window.atob(codeOutput))))();
                } catch (e) {
                    fail('Threw error', e);
                }
            };
            document.body.appendChild(image);
            return promise;
        }
    },

    // Generate canvas data and compare the rendered output to known strings to check the effects of hardware and software within the rendering
    // If we end up with lots of different values here then this is a vector we should protect against.
    {
        id: 'known string render',
        category: 'correctness',
        value: () => {
            // Use low alpha value
            const dataURL = generateDataURLWithCode('let thisIsATest = true', 20);
            // These hard coded values will break whenever rendering engines change.
            const expectedValues = [
                // Chrome
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAGRJREFUOE/tk8EJgFAMQ1/vevsXHcAFnMYF3NYFHEAH+N6VQESvgscGCqVNEyhtzFB2oAFWoOfBAFTH4XIHLEALKI8JinoibBa4h0YPyUBQX6LiiiPEaYGX8ac0BXKJeUg/PdMF1VQd3DIA/GoAAAAASUVORK5CYII=',

                // Firefox
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASUlEQVQ4jWNIY2AQ8WVgEIlkYBAxhrJh/GIGBpE0KDsSKp6GpC6SgUGEAVkBsgHGSAYgi8HUO0Axw38GBhFK8KgBowaMGkAlAwDBZP1nmrh9oAAAAABJRU5ErkJggg==',

                // Safari
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VXHyAAAAX0lEQVQ4EWNMY2AQec7AwMADxLeAWAqIYUANyPgMxV+ggpJA+iwQ8wIxiM0EUgDSDFMAZII1PYPSID5MDiYGswRkMeN/oAtAisgFTORqhOkbNQAYjbDAIJceNWBYBCIAAnkQLFSUm0oAAAAASUVORK5CYII='
            ];
            ok(expectedValues.includes(dataURL), `Generated code should return expected response: ${dataURL}`);
            return dataURL;
        }
    }
];

async function init () {
    results.date = (new Date()).toUTCString();
    for (const test of tests) {
        insertResultRow('category', [test.category, test.id]);
        let value = null;
        try {
            value = await Promise.resolve(test.value());
        } catch (e) {
            fail('Test code threw', e);
        }
        results.results.push({
            id: test.id,
            value,
            category: test.category
        });
        await new Promise((resolve) => {
            setTimeout(resolve, 100);
        });
    }
    results.complete = true;
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        init();
    }, 1000);
});

/* test utils */
function fail (...args) {
    results.didFail = true;
    results.fails.push(args);
    insertResultRow('fail', args);
}

function pass (...args) {
    insertResultRow('pass', args);
}

function insertResultRow (statusText, notes) {
    const table = document.getElementById('results-table');
    const row = table.insertRow(-1);
    row.className = 'status-' + statusText;
    const resultCell = row.insertCell(0);
    resultCell.textContent = statusText;
    if (statusText === 'category') {
        resultCell.textContent = notes.shift();
    }
    const notesCell = row.insertCell(1);
    notesCell.textContent = notes.join(',\n');
}

function eq (val1, val2, ...args) {
    ok(val1 === val2, `Expect value '${val1}' to equal '${val2}'`);
}

function ok (val, ...args) {
    if (!val) {
        fail(...args);
    } else {
        pass(...args);
    }
}
