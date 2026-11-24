# Writing a Buddy World plugin

A plugin is one `.js` file in `plugins/`. Buddy World loads every file listed in `plugins/index.json`.
Your file talks to the app only through **`window.BuddyWorld`** (called `BW` below), so the core can change without breaking you.

## Smallest working plugin
```js
(function () {
  const BW = window.BuddyWorld;
  BW.addLayer({
    id: 'hello', name: 'Hello', emoji: '👋', description: 'My first plugin',
    load() {
      BW.pin('pl_hello', { lat: BW.place.lat, lon: BW.place.lon, emoji: '👋', label: 'Hello!',
        onTap: () => BW.card({ title: '👋 Hello', html: '<div>It works!</div>' }) });
    }
  });
})();
```
Your layer appears in **Layers → 🧩 Community plugins**. Pins use the layer id with `pl_` in front.

## The API
| Call | What it does |
|---|---|
| `BW.addLayer({id, name, emoji, description, author, load(), unload(), defaultOn})` | A toggle in Layers. `load()` runs when switched on (and again for each new place). Can be `async`. |
| `BW.addButton({name, emoji, description, onClick()})` | A one-tap action in Layers |
| `BW.pin(layerId, {lat, lon, emoji, label, height, color, onTap})` | A labelled pin. `layerId` = `'pl_' + your id` |
| `BW.clearPins(layerId)` | Remove your pins |
| `BW.card({title, html, image, link, linkText})` | Open the info card. Escape outside text with `BW.escape()` |
| `BW.hint(text)` · `BW.say(text)` | Small message · Buddy's speech bubble |
| `BW.getJSON(url)` | Fetch JSON (the API must allow browser requests, i.e. CORS) |
| `BW.overpass(query)` | OpenStreetMap Overpass query; `{{bbox}}` = the loaded area |
| `BW.bbox()` | `{south, west, north, east}` of the loaded area |
| `BW.place` | `{name, city, lat, lon, radius, country, isLondon}` |
| `BW.buddy` | Buddy's position `{lat, lon, x, z}` |
| `BW.time` | `{hour, sun, weather, air, wind}` (live data when loaded) |
| `BW.city` | `{buildings, pois, roads, buildingAt(x,z)}` from OpenStreetMap |
| `BW.flyTo(lat, lon, zoom)` · `BW.walkTo(lat, lon, name)` | Move the camera · route Buddy there |
| `BW.onTick(fn(dt))` · `BW.onCityLoaded(fn(place))` · `BW.onReset(fn)` | Hooks for animation and new places |
| `BW.THREE, BW.scene, BW.world, BW.camera` | Full three.js access for 3D (advanced; `world` is cleared on each new place) |
| `BW.toLocal(lat, lon)` · `BW.toLatLon(x, z)` | Convert between map and 3D coordinates (metres, x = east, z = south) |

## Good data sources for plugins (free, work in the browser)
OpenStreetMap Overpass · Wikidata SPARQL · Wikipedia · TfL API · Open-Meteo · iNaturalist · GBIF · data.police.uk · planning.data.gov.uk · postcodes.io · Environment Agency · USGS · NASA. See the full list in the project's data sheet.

## Checklist
- Works when the API fails or returns nothing (show `BW.hint`, never crash)
- Credits the data source in the card
- No personal data about private people; no secret API keys in the file
- Runs `node build.mjs --check` ✅
