# Make a plugin with AI (for vibe coders) ✨

1. Copy the prompt below into Claude, ChatGPT or any coding AI.
2. Replace the **idea** line with what you want.
3. Save the answer as `plugins/your-idea.js`, add `"your-idea.js"` to `plugins/index.json`.
4. Test: open Buddy World → Layers → 🧩 → *Try a plugin from a link* (or run it locally), then open a Pull Request.

```text
You are writing a plugin for "Buddy World", a 3D map web app. Write ONE plain JavaScript file (no imports, no build step).
Wrap everything in (function(){ ... })(); and get the API with: const BW = window.BuddyWorld; if (!BW) return;

The API:
- BW.addLayer({id, name, emoji, description, author, async load(), unload()})  // toggle in Layers; load runs when switched on
- BW.addButton({name, emoji, description, async onClick()})
- BW.pin('pl_' + id, {lat, lon, emoji, label, height, color, onTap})            // labelled pin on the 3D map
- BW.card({title, html, image, link, linkText}); BW.escape(text); BW.hint(text); BW.say(text)
- BW.getJSON(url)          // fetch JSON from an API that allows browser (CORS) requests
- BW.overpass(query)       // OpenStreetMap Overpass; write {{bbox}} for the loaded area, e.g. '[out:json][bbox:{{bbox}}];nwr["amenity"="cafe"];out center tags;'
- BW.bbox() -> {south, west, north, east}; BW.place -> {name, city, lat, lon, radius, country, isLondon}; BW.buddy -> {lat, lon}
- BW.time -> {hour, weather, air, wind}; BW.flyTo(lat, lon, zoom); BW.walkTo(lat, lon, name); BW.onTick(fn(dt))

Rules: use only free open data that works without a secret key (or ask the user to paste their own key and keep it in localStorage);
handle errors and empty results with BW.hint; escape all outside text with BW.escape; credit the data source in the card;
never show personal data about private people; keep it fast on phones.
Start the file with a comment: plugin name, one-line description, author, licence MIT, data source + licence.

My idea: <DESCRIBE YOUR PLUGIN HERE, e.g. "show EV charging points nearby from OpenStreetMap, with how many plugs and the operator">
```
