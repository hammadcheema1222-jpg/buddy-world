/* Catch It · World3D
   Builds real buildings, roofs, towers and trees from OpenStreetMap "Simple 3D Buildings" tags,
   on top of real terrain. Curved footprints stay curved (every OSM vertex is kept), domes are real
   spherical domes, pitched roofs are built from the footprint's main axis, and facades get one
   window row per storey. Loaded around the camera from Overpass; free, no keys. */
(function () {
  const DEG = Math.PI / 180, LEVEL = 3.2;         // metres per storey (UK average floor-to-floor)
  const W = {on: true, status: ''};
  let three = null, group = null, loadedAt = null, busy = false, mats = null, lastNight = null;
  const hav = (a, b) => { const dLat = (b[1] - a[1]) * DEG, dLon = (b[0] - a[0]) * DEG; const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * DEG) * Math.cos(b[1] * DEG) * Math.sin(dLon / 2) ** 2; return 2 * 6371000 * Math.asin(Math.sqrt(x)); };
  const num = v => { if (v == null) return null; const m = String(v).match(/-?\d+(\.\d+)?/); if (!m) return null; let n = parseFloat(m[0]); if (/'|ft|feet/.test(v)) n *= 0.3048; return n; };
  const col = (v, d) => { try { if (v) return new THREE.Color(String(v).split(';')[0].trim().replace(/^([0-9a-f]{6})$/i, '#$1')); } catch (e) {} return new THREE.Color(d); };

  /* ---------- materials: a facade texture with one window per 3 m and one row per storey ---------- */
  function makeMats() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#4d5866'; g.fillRect(14, 18, 36, 30);
    g.fillStyle = '#e4e7ea'; g.fillRect(14, 44, 36, 4);
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
    const e = document.createElement('canvas'); e.width = 64; e.height = 64; const h = e.getContext('2d');
    h.fillStyle = '#000'; h.fillRect(0, 0, 64, 64); h.fillStyle = '#fff'; h.fillRect(14, 18, 36, 30);
    const glow = new THREE.CanvasTexture(e); glow.wrapS = glow.wrapT = THREE.RepeatWrapping;
    return {
      wall: new THREE.MeshLambertMaterial({map: tex, vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color('#ffcf87'), emissiveMap: glow, emissiveIntensity: 0}),
      roof: new THREE.MeshLambertMaterial({vertexColors: true, side: THREE.DoubleSide}),
      trunk: new THREE.MeshLambertMaterial({color: '#5b4330'}),
      leaf: new THREE.MeshLambertMaterial({color: '#3f6b35'}),
      mast: new THREE.MeshLambertMaterial({color: '#d9d9d9'})
    };
  }

  /* ---------- geometry builders ---------- */
  function Builder() { return {p: [], uv: [], c: []}; }
  function tri(B, a, b, c, color, uvs) { B.p.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) B.c.push(color.r, color.g, color.b); B.uv.push(...(uvs || [0, 0, 0, 0, 0, 0])); }
  function quad(B, a, b, c, d, color, uvs) { tri(B, a, b, c, color, uvs && [uvs[0], uvs[1], uvs[2], uvs[3], uvs[4], uvs[5]]); tri(B, a, c, d, color, uvs && [uvs[0], uvs[1], uvs[4], uvs[5], uvs[6], uvs[7]]); }
  function walls(B, ring, y0, topAt, color) {         // ring: [[x,z],...] closed or open; topAt(i) gives wall top height at vertex i
    let u = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]; const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue;
      const ta = topAt(i), tb = topAt((i + 1) % ring.length);
      quad(B, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], tb, b[1]], [a[0], ta, a[1]], color, [u / 3, y0 / LEVEL, (u + len) / 3, y0 / LEVEL, (u + len) / 3, tb / LEVEL, u / 3, ta / LEVEL]);
      u += len;
    }
  }
  function flatTop(B, outer, holes, yAt, color) {
    const v2 = r => r.map(p => new THREE.Vector2(p[0], p[1]));
    let faces; try { faces = THREE.ShapeUtils.triangulateShape(v2(outer), holes.map(v2)); } catch (e) { return; }
    const all = outer.concat(...holes), yAll = all.map((p, i) => yAt(p, i));
    for (const f of faces) tri(B, [all[f[0]][0], yAll[f[0]], all[f[0]][1]], [all[f[1]][0], yAll[f[1]], all[f[1]][1]], [all[f[2]][0], yAll[f[2]], all[f[2]][1]], color);
  }
  const centroid = r => { let x = 0, z = 0; r.forEach(p => { x += p[0]; z += p[1]; }); return [x / r.length, z / r.length]; };
  function axes(r) {                                    // main axis = direction of the longest edge
    let best = 0, ang = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; ang = Math.atan2(b[1] - a[1], b[0] - a[0]); } }
    const ux = [Math.cos(ang), Math.sin(ang)], vx = [-ux[1], ux[0]];
    const U = r.map(p => p[0] * ux[0] + p[1] * ux[1]), V = r.map(p => p[0] * vx[0] + p[1] * vx[1]);
    return {ux, vx, U, V, uMin: Math.min(...U), uMax: Math.max(...U), vMin: Math.min(...V), vMax: Math.max(...V)};
  }
  function roof(B, outer, holes, shape, wallTop, rh, color, dir) {
    if (!rh || shape === 'flat') { flatTop(B, outer, holes, () => wallTop, color); return; }
    const top = wallTop + rh;
    if (shape === 'dome' || shape === 'onion') {        // spherical profile: radius cos(t), height sin(t), every ring is the real footprint scaled to its centre
      const c = centroid(outer), N = 10; let prev = outer.map(p => [p[0], wallTop, p[1]]);
      for (let k = 1; k <= N; k++) {
        const t = k / N * Math.PI / 2, s = shape === 'onion' ? Math.cos(t) * (1 + 0.25 * Math.sin(2 * t)) : Math.cos(t), y = wallTop + rh * Math.sin(t);
        const ring = outer.map(p => [c[0] + (p[0] - c[0]) * s, y, c[1] + (p[1] - c[1]) * s]);
        for (let i = 0; i < outer.length; i++) { const j = (i + 1) % outer.length; quad(B, prev[i], prev[j], ring[j], ring[i], color); }
        prev = ring;
      }
      return;
    }
    if (shape === 'pyramidal' || shape === 'cone') {
      const c = centroid(outer); for (let i = 0; i < outer.length; i++) { const a = outer[i], b = outer[(i + 1) % outer.length]; tri(B, [a[0], wallTop, a[1]], [b[0], wallTop, b[1]], [c[0], top, c[1]], color); }
      return;
    }
    if (shape === 'skillion') {                         // a tilted flat roof, rising along roof:direction
      const d = dir != null ? dir : 0, gx = Math.sin(d * DEG), gz = -Math.cos(d * DEG);
      const proj = outer.map(p => p[0] * gx + p[1] * gz), lo = Math.min(...proj), hi = Math.max(...proj) || lo + 1;
      const yAt = p => wallTop + rh * ((p[0] * gx + p[1] * gz - lo) / ((hi - lo) || 1));
      flatTop(B, outer, [], yAt, color); walls(B, outer, wallTop, i => yAt(outer[i]), color);
      return;
    }
    // gabled, hipped and relatives: every footprint corner rises to its nearest point on the ridge
    const A = axes(outer), vMid = (A.vMin + A.vMax) / 2, half = (A.vMax - A.vMin) / 2;
    const inset = /hip|mansard|gambrel/.test(shape) ? Math.min(half, (A.uMax - A.uMin) / 2 - 0.01) : 0;
    const r0 = A.uMin + inset, r1 = A.uMax - inset;
    const T = outer.map((p, i) => { const u = Math.max(r0, Math.min(r1, A.U[i])); return [u * A.ux[0] + vMid * A.vx[0], top, u * A.ux[1] + vMid * A.vx[1]]; });
    for (let i = 0; i < outer.length; i++) { const j = (i + 1) % outer.length; quad(B, [outer[i][0], wallTop, outer[i][1]], [outer[j][0], wallTop, outer[j][1]], T[j], T[i], color); }
  }

  /* ---------- OSM to buildings ---------- */
  const HOUSE = /^(house|detached|semidetached_house|terrace|bungalow|residential)$/;
  const WALL = {house: '#b06f55', detached: '#b06f55', semidetached_house: '#b06f55', terrace: '#a8644c', bungalow: '#bb7c60', apartments: '#cbbfae', residential: '#c09078', commercial: '#b8c3cd', office: '#a9b8c6', retail: '#d4ccbf', industrial: '#b9b5ac', warehouse: '#b9b5ac', school: '#c79a7a', church: '#c4b9a3', train_station: '#c9c4ba'};
  const MAT = {brick: '#a85d45', glass: '#9db6c7', concrete: '#c9c5bd', stone: '#cfc5b0', metal: '#b7bcc2', wood: '#9c7552', plaster: '#e5dfd3', render: '#e8e2d6'};
  const ROOFMAT = {roof_tiles: '#7d4637', tile: '#7d4637', slate: '#55595f', metal: '#9aa1a8', glass: '#a9c4d3', concrete: '#9c9a95', grass: '#5d7d47', tar_paper: '#4a4a4a'};
  function buildOne(Bw, Br, tags, outer, holes, base, isPart) {
    const kind = tags.building || tags['building:part'] || 'yes';
    let h = num(tags.height), minH = num(tags.min_height) || (num(tags['building:min_level']) || 0) * LEVEL;
    const lv = num(tags['building:levels']);
    let shape = (tags['roof:shape'] || '').toLowerCase();
    if (!shape && HOUSE.test(kind) && !isPart) shape = /terrace|house/.test(kind) ? 'gabled' : 'hipped';   // UK suburban default when untagged
    const A = axes(outer), short = Math.min(A.uMax - A.uMin, A.vMax - A.vMin);
    let rh = num(tags['roof:height']) || (num(tags['roof:levels']) || 0) * LEVEL;
    if (!rh && shape && shape !== 'flat') rh = shape === 'dome' || shape === 'onion' ? short * 0.45 : Math.min(short * 0.45, HOUSE.test(kind) ? 3.2 : 6);
    if (h == null) h = (lv != null ? lv * LEVEL : HOUSE.test(kind) ? 2 * LEVEL : kind === 'apartments' ? 4 * LEVEL : kind === 'garage' || kind === 'shed' ? 2.6 : 3 * LEVEL) + rh;
    const wallTop = Math.max(minH + 0.5, h - rh);
    const wc = col(tags['building:colour'], MAT[tags['building:material']] || WALL[kind] || '#cfc9bf');
    const rc = col(tags['roof:colour'], ROOFMAT[tags['roof:material']] || (shape === 'dome' ? '#ecebe6' : shape && shape !== 'flat' ? '#7a4a3e' : '#8e8d89'));
    if (wallTop > minH + 0.2) { walls(Bw, outer, base + minH, () => base + wallTop, wc); holes.forEach(hh => walls(Bw, hh, base + minH, () => base + wallTop, wc)); }
    roof(Br, outer, holes, shape || 'flat', base + wallTop, rh, rc, num(tags['roof:direction']));
  }
  function rings(el) {                                  // way or multipolygon relation into outer/inner rings of [lon,lat]
    const g = p => [p.lon, p.lat];
    if (el.type === 'way') return el.geometry ? [{outer: el.geometry.map(g), holes: []}] : [];
    const outs = [], ins = [];
    for (const m of el.members || []) if (m.type === 'way' && m.geometry) (m.role === 'inner' ? ins : outs).push(m.geometry.map(g));
    return outs.map(o => ({outer: o, holes: ins}));
  }
  function inside(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

  function build(data, CI) {
    const Bw = Builder(), Br = Builder(), trees = [], masts = [];
    const toXZ = r => { const out = r.map(p => { const v = CI.local(p, 0); return [v.x, v.z]; }); if (out.length > 2 && Math.hypot(out[0][0] - out.at(-1)[0], out[0][1] - out.at(-1)[1]) < 0.01) out.pop(); return out; };
    const parts = [], shells = [], recs = [];
    for (const e of data.elements || []) { const t = e.tags || {}; if (t['building:part'] && t['building:part'] !== 'no') parts.push(e); else if (t.building && t.building !== 'no') shells.push(e); }
    const partCentres = parts.map(p => rings(p)[0]?.outer).filter(Boolean).map(r => r[Math.floor(r.length / 2)]);
    let n = 0;
    const add = (e, isPart) => {
      for (const {outer, holes} of rings(e)) {
        if (outer.length < 3) continue;
        if (!isPart && partCentres.some(c => inside(c, outer))) continue;           // outline replaced by its detailed parts
        const ll = outer[Math.floor(outer.length / 2)], base = Math.min(CI.elev(outer[0]), CI.elev(ll));
        const w0 = Bw.p.length / 3, r0 = Br.p.length / 3;
        buildOne(Bw, Br, e.tags, toXZ(outer), holes.map(toXZ), base, isPart); n++;
        recs.push({ll: [outer[0], ll], base, w0, w1: Bw.p.length / 3, r0, r1: Br.p.length / 3});
      }
    };
    parts.forEach(e => add(e, true)); shells.forEach(e => add(e, false));
    for (const e of data.elements || []) {
      const t = e.tags || {};
      if (e.type === 'node' && t.natural === 'tree') trees.push({p: [e.lon, e.lat], h: num(t.height) || 9});
      if (/mast|tower|chimney/.test(t.man_made || '') && !t.building) { const p = e.type === 'node' ? [e.lon, e.lat] : e.geometry ? [e.geometry[0].lon, e.geometry[0].lat] : null; if (p) masts.push({p, h: num(t.height) || (t.man_made === 'mast' ? 40 : 25), c: t.colour}); }
      if ((t.landuse === 'forest' || t.natural === 'wood') && e.geometry) {          // scatter trees inside woods, about one per 100 m2
        const poly = e.geometry.map(g => [g.lon, g.lat]); const la = poly.map(p => p[1]), lo = poly.map(p => p[0]);
        const step = 0.0001; let k = 0;
        for (let y = Math.min(...la); y < Math.max(...la) && k < 600; y += step) for (let x = Math.min(...lo); x < Math.max(...lo) && k < 600; x += step * 1.6) { const p = [x + (Math.random() - 0.5) * step, y + (Math.random() - 0.5) * step]; if (inside(p, poly)) { trees.push({p, h: 8 + Math.random() * 10}); k++; } }
      }
    }
    const g = new THREE.Group();
    const mk = (B, m) => { if (!B.p.length) return; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2)); geo.computeVertexNormals(); const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; g.add(mesh); };
    mk(Bw, mats.wall); mk(Br, mats.roof); g.userData = {recs, wall: g.children[0], roof: g.children[1], trees: [], masts: []};
    const T = trees.slice(0, 3000);
    if (T.length) {
      const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.18, 0.28, 1, 6).translate(0, 0.5, 0), mats.trunk, T.length);
      const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mats.leaf, T.length), M = new THREE.Matrix4(), q = new THREE.Quaternion();
      g.userData.trees = T; g.userData.trunk = trunk; g.userData.crown = crown;
      T.forEach((t, i) => { const v = CI.local(t.p, t.base = CI.elev(t.p)); M.compose(v, q, new THREE.Vector3(1, t.h * 0.45, 1)); trunk.setMatrixAt(i, M); const r = t.h * 0.3; M.compose(new THREE.Vector3(v.x, v.y + t.h * 0.62, v.z), q, new THREE.Vector3(r, r * 1.15, r)); crown.setMatrixAt(i, M); });
      trunk.frustumCulled = crown.frustumCulled = false; g.add(trunk, crown);
    }
    for (const m of masts) { const v = CI.local(m.p, CI.elev(m.p)); const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, m.h, 8).translate(0, m.h / 2, 0), m.c ? new THREE.MeshLambertMaterial({color: col(m.c, '#d9d9d9')}) : mats.mast); mesh.position.copy(v); mesh.userData.p = m.p; g.userData.masts.push(mesh); g.add(mesh); }
    W.status = `${n} buildings, ${T.length} trees, ${masts.length} towers from OpenStreetMap`;
    return g;
  }

  /* terrain arrives after the buildings: lift every building, tree and tower onto the real ground once it is known */
  function reground() {
    const CI = window.CI; if (!group || !CI) return; const U = group.userData; let moved = 0;
    const shift = (mesh, a, b, d) => { if (!mesh) return; const arr = mesh.geometry.attributes.position.array; for (let i = a * 3 + 1; i < b * 3; i += 3) arr[i] += d; };
    for (const r of U.recs) { const e = Math.min(CI.elev(r.ll[0]), CI.elev(r.ll[1])); const d = e - r.base; if (Math.abs(d) > 0.3) { shift(U.wall, r.w0, r.w1, d); shift(U.roof, r.r0, r.r1, d); r.base = e; moved++; } }
    if (moved) { if (U.wall) U.wall.geometry.attributes.position.needsUpdate = true; if (U.roof) U.roof.geometry.attributes.position.needsUpdate = true; }
    if (U.trees.length) { const M = new THREE.Matrix4(), q = new THREE.Quaternion(); let tm = 0;
      U.trees.forEach((t, i) => { const e = CI.elev(t.p); if (Math.abs(e - t.base) < 0.3) return; t.base = e; tm++; const v = CI.local(t.p, e); M.compose(v, q, new THREE.Vector3(1, t.h * 0.45, 1)); U.trunk.setMatrixAt(i, M); const r = t.h * 0.3; M.compose(new THREE.Vector3(v.x, v.y + t.h * 0.62, v.z), q, new THREE.Vector3(r, r * 1.15, r)); U.crown.setMatrixAt(i, M); });
      if (tm) { U.trunk.instanceMatrix.needsUpdate = U.crown.instanceMatrix.needsUpdate = true; } }
    U.masts.forEach(m => { m.position.y = CI.elev(m.userData.p); });
    if (moved) CI.map.triggerRepaint();
  }
  W.reground = reground;
  /* instant buildings from the vector map tiles already on screen (no extra server).
     Tiles give real footprints and heights but no roof tags, so roofs are inferred from geometry:
     circularity C = 4πA/P² near 1 on a big footprint → dome (the O2); small low footprints → pitched house roofs. */
  function fromTiles(CI, c, dLat, dLon) {
    const m = CI.map, els = []; let id = 1;
    let fs = []; try { fs = m.querySourceFeatures('omt', {sourceLayer: 'building'}); } catch (e) { return null; }
    const seen = new Set();
    for (const f of fs) {
      const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const poly of polys) {
        const outer = poly[0]; if (!outer || outer.length < 4 || Math.abs(outer[0][1] - c.lat) > dLat || Math.abs(outer[0][0] - c.lng) > dLon) continue;
        const key = outer.length + ':' + outer[0][0].toFixed(6) + ',' + outer[0][1].toFixed(6); if (seen.has(key)) continue; seen.add(key);
        const xy = outer.map(q => { const v = CI.local(q, 0); return [v.x, v.z]; });
        let A = 0, P = 0; for (let i = 1; i < xy.length; i++) { A += xy[i - 1][0] * xy[i][1] - xy[i][0] * xy[i - 1][1]; P += Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]); }
        A = Math.abs(A) / 2; const C = P ? 4 * Math.PI * A / (P * P) : 0;
        // radial evenness: spread of edge distances from the centre (coefficient of variation); a dome stays low even with bumps on its edge
        const cx = xy.reduce((s, q) => s + q[0], 0) / xy.length, cz = xy.reduce((s, q) => s + q[1], 0) / xy.length, rr = xy.map(q => Math.hypot(q[0] - cx, q[1] - cz));
        const rm = rr.reduce((s, r) => s + r, 0) / rr.length, cv = Math.sqrt(rr.reduce((s, r) => s + (r - rm) ** 2, 0) / rr.length) / (rm || 1);
        const h = +f.properties.render_height || 8, minH = +f.properties.render_min_height || 0;
        const tags = {height: String(h)}; if (minH) tags.min_height = String(minH);
        if (f.properties.colour) tags['building:colour'] = f.properties.colour;
        if ((C > 0.82 && A > 1500) || (cv < 0.1 && A > 5000 && xy.length > 16)) { tags.building = 'yes'; tags['roof:shape'] = 'dome'; tags['roof:height'] = String(Math.min(Math.sqrt(A / Math.PI) * 0.45, h * 0.75)); }
        else if (h >= 45) tags.building = 'office';
        else if (h <= 12 && A < 260) tags.building = A < 110 ? 'terrace' : 'house';
        else if (A > 3000 && h < 16) tags.building = 'industrial';
        else tags.building = h > 12 ? 'apartments' : 'residential';
        const ring = r => r.map(q => ({lon: q[0], lat: q[1]}));
        els.push(poly.length > 1 ? {type: 'relation', id: id++, tags, members: [{type: 'way', role: 'outer', geometry: ring(outer)}, ...poly.slice(1).map(hh => ({type: 'way', role: 'inner', geometry: ring(hh)}))]} : {type: 'way', id: id++, tags, geometry: ring(outer)});
      }
    }
    try { for (const f of m.querySourceFeatures('omt', {sourceLayer: 'landcover', filter: ['==', ['get', 'class'], 'wood']})) { const c = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : null; if (c && els.length < 20000) els.push({type: 'way', id: id++, tags: {landuse: 'forest'}, geometry: c.map(q => ({lon: q[0], lat: q[1]}))}); } } catch (e) {}
    return els.length ? {elements: els} : null;
  }
  async function overpass(q) {
    for (const host of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']) {
      try { const r = await fetch(host, {method: 'POST', body: 'data=' + encodeURIComponent(q), headers: {'Content-Type': 'application/x-www-form-urlencoded'}, signal: AbortSignal.timeout(20000)}); if (r.ok) return r.json(); } catch (e) {}
    }
    throw new Error('OpenStreetMap server busy');
  }
  let req = 0;
  // hide the simple blocks by opacity, not zoom range: a layer outside its zoom range stops loading the building shapes we read from the tiles
  W.blocks = (m, show) => { try { m.setPaintProperty('bld', 'fill-extrusion-opacity', show ? 1 : ['step', ['zoom'], 1, 14.8, 0]); } catch (e) {} };
  W.attach = t => { three = t; if (!mats) mats = makeMats(); loadedAt = null; group = null; W.update(); };
  W.detach = () => { three = null; group = null; };
  W.night = isNight => { if (mats && isNight !== lastNight) { lastNight = isNight; mats.wall.emissiveIntensity = isNight ? 0.55 : 0; } };
  W.update = async () => {
    const CI = window.CI; if (!three || !CI || !W.on) { if (group) group.visible = W.on; return; }
    const m = CI.map, z = m.getZoom(), c = m.getCenter(), here = [c.lng, c.lat];
    if (group) group.visible = z >= 14.8;
    W.blocks(m, !group);
    if (z < 14.8 || busy || (loadedAt && hav(loadedAt, here) < 450)) return;
    if (!m.isSourceLoaded('omt')) { clearTimeout(W._t); W._t = setTimeout(W.update, 700); return; }   // map never goes idle while vehicles animate, so poll until the tiles here arrive
    busy = true; W.status = 'Loading real buildings…'; CI.onStatus?.();
    const dLat = 0.0072, dLon = dLat / Math.cos(c.lat * DEG), bb = [c.lat - dLat, c.lng - dLon, c.lat + dLat, c.lng + dLon].map(v => v.toFixed(5)).join(',');
    const q = `[out:json][timeout:40];(way["building"](${bb});relation["building"]["type"="multipolygon"](${bb});way["building:part"](${bb});relation["building:part"](${bb});node["natural"="tree"](${bb});way["landuse"="forest"](${bb});way["natural"="wood"](${bb});node["man_made"~"^(mast|tower|chimney)$"](${bb}););out geom;`;
    const swap = g => { if (group) { three.scene.remove(group); group.traverse(o => o.geometry && o.geometry.dispose()); } group = g; three.scene.add(group); loadedAt = here; W.blocks(m, false); m.triggerRepaint(); };
    const tiles = fromTiles(CI, c, dLat * 1.3, dLon * 1.3);
    const nb = tiles ? tiles.elements.filter(e => e.tags.building).length : 0;
    if (!nb && (W._tries = (W._key === here.join() ? W._tries : 0) + 1) < 8) { W._key = here.join(); busy = false; clearTimeout(W._t); W._t = setTimeout(W.update, 900); return; }   // tiles still decoding: try again shortly           // 1) instant: from the map tiles
    if (tiles) { swap(build(tiles, CI)); W.status = W.status.replace('from OpenStreetMap', 'from map tiles') + ' · adding roofs and trees…'; CI.onStatus?.(); }
    busy = false; CI.onStatus?.(); m.triggerRepaint();
    const my = ++req;                       // 2) detail in the background: real roof shapes, parts, trees and masts from OpenStreetMap
    try {
      const data = await overpass(q); if (!three || my !== req) return;
      if (hav(here, [m.getCenter().lng, m.getCenter().lat]) < 900) swap(build(data, CI));
    } catch (e) { if (my !== req) return; W.status = tiles ? W.status.replace(' · adding roofs and trees…', ' (OpenStreetMap busy, so roofs are estimated)') : e.message + ', using simple buildings'; }
    CI.onStatus?.(); m.triggerRepaint();
  };
  W.build = build;  // exposed for testing
  window.World3D = W;
})();
