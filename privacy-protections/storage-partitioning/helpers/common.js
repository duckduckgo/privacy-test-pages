/* exported THIRD_PARTY_HOSTNAME THIRD_PARTY_HTTP THIRD_PARTY_HTTPS FIRST_PARTY_HOSTNAME FIRST_PARTY_HTTP FIRST_PARTY_HTTPS */
const isLocalTest = window.location.hostname.endsWith('.example');

const THIRD_PARTY_HOSTNAME = isLocalTest ? 'third-party.example' : 'good.third-party.site';
const THIRD_PARTY_HTTP = isLocalTest ? `http://${THIRD_PARTY_HOSTNAME}:3000` : `http://${THIRD_PARTY_HOSTNAME}`;
const THIRD_PARTY_HTTPS = `https://${THIRD_PARTY_HOSTNAME}:443`;

const FIRST_PARTY_HOSTNAME = isLocalTest ? 'first-party.example' : 'privacy-test-pages.glitch.me';
const FIRST_PARTY_HTTP = isLocalTest ? `http://${FIRST_PARTY_HOSTNAME}:3000` : `http://${THIRD_PARTY_HOSTNAME}`;
const FIRST_PARTY_HTTPS = `https://${FIRST_PARTY_HOSTNAME}`;
