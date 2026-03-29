# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

DuckDuckGo Privacy Test Pages — a collection of static + server-rendered pages for testing browser privacy/security features. Single Express.js server, no database, no build step.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm ci` |
| Lint (= test) | `npm test` |
| Start dev server | `node server.js` (port 3000, binds `127.0.0.1`) |

### Non-obvious notes

- `npm test` only runs ESLint (JS + HTML). There are no unit/integration tests.
- The server auto-detects mkcert `.pem` files in the project root for optional HTTPS; no setup needed for plain HTTP development.
- Two dependencies (`@duckduckgo/content-scope-scripts`, `@duckduckgo/eslint-config`) are fetched directly from GitHub via `git+https` URLs. `npm ci` requires network access to GitHub.
- `eslint.config.mjs` uses ESM flat config; the `@duckduckgo/eslint-config` package is the base config, with `@html-eslint/eslint-plugin` added for `.html` files.
- The server binds to `127.0.0.1` by default. Override with `HOST=0.0.0.0` if needed.
- `PORT` defaults to `3000`; override via `PORT` env var.
- No `.env` file is used. The only env vars consumed are `PORT`, `HOST`, and `SECRET` (Glitch webhook, not needed for local dev).
