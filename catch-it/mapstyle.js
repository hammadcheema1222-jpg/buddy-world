/* Catch It map look: OpenFreeMap "liberty" recoloured to the platform palette
   (concrete land, white streets, quiet water, ink labels, no shop icons) + small geometry helpers. */
(function () {
  const C = {land: '#E4E6E3', park: '#D5DDD0', water: '#B7C4CB', road: '#FFFFFF', minor: '#F6F7F4', casing: '#C9CDC7', rail: '#8C929B', ink: '#1C2129', soft: '#5A616C', bld: '#D3D6D1'};
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) Object.assign(C, {land: '#1F2328', park: '#22302A', water: '#15232C', road: '#3A4048', minor: '#30353C', casing: '#1A1D21', rail: '#6B727B', ink: '#EEF0EC', soft: '#A9B0B8', bld: '#2C3138'});
  function restyle(map) {
    let layers = []; try { layers = map.getStyle().layers; } catch (e) { return; }
    const set = (id, k, v) => { try { map.setPaintProperty(id, k, v); } catch (e) {} };
    for (const l of layers) {
      const id = l.id, sl = l['source-layer'] || '';
      if (l.type === 'background') set(id, 'background-color', C.land);
      else if (l.type === 'fill' && /water/.test(sl + id)) set(id, 'fill-color', C.water);
      else if (l.type === 'fill' && /park|landcover|landuse|wood|grass/.test(sl + id)) { set(id, 'fill-color', /park|wood|grass/.test(id) ? C.park : C.land); set(id, 'fill-opacity', 0.9); }
      else if (l.type === 'fill' && /building/.test(sl + id)) set(id, 'fill-color', C.bld);
      else if (l.type === 'line' && /water/.test(sl + id)) set(id, 'line-color', C.water);
      else if (l.type === 'line' && /rail/.test(id)) set(id, 'line-color', C.rail);
      else if (l.type === 'line' && /casing/.test(id)) set(id, 'line-color', C.casing);
      else if (l.type === 'line' && /transportation|road|highway|bridge|tunnel/.test(sl + id)) set(id, 'line-color', /minor|service|path|track/.test(id) ? C.minor : C.road);
      else if (l.type === 'line' && /boundary/.test(id)) set(id, 'line-color', C.casing);
      else if (l.type === 'symbol') {
        if (/poi/.test(id)) { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {} continue; }
        set(id, 'text-color', /water/.test(id) ? '#5d7884' : C.ink); set(id, 'text-halo-color', C.land); set(id, 'text-halo-width', 1.4);
        if (/road|highway|transportation/.test(id)) set(id, 'text-color', C.soft);
      }
    }
  }
  // geodesic-ish circle polygon (ring of n points) around [lon,lat] with radius in metres
  function ring(c, r, n = 72) {
    const out = [], la = c[1] * Math.PI / 180;
    for (let i = 0; i <= n; i++) { const a = i / n * 2 * Math.PI; out.push([c[0] + r * Math.sin(a) / (111320 * Math.cos(la)), c[1] + r * Math.cos(a) / 110540]); }
    return out;
  }
  window.CIStyle = {C, restyle, ring};
})();
