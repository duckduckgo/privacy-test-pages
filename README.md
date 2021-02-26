# Privacy Test Pages
🛡 Collection of pages for testing various privacy and security features of browsers and browser extensions.

## How to use it?
The site with all tests is live [here](https://privacy-test-pages.glitch.me/). All tests run either on page load or provide instructions on how to run them.

### Privacy Protections Tests

Those tests by default require clicking a button to start, but can be run immadiatelly on page load when loaded with a `?run` query or by calling a global `runTests()` function. Results from those pages are available in the global `results` object that can be downloaded as JSON using "download results" button.

## Contributing

Please note that we are not taking external contributions for new test pages, but we welcome all bug reports.

### How to create a new test?

- Templates for both simple and complex tests (Privacy Protections Tests) can be found in the [TEMPLATES](./TEMPLATES) directory.
- Please remember to link new test page from [index.html](./index.html).
- Once you have a PR with a new page please assign it to one of the AoR DRIs (@brindy, @kdzwinel).

### Test domains

We have couple of test domains, that all resolve to `privacy-test-pages.glitch.me`, which help us simulate various scenarios:

- `good.third-party.site` - non-tracking third party, it's not on our blocklist and will not be blocked by our clients
- `broken.third-party.site` - tracking third party that we can't block (e.g. due to brekage), it's on our blocklist, but it will not be blocked by our clients
- `bad.third-party.site` - tracking third party that's on our blocklist and our clients will block

### How to test it locally

If you are working on a simple page you can start any local server (e.g. `python -m SimpleHTTPServer 8000`) in the main folder of the project.

If you are working on a complex page you may need to run our custom server (`node server.js`) which will require you to install all dependencies first (`npm i`).

## How to deploy it?

After PR is merged test pages are automatically deployed to glitch ([code](https://glitch.com/edit/#!/privacy-test-pages)) and github pages (legacy).
