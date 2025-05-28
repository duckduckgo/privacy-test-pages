/* eslint-disable node/no-callback-literal */
const random = Math.random();
const startButton = document.querySelector('#start');

const BAT_DOMAINS = ['bat.bing.com', 'bat.bing.net'];

// object that contains results of all tests
const results = {
    page: 'bing-bat-blocking',
    results: []
};

/**
 * List of tests for each BAT domain testing different request methods
 */
function createTestsForDomain(domain) {
    if (domain === 'bat.bing.com') {
        return [
            {
                domain: domain,
                id: 'bat-js',
                description: `Try loading the main BAT script from ${domain}`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const script = document.createElement('script');
                        script.src = `https://${domain}/bat.js?${random}`;

                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        script.onload = () => {
                            clearTimeout(timeout);
                            resolve('loaded');
                        };

                        script.onerror = () => {
                            clearTimeout(timeout);
                            resolve('failed');
                        };

                        document.head.appendChild(script);
                    });
                }
            },
            {
                domain: domain,
                id: 'action-script',
                description: `Try loading an action script from ${domain}`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const script = document.createElement('script');
                        script.src = `https://${domain}/p/action/123456789.js?${random}`;

                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        script.onload = () => {
                            clearTimeout(timeout);
                            resolve('loaded');
                        };

                        script.onerror = () => {
                            clearTimeout(timeout);
                            resolve('failed');
                        };

                        document.head.appendChild(script);
                    });
                }
            },
            {
                domain: domain,
                id: 'fetch-bat',
                description: `Try requesting the BAT script from ${domain} using fetch()`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        fetch(`https://${domain}/bat.js?${random}`)
                            .then(response => {
                                clearTimeout(timeout);
                                if (response.ok || response.status === 200) {
                                    resolve('loaded');
                                } else {
                                    resolve('failed');
                                }
                            })
                            .catch(error => {
                                clearTimeout(timeout);
                                resolve('failed');
                            });
                    });
                }
            },
            {
                domain: domain,
                id: 'xhr-bat',
                description: `Try requesting the BAT script from ${domain} using XMLHttpRequest`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const xhr = new XMLHttpRequest();

                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        xhr.onload = () => {
                            clearTimeout(timeout);
                            resolve('loaded');
                        };

                        xhr.onerror = () => {
                            clearTimeout(timeout);
                            resolve('failed');
                        };

                        xhr.ontimeout = () => {
                            clearTimeout(timeout);
                            resolve('failed');
                        };

                        try {
                            xhr.open('GET', `https://${domain}/bat.js?${random}`, true);
                            xhr.timeout = 5000;
                            xhr.send();
                        } catch (error) {
                            clearTimeout(timeout);
                            resolve('failed');
                        }
                    });
                }
            },
            {
                domain: domain,
                id: 'iframe-bat',
                description: `Try loading content from ${domain} using iframe`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const iframe = document.createElement('iframe');
                        iframe.src = `https://${domain}/bat.js?${random}`;
                        iframe.style.display = 'none';

                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        iframe.onload = () => {
                            clearTimeout(timeout);
                            resolve('loaded');
                        };

                        iframe.onerror = () => {
                            clearTimeout(timeout);
                            resolve('failed');
                        };

                        document.body.appendChild(iframe);
                    });
                }
            },
            {
                domain: domain,
                id: 'sendBeacon',
                description: `Try sending data to ${domain} using navigator.sendBeacon()`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        if (!navigator.sendBeacon) {
                            resolve('failed');
                            return;
                        }

                        try {
                            const success = navigator.sendBeacon(`https://${domain}/actionp/0?test=${random}`, 'test=data');
                            if (success) {
                                resolve('loaded');
                            } else {
                                resolve('failed');
                            }
                        } catch (error) {
                            resolve('failed');
                        }
                    });
                }
            }
        ];
    } else if (domain === 'bat.bing.net') {
        return [
            {
                domain: domain,
                id: 'action-ping',
                description: `Try making an action request to ${domain}`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        fetch(`https://${domain}/actionp/0?ti=123456789&test=${random}`, {
                            method: 'POST',
                            body: 'test=data'
                        })
                            .then(response => {
                                clearTimeout(timeout);
                                // bat.bing.net typically returns 204 for tracking pixels
                                if (response.status === 204 || response.ok) {
                                    resolve('loaded');
                                } else {
                                    resolve('failed');
                                }
                            })
                            .catch(error => {
                                clearTimeout(timeout);
                                resolve('failed');
                            });
                    });
                }
            },
            {
                domain: domain,
                id: 'action-get',
                description: `Try making a GET request to ${domain}`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        fetch(`https://${domain}/action/0?ti=123456789&test=${random}`)
                            .then(response => {
                                clearTimeout(timeout);
                                if (response.status === 204 || response.ok) {
                                    resolve('loaded');
                                } else {
                                    resolve('failed');
                                }
                            })
                            .catch(error => {
                                clearTimeout(timeout);
                                resolve('failed');
                            });
                    });
                }
            },
            {
                domain: domain,
                id: 'xhr-action',
                description: `Try making an XMLHttpRequest to ${domain}`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const xhr = new XMLHttpRequest();

                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        xhr.onload = () => {
                            clearTimeout(timeout);
                            resolve('loaded');
                        };

                        xhr.onerror = () => {
                            clearTimeout(timeout);
                            resolve('failed');
                        };

                        xhr.ontimeout = () => {
                            clearTimeout(timeout);
                            resolve('failed');
                        };

                        try {
                            xhr.open('GET', `https://${domain}/action/0?ti=123456789&test=${random}`, true);
                            xhr.timeout = 5000;
                            xhr.send();
                        } catch (error) {
                            clearTimeout(timeout);
                            resolve('failed');
                        }
                    });
                }
            },
            {
                domain: domain,
                id: 'sendBeacon-net',
                description: `Try sending data to ${domain} using navigator.sendBeacon()`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        if (!navigator.sendBeacon) {
                            resolve('failed');
                            return;
                        }

                        try {
                            const success = navigator.sendBeacon(`https://${domain}/actionp/0?ti=123456789&test=${random}`, 'test=data');
                            if (success) {
                                resolve('loaded');
                            } else {
                                resolve('failed');
                            }
                        } catch (error) {
                            resolve('failed');
                        }
                    });
                }
            },
            {
                domain: domain,
                id: 'tracking-endpoint',
                description: `Test tracking endpoint on ${domain}`,
                testFunction: () => {
                    return new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            resolve('failed');
                        }, 5000);

                        // Test the actual tracking endpoint - if it's blocked we'll get a network error
                        // If it's not blocked, we'll get some response (even if it's an HTTP error)
                        fetch(`https://${domain}/action/0?ti=123456&test=${random}`, {
                            mode: 'no-cors'
                        })
                            .then(response => {
                                clearTimeout(timeout);
                                // Any response (even error codes) means the request wasn't blocked
                                resolve('loaded');
                            })
                            .catch(error => {
                                clearTimeout(timeout);
                                // Network errors usually indicate blocking
                                if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                                    resolve('failed'); // Likely blocked
                                } else {
                                    resolve('loaded'); // Got a response, just an HTTP error
                                }
                            });
                    });
                }
            }
        ];
    }

    return [];
}

