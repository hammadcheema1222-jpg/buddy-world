# Security & cost policy

## Buddy World costs nothing to run
- Hosted on **GitHub Pages** (free for public repositories).
- Every data source is **free and called from the visitor's own browser**, so heavy use never creates a bill for the project.
- No paid APIs, no billing accounts, no secret keys. A few services use public demo keys (NASA `DEMO_KEY`, Europeana `api2demo`) that are free and simply rate-limited.
- Sources that need a personal key (e.g. Adzuna jobs) ask **the user** to paste their own free key, which is stored only in their browser.
- The automatic check (`scripts/no-cost-check.mjs`) **blocks any change** that adds a paid service or a secret key.
- GitHub Actions minutes are free for public repositories; jobs have short time limits.

## Reporting a problem
Found a security issue (for example a plugin that leaks data)? Please use **Security → Report a vulnerability** on GitHub instead of a public issue.

## Plugins
Plugins listed in `plugins/index.json` are reviewed before merging. "Try a plugin from a link" runs code only in the tester's own browser and is never saved.
