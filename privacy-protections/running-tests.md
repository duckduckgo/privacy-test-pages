# Running tests

Please use [glitch](https://privacy-test-pages.glitch.me) deloyment for running tests. Some privacy protection tests don't work correctly on github pages.

# Manually

1. Go to a page and click "Start the test" button.
1. Optionally, download test results by clicking "Download the results".

# Automatically

1. Go to a page and either:
    - have `?run` in the url to run the test immadiatelly or
    - execute `runTests()` function in the global scope.
1. Read the results by looking at the `results` object in the global scope.