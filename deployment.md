# Deployment

This project currently coexists on [Github Pages](https://duckduckgo.github.io/privacy-test-pages/) and on [Glitch](https://privacy-test-pages.glitch.me).

## Github Pages

Deployment to Github Pages happens automatically after changes are merged to `gh-pages` branch.

## Glitch

Some Privacy Protection test pages may not fully work on Github Pages though bacause they require a back-end (see server.js file in this repo).For that reason we are also deploying this page on Glitch. Currently updates on Glitch are manual:
1. Log in to Glitch, make sure you are part of the duckduckgo team on glitch
1. Go to the project - https://glitch.com/edit/#!/privacy-test-pages
1. Click `Tools -> Import and Export -> Import from Github` and provide name of this repo (`duckduckgo/privacy-test-pages`).
1. Code will update and deploy imadiatelly.