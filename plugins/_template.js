/* Buddy World plugin: <NAME>
   <One sentence: what it shows and where the data comes from>
   Author: <your GitHub name> · Licence: MIT · Data: <source + licence>
   Copy this file, rename it (lowercase-with-dashes.js), and add the file name to plugins/index.json */
(function () {
  const BW = window.BuddyWorld;
  if (!BW) return;

  BW.addLayer({
    id: 'my-layer',                 // short, unique, lowercase
    name: 'My layer',               // shown in Layers → 🧩 Community plugins
    emoji: '✨',
    description: 'What it shows (source)',
    author: '<your GitHub name>',
    async load() {
      // 1. Get data for the area on screen (any https JSON API that allows browser requests)
      const box = BW.bbox();        // {south, west, north, east}
      // const data = await BW.getJSON('https://example.org/api?bbox=' + [box.west, box.south, box.east, box.north].join(','));

      // 2. Put pins on the map
      BW.pin('pl_my-layer', {
        lat: BW.place.lat, lon: BW.place.lon, emoji: '✨', label: 'Hello from my plugin',
        onTap: () => BW.card({ title: '✨ Hello', html: '<div>It works! 🎉</div>' })
      });
    },
    unload() { /* optional: stop timers, remove 3D objects you added */ }
  });
})();