/**
 * Run all tests and display results
 */
async function runTests() {
    startButton.disabled = true;
    startButton.textContent = 'Running tests...';

    results.results = [];

    // Clear previous results
    document.querySelector('#bat-bing-com-results').innerHTML = '';
    document.querySelector('#bat-bing-net-results').innerHTML = '';

    for (const domain of BAT_DOMAINS) {
        const tests = createTestsForDomain(domain);
        const resultsContainer = document.querySelector(`#${domain.replace(/\./g, '-')}-results`);

        for (const test of tests) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class='test-item'>
                    <div class='status'></div>
                    <strong>${test.id}</strong>: ${test.description}
                    <span class='result-text'>Testing...</span>
                </div>
            `;
            resultsContainer.appendChild(listItem);

            const statusDiv = listItem.querySelector('.status');
            const resultText = listItem.querySelector('.result-text');

            try {
                const result = await test.testFunction();

                statusDiv.className = `status ${result}`;
                resultText.textContent = result === 'loaded' ? 'LOADED (tracking not blocked)' : 'BLOCKED (good)';

                results.results.push({
                    domain: test.domain,
                    test: test.id,
                    result: result,
                    description: test.description
                });

            } catch (error) {
                statusDiv.className = 'status failed';
                resultText.textContent = 'BLOCKED (good)';

                results.results.push({
                    domain: test.domain,
                    test: test.id,
                    result: 'failed',
                    description: test.description,
                    error: error.message
                });
            }

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    startButton.disabled = false;
    startButton.textContent = 'Start the test';

    // Summary
    const totalTests = results.results.length;
    const blockedTests = results.results.filter(r => r.result === 'failed').length;
    const loadedTests = results.results.filter(r => r.result === 'loaded').length;

    const summaryDiv = document.createElement('div');
    summaryDiv.innerHTML = `
        <h2>Summary</h2>
        <p><strong>Total tests:</strong> ${totalTests}</p>
        <p><strong>Blocked requests (good):</strong> ${blockedTests}</p>
        <p><strong>Loaded requests (bad):</strong> ${loadedTests}</p>
        <p><strong>Protection effectiveness:</strong> ${((blockedTests / totalTests) * 100).toFixed(1)}%</p>
    `;
    document.querySelector('#test-results').appendChild(summaryDiv);
}

// Event listeners
startButton.addEventListener('click', runTests);

// Auto-start message
window.addEventListener('load', () => {
    console.log('Bing BAT Request Blocking Test loaded. Click "Start the test" to begin.');
});