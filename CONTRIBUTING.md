# Contributing to Buddy World

Thanks for helping! 🐾 Everything here is designed so you can add something **without understanding the whole app**.

## The easiest path: a plugin
A plugin is **one JavaScript file** in `plugins/` that adds a layer (pins on the map) or a button.
1. Copy `plugins/_template.js` → `plugins/your-idea.js`
2. Fill it in (see [PLUGINS.md](PLUGINS.md), or let an AI do it with [AI_PROMPT.md](AI_PROMPT.md))
3. Add `"your-idea.js"` to `plugins/index.json`
4. Test it (below), then open a Pull Request

## Changing the core
Edit the right file in `src/city/` (the names say what each does), then run `node build.mjs`.
Never edit `city.html` directly: it is generated and your change would be overwritten.

## Test before you send
- `node build.mjs --check` must say ✅ (GitHub checks this on every Pull Request too)
- Open `city.html` locally: no red errors in the browser console (F12)
- Try it on a **phone-sized** window (DevTools → device toolbar, e.g. iPhone 12)
- Try it outside London too (data may be missing: show a friendly hint, never crash)
- Testing a plugin without building: Layers → 🧩 → **Try a plugin from a link** (paste a raw GitHub link)

## Pull Requests
1. Fork → create a branch (`plugin-playgrounds`, `fix-search-postcodes`)
2. One idea per PR, with a screenshot or short video
3. Fill in the PR checklist
4. A maintainer reviews; small fixes are welcome even if you're new

## Rules
- **Open data only**, with its licence and a credit in the card or `assets/CREDITS.md`
- **No personal data about private people**: no names, phone numbers, home addresses, photos of people from social media, or anything that helps track someone. Places, events, organisations and public officials in their public role are fine.
- **Free services only, no billing.** Buddy World must cost nothing to run: no paid APIs, no services that need a credit card. The automatic check blocks them (see [SECURITY.md](SECURITY.md)).
- **No API secrets in the code.** If a source needs a key, let the user paste their own (stored only in their browser), like the Adzuna jobs key.
- **Phones first**: keep it light (no huge downloads without asking), large tap targets.
- **Be kind**: see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Good first ideas
Look for issues labelled [`good first issue`](../../labels/good%20first%20issue), or try one of these plugins:
🚲 bike parking · 🔌 EV chargers with live status · 🏟️ events at stadiums · 🌳 tree species map · 🗑️ recycling points · 🎨 street art (Wikidata) · 🚰 water fountains · 🐦 bird sounds (xeno-canto)
