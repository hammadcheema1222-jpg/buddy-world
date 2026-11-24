/* Catch It offline helper: the app itself is cached (stale-while-revalidate);
   live data is network-first with the last good answer as a fallback, so it still opens underground. */
const SHELL = 'catchit-shell-1795559079', DATA = 'catchit-data-v1';
const FILES = ['./', 'index.html', 'map.html', 'station.html', 'share.html', 'ui.css', 'mapstyle.js', 'world3d.js', 'data/stations.json', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/api\.tfl\.gov\.uk|raildata\.org\.uk|open-meteo\.com/.test(u.host)) {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(DATA).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then(m => m || Response.error())));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(caches.open(SHELL).then(c => c.match(r, {ignoreSearch: true}).then(hit => { const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit); return hit || net; })));
  }
});
