<p align="center"><img src="assets/logo.svg" width="120" alt="Buddy World logo"></p>
<h1 align="center">Buddy World</h1>
<p align="center">Explore any real city in 3D with your Buddy: live buses, street names, history, nature, science and public data.<br>
<b><a href="https://hammadcheema1222-jpg.github.io/buddy-world/">▶ Open Buddy World</a></b> · <a href="PLUGINS.md">Write a plugin</a> · <a href="CONTRIBUTING.md">Contribute</a></p>

---

## What it is
A free, open web app (no install, works on phones) that builds real places in 3D from open data:
OpenStreetMap buildings and streets, satellite imagery, live TfL buses and trains, weather, wildlife sightings,
history, public records about places, a science lab (shadows, floods, fire, noise), and more.

| App | File | What it does |
|---|---|---|
| 🏙️ Buddy City | `city.html` (built from `src/city/`) | The main 3D city |
| 🌍 Buddy Earth Live | `live.html` | Globe with MapLibre |
| 🛰️ Buddy Earth | `earth.html` | Satellite + terrain flyover |
| 🚉 Catch It | `catch-it/` | Which train or bus can I actually catch? Live departures, race strip, live map, 3D window view, station walk-through |

## Ways to help (pick your level)
| You are… | Do this | Time |
|---|---|---|
| 🙋 A user | Report a bug or idea in [Issues](../../issues/new/choose) | 2 min |
| ✨ A vibe coder (AI helps you code) | Make a **plugin** with the ready-made prompt in [AI_PROMPT.md](AI_PROMPT.md) | 20 min |
| 🧑‍💻 A developer | Write a plugin ([PLUGINS.md](PLUGINS.md)) or improve the core in `src/city/` | 1 h+ |
| 🗺️ A mapper | Improve buildings and shops on [OpenStreetMap](https://www.openstreetmap.org): they appear here automatically | any |

## Run it on your computer
```bash
git clone https://github.com/hammadcheema1222-jpg/buddy-world.git
cd buddy-world
node build.mjs            # joins src/city/* into city.html (Node 18+, no npm install needed)
npx serve .               # or: python3 -m http.server 8000
```
Open `http://localhost:3000/city.html` (or `:8000`). Edit a file in `src/city/` or `plugins/`, run `node build.mjs`, refresh.

## How the code is organised
```
src/city/                 the Buddy City app, split by feature (joined in name order into city.html)
  00-head.html            page, styles, buttons
  01-helpers.js           3D helper functions
  02-buddy.js             the Buddy cat / panda
  03-city-core.js         loading OpenStreetMap, building the city, traffic, sky, layers
  10-…22-*.js             features (discovery layers, models, records, science lab, navigation, …)
  30-plugin-api.js        window.BuddyWorld, the API plugins use
plugins/                  community plugins (one file each) + index.json (the list that gets loaded)
assets/                   logo, 3D models (CC0), textures (CC0), self-hosted map
build.mjs                 builds city.html and checks syntax
```
Each feature file wraps the functions before it (for example `updateLayers`), so features stay separate.

## Data, privacy and licences
- Only **open data** and **public information about places and events**. Never personal data about private people (no names, phone numbers or home addresses of individuals). See [CONTRIBUTING.md](CONTRIBUTING.md#rules).
- Always credit sources. Map data © OpenStreetMap contributors (ODbL).
- Code: [MIT](LICENSE). 3D models: Quaternius & Kenney (CC0). Textures: Poly Haven (CC0). Details in `assets/CREDITS.md`.
