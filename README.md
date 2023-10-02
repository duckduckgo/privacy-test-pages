# Privacy Test Pages
🛡 Collection of pages for testing various privacy and security features of browsers and browser extensions.

## How to use it?
The site with all tests is live [here](https://privacy-test-pages.site/). All tests run either on page load or provide instructions on how to run them.

### Privacy Protections Tests

Those tests by default require clicking a button to start, but can be run immediately on page load when loaded with a `?run` query or by calling a global `runTests()` function. Results from those pages are available in the global `results` object that can be downloaded as JSON using "download results" button.

## Contributing

Please note that we are not taking external contributions for new test pages, but we welcome all bug reports.

### How to create a new test?

- Templates for both simple and complex tests (Privacy Protections Tests) can be found in the [TEMPLATES](./TEMPLATES) directory.
- If you are adding new routes to `server.js` consider extracting them to a separate file (see the template [routes.js](./TEMPLATES/complex/server/routes.js) file).
- Please remember to link new test page from [index.html](./index.html).
- Once you have a PR with a new page please assign it to one of the AoR DRIs (@kdzwinel, @jonathanKingston).

### Test domains

We have couple of test domains, that all resolve to `privacy-test-pages.site`, which help us simulate various scenarios:

- `www.first-party.site` - an alternative first-party domain used for tests that require first-party resources on other subdomains (e.g., `hsts.first-party.site`)
- `good.third-party.site` - non-tracking third party, it's not on our blocklist and will not be blocked by our clients
- `broken.third-party.site` - tracking third party that we can't block (e.g. due to brekage), it's on our blocklist, but it will not be blocked by our clients
- `bad.third-party.site` - tracking third party that's on our blocklist and our clients will block

We also have additional test domains specifically for the Ad Attribution tests hosted [here](https://www.search-company.site):

- `www.search-company.site` - Simulated search provider
- `convert.ad-company.site` - Simulated ad provider conversion ping
- `www.ad-company.site` - Simulated ad provider non-conversion ping
- `www.payment-company.site` - Simulated payment provider
- `www.publisher-company.site`- Simulated publisher website

The ad attribution test domains resolve to a separate glitch project due to glitch domain limits (i.e., 5 domains per project). Otherwise the projects are identical.

### How to test it locally

If you are working on a simple page you can start any local server (e.g. `python -m SimpleHTTPServer 8000`) in the main folder of the project.

#### Test pages with a server-side component
Some test pages have a server-side component that must run using our custom server. First, install the dependencies (`npm -i`) and then start the server via `node server.js`.

#### Test pages that require HTTPS
Some test pages (i.e., `privacy-protections/storage-partitioning/`) require HTTPS and must load over real hostnames. This requires additional dependencies and machine/browser configuration.

##### Setting up local test domains
Many of the test pages can be visited via `http://localhost`, but browsers sometimes treat localhost differently than they would a real hostname (e.g., `example.com`). For example, it's not possible to register HSTS on `localhost`, even when loading over HTTPS.

If you're using Firefox, you can use a pref to force hostnames to resolve to `127.0.0.1`:
1. Go to `about:config`
2. Set `network.dns.localDomains` to `first-party.example,hsts.first-party.example,third-party.example,www.search-company.example,www.ad-company.example,convert.ad-company.example,www.publisher-company.example,www.payment-company.example`.

If you're testing in a browser other than Firefox, you'll have to edit your OS's hosts file to add the following lines:
```
# Privacy Test Pages (https://github.com/duckduckgo/privacy-test-pages)
127.0.0.1 www.search-company.example
127.0.0.1 www.ad-company.example
127.0.0.1 convert.ad-company.example
127.0.0.1 www.publisher-company.example
127.0.0.1 www.payment-company.example
127.0.0.1 first-party.example
127.0.0.1 hsts.first-party.example
127.0.0.1 third-party.example
```

Unfortunately neither of these approaches support wildcard subdomains, so you will need to add new subdomains as required by your tests.

##### Adding HTTPS support for test domains
On MacOS:
```
brew install mkcert
brew install nss # if you use Firefox
```

Next, run the following command to make your OS cert store and Firefox's cert store trust your cert:
```
mkcert -install
```

Then, in the root directory of `privacy-test-pages`, run:
```
mkcert first-party.example "*.first-party.example" third-party.example "*.third-party.example" search-company.example "*.search-company.example" ad-company.example "*.ad-company.example" publisher-company.example "*.publisher-company.example" payment-company.example "*.payment-company.example"
```

This will generate two files (`first-party.example+11-key.pem` and `first-party.example+11.pem`) in the root directory. Express will automatically pick these up when you start the server (`node server.js`).

## How to deploy it?

After PR is merged test pages are automatically deployed to glitch ([privacy-test-pages](https://glitch.com/edit/#!/privacy-test-pages) and [ad-attribution-test-pages](https://glitch.com/edit/#!/ad-attribution-test-pages)) and github pages (legacy).
