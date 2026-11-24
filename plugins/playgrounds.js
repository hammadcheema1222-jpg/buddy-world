/* Buddy World plugin: Playgrounds
   Shows every playground nearby from OpenStreetMap, with what equipment it has.
   Author: Buddy World team · Licence: MIT · Data: © OpenStreetMap contributors */
(function () {
  const BW = window.BuddyWorld;
  if (!BW) return;

  BW.addLayer({
    id: 'playgrounds',
    name: 'Playgrounds',
    emoji: '🛝',
    description: 'Every playground nearby, with its equipment (OpenStreetMap)',
    author: 'Buddy World',
    async load() {
      // {{bbox}} is replaced with the area that is loaded on screen
      const data = await BW.overpass('[out:json][timeout:25][bbox:{{bbox}}];(nwr["leisure"="playground"];);out center tags;');
      let n = 0;
      for (const el of data.elements || []) {
        const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
        if (lat == null) continue;
        const t = el.tags || {};
        const kit = Object.keys(t).filter(k => k.startsWith('playground:')).map(k => k.replace('playground:', '')).join(', ');
        BW.pin('pl_playgrounds', {
          lat, lon, emoji: '🛝', label: t.name || 'Playground', height: 4, color: '#2a9d3a',
          onTap: () => BW.card({
            title: '🛝 ' + (t.name || 'Playground'),
            html: (kit ? '<div><b>Equipment</b> ' + BW.escape(kit) + '</div>' : '') +
                  (t.surface ? '<div><b>Surface</b> ' + BW.escape(t.surface) + '</div>' : '') +
                  (t.min_age || t.max_age ? '<div><b>Ages</b> ' + (t.min_age || '?') + '–' + (t.max_age || '?') + '</div>' : ''),
            link: 'https://www.openstreetmap.org/' + el.type + '/' + el.id, linkText: 'OpenStreetMap record'
          })
        });
        n++;
      }
      BW.hint('🛝 ' + n + ' playgrounds nearby');
    }
  });
})();
