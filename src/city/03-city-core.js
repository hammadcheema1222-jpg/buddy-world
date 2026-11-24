/* =================== BUDDY CITY: a real city generated from OpenStreetMap =================== */
const O={lat:51.5007,lon:-0.1246,R:550,left:true,name:'',city:''};
const KX=()=>111320*Math.cos(O.lat*Math.PI/180),KZ=110540;
const toL=(lat,lon)=>[(lon-O.lon)*KX(),-(lat-O.lat)*KZ];
const toLL=(x,z)=>[O.lat-z/KZ,O.lon+x/KX()];
const LEFT_CC=['gb','ie','pk','in','jp','au','nz','za','hk','sg','my','th','id','ke','bd','lk','np','mt','cy','jm','tt','bs','bb','tz','ug','zm','zw','bw','na','mz','mo','bt','bn'];
const world=new THREE.Group();scene.add(world);
let CITY=null;const yearU={value:2100};
/* ---------- textures ---------- */
function winTex(lit){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle=lit?'#000':'#ffffff';g.fillRect(0,0,128,128);
 for(let i=0;i<2;i++)for(let j=0;j<2;j++){const x=i*64+18,y=j*64+14;if(lit){if(Math.random()<0.55){g.fillStyle=pickR(['#ffd98a','#ffe9b0','#ffc860','#fff2d0']);g.fillRect(x,y,28,36);}}else{g.fillStyle='#5f7486';g.fillRect(x,y,28,36);g.fillStyle='#8fa6b8';g.fillRect(x+2,y+2,10,32);g.fillStyle='#e8e2d6';g.fillRect(x-2,y+36,32,4);}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
const TEX_WIN=winTex(false),TEX_LIT=winTex(true);
function yearMat(base){base.onBeforeCompile=sh=>{sh.uniforms.uYear=yearU;sh.uniforms.uHide=hideU;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aYear;\nvarying float vYear;\nattribute float aBid;\nvarying float vBid;').replace('#include <begin_vertex>','#include <begin_vertex>\nvYear=aYear;vBid=aBid;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vYear;\nuniform float uYear;\nvarying float vBid;\nuniform float uHide[8];').replace('#include <clipping_planes_fragment>','if(vYear>uYear) discard;\nfor(int i=0;i<8;i++){if(abs(vBid-uHide[i])<0.5) discard;}\n#include <clipping_planes_fragment>');};return base;}
const bMat=yearMat(new THREE.MeshLambertMaterial({side:THREE.DoubleSide,vertexColors:true,map:TEX_WIN,emissiveMap:TEX_LIT,emissive:new THREE.Color('#ffd27a'),emissiveIntensity:0}));
const flatMat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
/* ---------- geometry helpers ---------- */
function ringsFromRelation(el,roleWant){const segs=el.members.filter(m=>m.type==='way'&&m.geometry&&(m.role===roleWant||(roleWant==='outer'&&m.role===''))).map(m=>m.geometry.filter(Boolean).map(p=>toL(p.lat,p.lon)));
 const rings=[];const eq=(a,b)=>Math.abs(a[0]-b[0])<0.05&&Math.abs(a[1]-b[1])<0.05;
 while(segs.length){let r=segs.shift();let guard=0;while(!eq(r[0],r[r.length-1])&&guard++<500){let found=false;for(let i=0;i<segs.length;i++){const s=segs[i];
   if(eq(r[r.length-1],s[0])){r=r.concat(s.slice(1));}else if(eq(r[r.length-1],s[s.length-1])){r=r.concat(s.slice(0,-1).reverse());}else if(eq(r[0],s[s.length-1])){r=s.concat(r.slice(1));}else if(eq(r[0],s[0])){r=s.slice().reverse().concat(r.slice(1));}else continue;segs.splice(i,1);found=true;break;}if(!found)break;}
  if(r.length>=4)rings.push(r);}return rings;}
function polysOf(el){if(el.type==='way'&&el.geometry){const r=el.geometry.filter(Boolean).map(p=>toL(p.lat,p.lon));if(r.length<4)return[];return [{outer:r,holes:[]}];}
 if(el.type==='relation'&&el.members){const outs=ringsFromRelation(el,'outer'),ins=ringsFromRelation(el,'inner');return outs.map(o=>({outer:o,holes:ins.filter(h=>pip(h[0],o))}));}return[];}
function pip(p,ring){let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
function area(r){let s=0;for(let i=0;i<r.length-1;i++)s+=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];return s/2;}
function centroid(r){let x=0,z=0;const n=r.length-1;for(let i=0;i<n;i++){x+=r[i][0];z+=r[i][1];}return [x/n,z/n];}
function triangulate(outer,holes){const o=outer.slice(0,-1).map(p=>new THREE.Vector2(p[0],p[1])),hs=holes.map(h=>h.slice(0,-1).map(p=>new THREE.Vector2(p[0],p[1])));
 const tris=THREE.ShapeUtils.triangulateShape(o,hs);const all=o.concat(...hs);return {pts:all,tris};}
const colorOf=(s,def)=>{if(!s)return def;try{return new THREE.Color(s.split(';')[0].trim());}catch(e){return def;}};
function hashStr(s){let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
function parseYear(t){const s=t.start_date||t['construction:start_date']||t['building:start_date']||'';const m=String(s).match(/(\d{3,4})/);if(m)return +m[1];const c=String(s).match(/C(\d\d)/i);if(c)return (+c[1]-1)*100+50;return 0;}
/* ---------- builders for merged meshes ---------- */
function Acc(){return {p:[],n:[],c:[],uv:[],yr:[],id:[]};}
const tmpC=new THREE.Color();
function pushTri(A,a,b,c,col,uvs,yr,id){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
 [a,b,c].forEach((v,i)=>{A.p.push(v[0],v[1],v[2]);A.n.push(nx,ny,nz);A.c.push(col.r,col.g,col.b);if(A.uv)A.uv.push(uvs?uvs[i*2]:0.03,uvs?uvs[i*2+1]:0.03);if(A.yr)A.yr.push(yr||0);if(A.bv)A.bv.push(id||0);});if(A.id)A.id.push(id);}
function meshFrom(A,mat,withUV,withYear){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));
 if(withUV)g.setAttribute('uv',new THREE.Float32BufferAttribute(A.uv,2));if(withYear)g.setAttribute('aYear',new THREE.Float32BufferAttribute(A.yr,1));if(A.bv)g.setAttribute('aBid',new THREE.Float32BufferAttribute(A.bv,1));const m=new THREE.Mesh(g,mat);world.add(m);return m;}
function addFlatPoly(A,outer,holes,y,col){try{const t=triangulate(outer,holes);t.tris.forEach(tr=>{const a=t.pts[tr[0]],b=t.pts[tr[1]],c=t.pts[tr[2]];const P=[[a.x,y,a.y],[c.x,y,c.y],[b.x,y,b.y]];
 const ccw=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(ccw>0)pushTri(A,P[0],P[1],P[2],col);else pushTri(A,P[0],P[2],P[1],col);});}catch(e){}}
/* building */
const WALLS=['#b5654a','#a8583f','#d8cdb8','#cfc3aa','#c9b9a0','#9a6b52','#e6e0d4','#bfb5a6','#8f8f8f','#d4c4a8','#c48a6a','#e9e4da'].map(c=>new THREE.Color(c));
const MATC={brick:'#a8583f',stone:'#d8cdb8',sandstone:'#d9c08a',glass:'#7f9fb5',concrete:'#bdbab2',metal:'#a9b0b6',wood:'#9a6b4a',plaster:'#ece4d4',limestone:'#e2d8c2',marble:'#f2efe8'};
function addBuilding(A,poly,t,id,info){let h=parseFloat(t.height)||(t['building:levels']?parseFloat(t['building:levels'])*3.3+(t['roof:levels']?parseFloat(t['roof:levels'])*2.6:0):0);
 const bt=t.building||t['building:part']||'yes';const house=/house|detached|terrace|semidetached|bungalow/.test(bt);
 if(!h)h=house?8:bt==='garage'||bt==='shed'||bt==='kiosk'?3:bt==='church'||bt==='cathedral'?20:bt==='apartments'?16:10+(hashStr(String(id))%7);
 h=clamp(h,2,900);let base=parseFloat(t.min_height)||(t['building:min_level']?parseFloat(t['building:min_level'])*3.3:0);if(base>=h)base=0;
 let roofH=parseFloat(t['roof:height'])||0;const shape=t['roof:shape']||(house?'hipped':'flat');if(shape!=='flat'&&!roofH)roofH=Math.min(h*0.3,shape==='dome'||shape==='onion'?Math.sqrt(Math.abs(area(poly.outer)))/2:6);
 const top=h-(shape!=='flat'?roofH:0);
 const hs=hashStr(String(id)),wall=colorOf(t['building:colour'],MATC[t['building:material']]?new THREE.Color(MATC[t['building:material']]):WALLS[hs%WALLS.length]);
 const roof=colorOf(t['roof:colour'],MATC[t['roof:material']]?new THREE.Color(MATC[t['roof:material']]):(house?new THREE.Color('#8a4b3a'):new THREE.Color(hs%3?'#7c7f84':'#6b6e73')));
 const yr=parseYear(t)||(info&&info.year)||0;const winScale=bt==='garage'||bt==='shed'?0:1;
 const rings=[poly.outer].concat(poly.holes);
 for(const r of rings){const cw=area(r)<0;let run=0;for(let i=0;i<r.length-1;i++){const a=r[i],b=r[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<0.05)continue;
  const u0=run/3.6,u1=(run+len)/3.6,v0=base/3.3*winScale,v1=top/3.3*winScale;run+=len;
  const A0=[a[0],base,a[1]],B0=[b[0],base,b[1]],A1=[a[0],top,a[1]],B1=[b[0],top,b[1]];
  const out=(r===poly.outer)?!cw:cw;const uvq=winScale?[u0,v0,u1,v0,u1,v1]:null,uvq2=winScale?[u0,v0,u1,v1,u0,v1]:null;
  if(out){pushTri(A,A0,B0,B1,wall,uvq,yr,id);pushTri(A,A0,B1,A1,wall,uvq2,yr,id);}else{pushTri(A,B0,A0,A1,wall,uvq,yr,id);pushTri(A,B0,A1,B1,wall,uvq2,yr,id);}}}
 if(shape==='flat'||roofH<=0.2||poly.outer.length>40){try{const tr=triangulate(poly.outer,poly.holes);tr.tris.forEach(q=>{const a=tr.pts[q[0]],b=tr.pts[q[1]],c=tr.pts[q[2]];const ccw=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
   const P=[[a.x,top,a.y],[b.x,top,b.y],[c.x,top,c.y]];if(ccw>0)pushTri(A,P[0],P[2],P[1],roof,null,yr,id);else pushTri(A,P[0],P[1],P[2],roof,null,yr,id);});}catch(e){}
  if(shape!=='flat'&&roofH>0.2&&poly.outer.length>40)roofH=0;}
 else if(shape==='dome'||shape==='onion'){const c=centroid(poly.outer);let rad=1e9;for(let i=0;i<poly.outer.length-1;i++)rad=Math.min(rad,Math.hypot(poly.outer[i][0]-c[0],poly.outer[i][1]-c[1]));rad=Math.max(rad,1);
  try{const tr=triangulate(poly.outer,[]);tr.tris.forEach(q=>{const a=tr.pts[q[0]],b=tr.pts[q[1]],cc=tr.pts[q[2]];const ccw=(b.x-a.x)*(cc.y-a.y)-(b.y-a.y)*(cc.x-a.x);const P=[[a.x,top,a.y],[b.x,top,b.y],[cc.x,top,cc.y]];if(ccw>0)pushTri(A,P[0],P[2],P[1],roof,null,yr,id);else pushTri(A,P[0],P[1],P[2],roof,null,yr,id);});}catch(e){}
  const SEG=16,RING=6,hgt=roofH;for(let i=0;i<RING;i++)for(let j=0;j<SEG;j++){const p0=i/RING*Math.PI/2,p1=(i+1)/RING*Math.PI/2,a0=j/SEG*Math.PI*2,a1=(j+1)/SEG*Math.PI*2;
   const v=(p,a)=>[c[0]+Math.cos(a)*Math.cos(p)*rad,top+Math.sin(p)*hgt*(shape==='onion'?1+0.3*Math.sin(p*2):1),c[1]+Math.sin(a)*Math.cos(p)*rad];pushTri(A,v(p0,a0),v(p1,a0),v(p1,a1),roof,null,yr,id);if(i<RING-1)pushTri(A,v(p0,a0),v(p1,a1),v(p0,a1),roof,null,yr,id);}}
 else{const c=centroid(poly.outer),apex=[c[0],top+roofH,c[1]],r=poly.outer,cw=area(r)<0;for(let i=0;i<r.length-1;i++){const a=[r[i][0],top,r[i][1]],b=[r[i+1][0],top,r[i+1][1]];if(!cw)pushTri(A,a,b,apex,roof,null,yr,id);else pushTri(A,b,a,apex,roof,null,yr,id);}}
 return {h,top:top+roofH,yr,name:t.name};}
/* roads */
const ROADW={motorway:16,trunk:14,primary:12,secondary:11,tertiary:9,residential:7,unclassified:7,living_street:6,service:4.5,pedestrian:6,footway:2.4,path:2,cycleway:2.2,steps:2.4,track:3,bridleway:2,corridor:0};
const CARROADS={motorway:1,trunk:1,primary:1,secondary:1,tertiary:1,residential:1,unclassified:1,living_street:1,motorway_link:1,trunk_link:1,primary_link:1,secondary_link:1,tertiary_link:1};
function ribbon(A,pts,w,y,col){if(pts.length<2)return;const L=[],R=[];for(let i=0;i<pts.length;i++){const p=pts[i],a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;L.push([p[0]-dz*w/2,y,p[1]+dx*w/2]);R.push([p[0]+dz*w/2,y,p[1]-dx*w/2]);}
 for(let i=0;i<pts.length-1;i++){pushTri(A,L[i],R[i],R[i+1],col);pushTri(A,L[i],R[i+1],L[i+1],col);}}
function dashes(A,pts,y,col,dash,gap,off){let carry=0;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<0.01)continue;const dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len;let s=carry;
  while(s<len){const e=Math.min(len,s+dash),ox=-dz*(off||0),oz=dx*(off||0),p0=[a[0]+dx*s+ox,a[1]+dz*s+oz],p1=[a[0]+dx*e+ox,a[1]+dz*e+oz];ribbon(A,[p0,p1],0.18,y,col);s+=dash+gap;}carry=s-len;}}
/* ---------- fetch OSM ---------- */
const OVP=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
async function fetchOSM(){const dLat=O.R/KZ,dLon=O.R/KX(),s=O.lat-dLat,n=O.lat+dLat,w=O.lon-dLon,e=O.lon+dLon;
 const q=`[out:json][timeout:120][maxsize:268435456][bbox:${s},${w},${n},${e}];(way["building"];relation["building"];way["building:part"];relation["building:part"];way["highway"];way["railway"~"^(rail|light_rail|subway|tram|narrow_gauge)$"];way["natural"~"^(water|wood|scrub|grassland|beach|sand)$"];relation["natural"="water"];way["waterway"~"^(river|canal|riverbank|stream)$"];way["water"];relation["water"];way["leisure"~"^(park|garden|pitch|playground|recreation_ground|common|golf_course|dog_park)$"];relation["leisure"~"^(park|garden)$"];way["landuse"~"^(grass|recreation_ground|village_green|forest|cemetery|meadow|allotments|flowerbed)$"];relation["landuse"~"^(grass|forest|cemetery)$"];way["place"="square"];way["area:highway"];way["amenity"="parking"];node["natural"="tree"];node["amenity"];node["shop"];node["tourism"];node["historic"];node["leisure"];node["office"];node["craft"];node["highway"~"^(street_lamp|bus_stop|traffic_signals|crossing)$"];node["man_made"];);out geom;`;
 let lastErr='';for(const ep of OVP){try{status('Downloading the real city from OpenStreetMap… (can take 10–40 s)');const r=await fetch(ep,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
  if(!r.ok){lastErr='server busy ('+r.status+')';continue;}const j=await r.json();if(j.elements)return j.elements;}catch(e){lastErr='network';}}
 throw new Error(lastErr||'failed');}
/* ---------- build the city ---------- */
function status(t){$('status').style.display=t?'block':'none';$('status').textContent=t||'';}
function clearCity(){for(let i=world.children.length-1;i>=0;i--){const m=world.children[i];world.remove(m);if(m.geometry)m.geometry.dispose();if(m.material&&m.material!==bMat&&m.material!==flatMat&&!Array.isArray(m.material)&&m.material.map&&m.material.map!==TEX_WIN)m.material.map.dispose();}CITY=null;}
const EMO={restaurant:'🍽️',cafe:'☕',pub:'🍺',bar:'🍸',fast_food:'🍔',ice_cream:'🍦',museum:'🏛️',gallery:'🖼️',courthouse:'⚖️',townhall:'🏛️',place_of_worship:'🛐',school:'🏫',university:'🎓',college:'🎓',hospital:'🏥',clinic:'🩺',pharmacy:'💊',bank:'🏦',atm:'🏧',hotel:'🏨',hostel:'🛏️',theatre:'🎭',cinema:'🎬',library:'📚',police:'🚓',fire_station:'🚒',post_office:'📮',attraction:'⭐',viewpoint:'👀',monument:'🗿',memorial:'🕯️',castle:'🏰',supermarket:'🛒',convenience:'🏪',bakery:'🥐',clothes:'👕',books:'📖',embassy:'🏳️',arts_centre:'🎨',nightclub:'🪩',fuel:'⛽',parking:'🅿️',toilets:'🚻',information:'ℹ️',artwork:'🎨',fountain:'⛲',marketplace:'🧺',childcare:'🧸',kindergarten:'🧸',dentist:'🦷',doctors:'🩺',veterinary:'🐾',zoo:'🦁',aquarium:'🐠',stadium:'🏟️',park:'🌳',playground:'🛝',station:'🚉'};
function poiKind(t){return t.tourism||t.amenity||t.historic||t.shop&&(EMO[t.shop]?t.shop:'shop')||t.leisure||t.office&&'office'||t.craft&&'craft'||t.building||'';}
function poiEmoji(t){if(t.amenity==='place_of_worship')return t.religion==='muslim'?'🕌':t.religion==='christian'?'⛪':t.religion==='jewish'?'🕍':t.religion==='hindu'?'🛕':t.religion==='buddhist'?'☸️':t.religion==='sikh'?'🪯':'🛐';const k=poiKind(t);return EMO[k]||(t.shop?'🛍️':t.office?'💼':'📍');}
async function loadCity(){resetLayers();clearCity();status('Finding '+(O.name||'the place')+'…');let els;
 try{els=await fetchOSM();}catch(e){status('');showErr('Could not download the city data ('+e.message+'). OpenStreetMap servers might be busy — wait a minute and try again, or pick a smaller area.');return;}
 status('Building '+els.length.toLocaleString()+' real map pieces in 3D…');await new Promise(r=>setTimeout(r,30));
 const C={buildings:[],pois:[],roads:[],foot:[],rivers:[],grid:new Map(),graph:new Map(),fgraph:new Map(),minYear:3000};CITY=C;
 const gridKey=(x,z)=>Math.floor(x/40)+'_'+Math.floor(z/40);
 const bA={p:[],n:[],c:[],uv:[],yr:[],id:[],bv:[]},gA=Acc(),wA=Acc(),rA=Acc(),mA=Acc(),fA=Acc();gA.uv=gA.yr=gA.id=wA.uv=wA.yr=wA.id=rA.uv=rA.yr=rA.id=mA.uv=mA.yr=mA.id=fA.uv=fA.yr=fA.id=null;
 const G=new THREE.Color('#8fbf63'),G2=new THREE.Color('#7aae52'),SQ=new THREE.Color('#d9d2c4'),W=new THREE.Color('#5aa0cf'),ASP=new THREE.Color('#4e5258'),ASP2=new THREE.Color('#5d6167'),PAVE=new THREE.Color('#c9c3b8'),FOOT=new THREE.Color('#d6cbb6'),RAIL=new THREE.Color('#6f6a64'),WHITE=new THREE.Color('#f4f4f0'),YEL=new THREE.Color('#e9c440'),PARK=new THREE.Color('#b0b0aa'),SAND=new THREE.Color('#e8d9a6'),WOOD=new THREE.Color('#5f9a4a');
 // ground
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(O.R*6,O.R*6),new THREE.MeshLambertMaterial({color:'#c8c2b4'}));gr.rotation.x=-Math.PI/2;gr.position.y=-0.05;world.add(gr);gr.userData.ground=1;C.ground=gr;
 const parts=[],outlines=[],areaEls=[],trees=[],furn=[];
 for(const el of els){const t=el.tags||{};
  if(t['building:part']&&el.type!=='node')parts.push(el);else if(t.building&&el.type!=='node')outlines.push(el);
  else if(el.type!=='node'&&(t.natural||t.water||t.waterway==='riverbank'||t.leisure||t.landuse||t.place==='square'||t['area:highway']||t.amenity==='parking'||(t.highway&&t.area==='yes')))areaEls.push(el);
  if(el.type==='way'&&t.highway&&t.area!=='yes')C.roads.push(el);
  if(el.type==='way'&&t.railway)C.roads.push(el);
  if(el.type==='way'&&(t.waterway==='river'||t.waterway==='canal'))C.rivers.push(el);
  if(el.type==='node'){if(t.natural==='tree')trees.push(toL(el.lat,el.lon));
   else if(t.highway==='street_lamp'||t.highway==='bus_stop'||t.highway==='traffic_signals'||t.amenity==='bench'||t.amenity==='post_box'||t.amenity==='telephone'||t.highway==='crossing'||t.amenity==='bicycle_parking'||t.amenity==='waste_basket'||t.amenity==='fountain')furn.push(el);
   if(t.name&&(t.amenity||t.shop||t.tourism||t.historic||t.office||t.craft||t.leisure)&&!/bench|waste_basket|post_box|bicycle_parking|parking_entrance|telephone|vending/.test(t.amenity||''))C.pois.push({t,p:toL(el.lat,el.lon),node:el});}}
 // areas (parks, water…)
 for(const el of areaEls){const t=el.tags||{};let col=null,y=0.02,A=gA;
  if(t.natural==='water'||t.water||t.waterway==='riverbank'){col=W;y=0.03;A=wA;}else if(/wood|forest|scrub/.test(t.natural||t.landuse||'')){col=WOOD;y=0.015;}
  else if(t.leisure==='pitch'){col=new THREE.Color('#6fb04f');y=0.025;}else if(t.leisure||/grass|recreation|village_green|meadow|cemetery|allotments|flowerbed|common/.test(t.landuse||'')||/grassland/.test(t.natural||'')){col=t.leisure==='playground'?new THREE.Color('#d9b38a'):(hashStr(String(el.id))%2?G:G2);y=0.018;}
  else if(/beach|sand/.test(t.natural||'')){col=SAND;y=0.02;}else if(t.amenity==='parking'){col=PARK;y=0.022;}else if(t.place==='square'||t['area:highway']||t.highway){col=SQ;y=0.024;}
  if(!col)continue;for(const poly of polysOf(el)){addFlatPoly(A,poly.outer,poly.holes,y,col);if(col===G||col===G2||col===WOOD){const ar=Math.abs(area(poly.outer));const n=Math.min(80,Math.floor(ar/(col===WOOD?60:260)));const xs=poly.outer.map(p=>p[0]),zs=poly.outer.map(p=>p[1]);
    for(let k=0;k<n;k++){const p=[Math.min(...xs)+Math.random()*(Math.max(...xs)-Math.min(...xs)),Math.min(...zs)+Math.random()*(Math.max(...zs)-Math.min(...zs))];if(pip(p,poly.outer))trees.push(p);}}}}
 // buildings: parts first, then outlines without parts inside
 let bid=0;const partCents=[];
 for(const el of parts)for(const poly of polysOf(el)){const t=el.tags;const r=addBuilding(bA,poly,t,bid,null);C.buildings.push({id:bid,el,t,poly,h:r.h,top:r.top,yr:r.yr,part:true});partCents.push(centroid(poly.outer));if(r.yr)C.minYear=Math.min(C.minYear,r.yr);bid++;}
 for(const el of outlines){const t=el.tags;for(const poly of polysOf(el)){const hasPart=partCents.some(c=>pip(c,poly.outer));
  const yr=parseYear(t);if(hasPart){C.buildings.push({id:-1,el,t,poly,h:0,top:parseFloat(t.height)||20,yr,outlineOnly:true});continue;}
  const r=addBuilding(bA,poly,t,bid,null);C.buildings.push({id:bid,el,t,poly,h:r.h,top:r.top,yr:r.yr});if(r.yr)C.minYear=Math.min(C.minYear,r.yr);bid++;}}
 // spatial grid for buildings (collision, info, POIs)
 C.buildings.forEach((b,i)=>{const xs=b.poly.outer.map(p=>p[0]),zs=b.poly.outer.map(p=>p[1]);b.bb=[Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)];
  for(let gx=Math.floor(b.bb[0]/40);gx<=Math.floor(b.bb[2]/40);gx++)for(let gz=Math.floor(b.bb[1]/40);gz<=Math.floor(b.bb[3]/40);gz++){const k=gx+'_'+gz;if(!C.grid.has(k))C.grid.set(k,[]);C.grid.get(k).push(i);}});
 C.buildingAt=(x,z)=>{const L=C.grid.get(gridKey(x,z))||[];for(const i of L){const b=C.buildings[i];if(x<b.bb[0]||x>b.bb[2]||z<b.bb[1]||z>b.bb[3])continue;if(pip([x,z],b.poly.outer))return b;}return null;};
 // attach POIs to buildings + building-way POIs
 for(const b of C.buildings){if(b.t.name&&(b.t.amenity||b.t.tourism||b.t.historic||b.t.shop||b.t.office||b.t.leisure||b.t.building))C.pois.push({t:b.t,p:centroid(b.poly.outer),b,way:true});}
 for(const p of C.pois){if(!p.b)p.b=C.buildingAt(p.p[0],p.p[1]);if(p.b){(p.b.pois=p.b.pois||[]).push(p);}}
 // roads, rails, markings
 for(const el of C.roads){const t=el.tags,pts=el.geometry.filter(Boolean).map(p=>toL(p.lat,p.lon));if(pts.length<2)continue;
  if(t.railway){if(t.tunnel==='yes'||t.railway==='subway'&&t.tunnel!=='no'&&t.bridge!=='yes')continue;ribbon(rA,pts,2.8,0.06,RAIL);dashes(mA,pts,0.075,new THREE.Color('#3b3632'),0.3,0.5,0.9);dashes(mA,pts,0.075,new THREE.Color('#3b3632'),0.3,0.5,-0.9);continue;}
  if(t.tunnel==='yes'||t.highway==='corridor'||t.indoor==='yes')continue;const hw=t.highway.replace('_link','');let w=ROADW[hw];if(w===undefined)w=5;if(t.width&&parseFloat(t.width))w=clamp(parseFloat(t.width),1.5,30);else if(t.lanes&&CARROADS[t.highway])w=Math.max(w,parseFloat(t.lanes)*3.3);
  const foot=/footway|path|cycleway|steps|bridleway|pedestrian|track/.test(hw);const bridge=t.bridge&&t.bridge!=='no';const y=bridge?0.45:(foot?0.04:0.05+(CARROADS[t.highway]?0.005:0));
  ribbon(foot?fA:rA,pts,w,y,foot?(hw==='cycleway'?new THREE.Color('#c98a7a'):FOOT):(hw==='service'?ASP2:ASP));
  if(bridge){ribbon(rA,pts,w+0.6,y-0.4,new THREE.Color('#8a857c'));}
  if(CARROADS[t.highway]&&!foot){if(/primary|secondary|trunk|tertiary/.test(hw)&&t.oneway!=='yes')dashes(mA,pts,y+0.01,O.left?WHITE:YEL,3,4.5,0);if(w>=9){dashes(mA,pts,y+0.01,WHITE,40,0.001,w/2-0.4);dashes(mA,pts,y+0.01,WHITE,40,0.001,-(w/2-0.4));}
   if(t.sidewalk&&t.sidewalk!=='no'&&t.sidewalk!=='none'){if(t.sidewalk!=='right')ribbon(fA,offsetLine(pts,w/2+1.2),2.2,0.07,PAVE);if(t.sidewalk!=='left')ribbon(fA,offsetLine(pts,-(w/2+1.2)),2.2,0.07,PAVE);}}
  // graphs for traffic and walkers
  const ids=el.nodes||[];const gph=foot?C.fgraph:(CARROADS[t.highway]?C.graph:null);if(gph&&ids.length===pts.length){const way={pts,ids,oneway:t.oneway==='yes'||t.junction==='roundabout',w,bus:/primary|secondary|trunk/.test(hw),y};
   ids.forEach((nid,i)=>{if(!gph.has(nid))gph.set(nid,[]);gph.get(nid).push([way,i]);});(foot?C.foot:(C.cars=C.cars||[])).push(way);}}
 // zebra crossings
 const nodeWay=new Map();for(const [nid,list] of C.graph)nodeWay.set(nid,list[0]);
 for(const el of furn){const t=el.tags;if(t.highway!=='crossing'||!(t.crossing==='zebra'||t.crossing==='marked'||t.crossing_ref==='zebra'||t.crossing==='uncontrolled'))continue;const wv=nodeWay.get(el.id);if(!wv)continue;const [way,i]=wv,pts=way.pts,a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];
  let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;const c=pts[i];for(let k=-3;k<=3;k++){const o=k*0.8;const p0=[c[0]+dx*o-dz*way.w/2,c[1]+dz*o+dx*way.w/2],p1=[c[0]+dx*o+dz*way.w/2,c[1]+dz*o-dx*way.w/2];ribbon(mA,[p0,p1],0.45,way.y+0.015,WHITE);}}
 C.bMesh=meshFrom(bA,bMat,true,true);C.bIds=bA.id;
 [[gA,flatMat],[wA,new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:0.95,side:THREE.DoubleSide})],[rA,flatMat],[fA,flatMat],[mA,flatMat]].forEach(q=>{if(q[0].p.length)meshFrom(q[0],q[1]);});
 C.water=world.children[world.children.length-1];
 buildTrees(trees);buildFurniture(furn);buildSigns();startLife();
 C.minYear=C.minYear===3000?1800:Math.max(1000,Math.min(C.minYear,1900));$('yr').min=C.minYear;$('yr').value=2026;yearU.value=2100;$('yrL').textContent='Now';
 status('');const nb=C.buildings.filter(b=>!b.outlineOnly).length;showHint('Built '+nb.toLocaleString()+' real buildings, '+C.roads.length.toLocaleString()+' streets & paths, '+trees.length+' trees, '+C.pois.length+' places 🏙️',7);
 say(pickR(['We\'re in '+(O.name||'the city')+'! 🏙️','Everything here is real! ✨','Look at all these buildings!']),4);
 afterCityLoaded();pl.x=0;pl.z=0;pl.y=0;let tries=0;while(C.buildingAt(pl.x,pl.z)&&tries++<60){pl.x+=Math.random()*20-10;pl.z+=Math.random()*20-10;}pet.x=pl.x+3;pet.z=pl.z+3;setMode('map');}
function offsetLine(pts,o){return pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;return [p[0]-dz/l*o,p[1]+dx/l*o];});}
/* trees & furniture (instanced) */
const tmpM=new THREE.Matrix4(),tmpQ=new THREE.Quaternion(),tmpS=new THREE.Vector3(),tmpP=new THREE.Vector3(),UPV=new THREE.Vector3(0,1,0);
function inst(geo,mat,list,fn){if(!list.length)return null;const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((it,i)=>{fn(it,tmpP,tmpS);tmpQ.setFromAxisAngle(UPV,it.r||0);tmpM.compose(tmpP,tmpQ,tmpS);im.setMatrixAt(i,tmpM);});world.add(im);return im;}
function buildTrees(list){const L=list.filter(p=>!CITY.buildingAt(p[0],p[1])).slice(0,6000).map(p=>({x:p[0],z:p[1],s:0.7+Math.random()*0.7,r:Math.random()*6}));
 inst(new THREE.CylinderGeometry(0.25,0.35,1,6),M('#6b4a2b'),L,(t,p,s)=>{p.set(t.x,1.6*t.s,t.z);s.set(t.s,3.2*t.s,t.s);});
 inst(new THREE.IcosahedronGeometry(2.6,0),M('#5f9a4a'),L,(t,p,s)=>{p.set(t.x,5*t.s,t.z);s.set(t.s,t.s*1.1,t.s);});}
let LAMPS=null,SIGNALS=[];
function buildFurniture(furn){const by=k=>furn.filter(el=>{const t=el.tags;return k(t);}).map(el=>{const p=toL(el.lat,el.lon);return {x:p[0],z:p[1],r:Math.random()*6,t:el.tags};});
 const lamps=by(t=>t.highway==='street_lamp');inst(new THREE.CylinderGeometry(0.08,0.12,1,6),M('#2d3238'),lamps,(t,p,s)=>{p.set(t.x,2.5,t.z);s.set(1,5,1);});
 LAMPS=inst(new THREE.SphereGeometry(0.28,8,6),new THREE.MeshLambertMaterial({color:'#f4efd8',emissive:'#000000'}),lamps,(t,p,s)=>{p.set(t.x,5.1,t.z);s.set(1,1,1);});
 const benches=by(t=>t.amenity==='bench');inst(GB,M('#7a5432'),benches,(t,p,s)=>{p.set(t.x,0.45,t.z);s.set(1.6,0.12,0.5);});inst(GB,M('#2d3238'),benches,(t,p,s)=>{p.set(t.x,0.22,t.z);s.set(1.4,0.44,0.08);});
 const pboxes=by(t=>t.amenity==='post_box');inst(new THREE.CylinderGeometry(0.3,0.3,1.3,10),M('#c8201e'),pboxes,(t,p,s)=>{p.set(t.x,0.65,t.z);s.set(1,1,1);});
 const phones=by(t=>t.amenity==='telephone');inst(GB,M(O.left?'#c8201e':'#9aa0a6'),phones,(t,p,s)=>{p.set(t.x,1.25,t.z);s.set(1,2.5,1);});
 const bins=by(t=>t.amenity==='waste_basket');inst(new THREE.CylinderGeometry(0.25,0.22,0.9,8),M('#2b3a33'),bins,(t,p,s)=>{p.set(t.x,0.45,t.z);s.set(1,1,1);});
 const stops=by(t=>t.highway==='bus_stop');inst(GB,M('#a9c4d6'),stops,(t,p,s)=>{p.set(t.x,1.3,t.z);s.set(3,0.1,1.4);});inst(GB,M('#3a3f45'),stops,(t,p,s)=>{p.set(t.x+1.4,1.3,t.z);s.set(0.08,2.6,0.08);});
 inst(new THREE.CylinderGeometry(0.25,0.25,0.06,12),M('#d9201e'),stops,(t,p,s)=>{p.set(t.x-1.6,2.6,t.z);tmpQ.setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);s.set(1,1,1);});
 inst(new THREE.CylinderGeometry(0.05,0.05,2.8,6),M('#3a3f45'),stops,(t,p,s)=>{p.set(t.x-1.6,1.4,t.z);s.set(1,1,1);});
 const fount=by(t=>t.amenity==='fountain');inst(new THREE.CylinderGeometry(2.2,2.4,0.6,16),M('#c9c3b5'),fount,(t,p,s)=>{p.set(t.x,0.3,t.z);s.set(1,1,1);});inst(new THREE.CylinderGeometry(2,2,0.05,16),M('#6fb6dc'),fount,(t,p,s)=>{p.set(t.x,0.58,t.z);s.set(1,1,1);});
 SIGNALS=by(t=>t.highway==='traffic_signals').slice(0,300).map(t=>{const g=new THREE.Group();g.position.set(t.x+3,0,t.z+3);const pole=new THREE.Mesh(GC,M('#2d3238'));pole.scale.set(0.08,3.4,0.08);pole.position.y=1.7;g.add(pole);
  const box=new THREE.Mesh(GB,M('#1d1f22'));box.scale.set(0.35,0.95,0.3);box.position.y=3.6;g.add(box);const L=['#3a0c0c','#3a300c','#0c3a14'].map((c,i)=>{const m=new THREE.Mesh(GS,new THREE.MeshBasicMaterial({color:c}));m.scale.setScalar(0.11);m.position.set(0,3.9-i*0.29,0.16);g.add(m);return m;});g.userData.L=L;g.userData.ph=Math.random()*20;world.add(g);return g;});}
/* name signs on real places */
let SIGNS=[];
function signTex(txt,emo){const c=document.createElement('canvas'),g=c.getContext('2d');g.font='bold 30px Georgia, serif';const w=Math.min(620,Math.ceil(g.measureText(txt).width)+90);c.width=w;c.height=56;
 g.fillStyle='rgba(251,245,230,0.96)';g.strokeStyle='#6b4f2e';g.lineWidth=4;g.beginPath();g.moveTo(10,2);g.lineTo(w-10,2);g.quadraticCurveTo(w-2,2,w-2,10);g.lineTo(w-2,46);g.quadraticCurveTo(w-2,54,w-10,54);g.lineTo(10,54);g.quadraticCurveTo(2,54,2,46);g.lineTo(2,10);g.quadraticCurveTo(2,2,10,2);g.fill();g.stroke();
 g.font='30px serif';g.fillText(emo,10,39);g.font='bold 26px Georgia, serif';g.fillStyle='#3d2c17';g.fillText(txt.length>34?txt.slice(0,33)+'…':txt,52,37);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return {t,w:c.width,h:c.height};}
function buildSigns(){SIGNS=[];const seen=new Set();for(const p of CITY.pois){const n=p.t.name;if(!n||seen.has(n+'|'+Math.round(p.p[0]/30)+Math.round(p.p[1]/30)))continue;seen.add(n+'|'+Math.round(p.p[0]/30)+Math.round(p.p[1]/30));
  const s=new THREE.Sprite(new THREE.SpriteMaterial({depthTest:true,transparent:true}));const hgt=p.b?(p.way?Math.min(p.b.top+3,p.b.top+3):Math.min(5,p.b.top*0.5+2)):3.2;s.position.set(p.p[0],hgt,p.p[1]);s.userData.poi=p;s.visible=false;world.add(s);SIGNS.push(s);if(SIGNS.length>1500)break;}}
function updateSigns(){if(!CITY)return;const cx=camera.position.x,cz=camera.position.z,far=pl.mode==='map'?Math.min(420,orbit.r*1.1):130;let n=0;
 for(const s of SIGNS){const d=Math.hypot(s.position.x-cx,s.position.z-cz);const show=d<far&&n<140&&!(s.userData.poi.b&&s.userData.poi.b.yr>yearU.value);if(show){n++;if(!s.userData.tex){const p=s.userData.poi,st=signTex(p.t.name,poiEmoji(p.t));s.material.map=st.t;s.material.needsUpdate=true;s.userData.tex=st;}
   const k=pl.mode==='map'?clamp(d/28,1,22):clamp(d/22,0.6,3);s.scale.set(st2w(s)*k,1.1*k,1);}s.visible=show;}}
const st2w=s=>s.userData.tex?s.userData.tex.w/s.userData.tex.h*1.1:6;
/* ---------- moving life (cars, buses, people, boats) ---------- */
let movers=[];
function carModel(kind){const g=new THREE.Group();if(kind==='bus'){const red=O.left&&O.cc==='gb';const col=red?'#c8201e':'#2f74c0';B(2.5,2.2,10,col,0,0.5,0,g);if(red)B(2.5,2.1,10,col,0,2.7,0,g);B(2.56,0.7,9.4,'#a8d8ef',0,1.6,0,g);if(red)B(2.56,0.7,9.4,'#a8d8ef',0,3.6,0,g);
  [[1.1,3.6],[-1.1,3.6],[1.1,-3.6],[-1.1,-3.6]].forEach(q=>{const w=new THREE.Mesh(GC,M('#1d1f22'));w.scale.set(0.5,0.35,0.5);w.rotation.z=Math.PI/2;w.position.set(q[0],0.5,q[1]);g.add(w);});return g;}
 const col=kind==='cab'?'#1d1f22':pickR(['#d9534f','#5b8bd6','#f2f2f2','#3a3f45','#f2c14e','#6fae5a','#9aa0a6','#2b3a5a','#b58ad8']);B(1.9,0.8,4.4,col,0,0.35,0,g);B(1.7,0.7,2.2,kind==='cab'?'#1d1f22':col,0,1.15,-0.2,g);B(1.74,0.5,2.24,'#a8d8ef',0,1.2,-0.2,g);
 [[0.85,1.4],[-0.85,1.4],[0.85,-1.4],[-0.85,-1.4]].forEach(q=>{const w=new THREE.Mesh(GC,M('#1d1f22'));w.scale.set(0.36,0.26,0.36);w.rotation.z=Math.PI/2;w.position.set(q[0],0.36,q[1]);g.add(w);});
 g.userData.lights=[0.6,-0.6].map(x=>{const m=new THREE.Mesh(GS,new THREE.MeshBasicMaterial({color:'#fffbe0'}));m.scale.setScalar(0.13);m.position.set(x,0.6,2.21);g.add(m);return m;});return g;}
function personModel(){const g=new THREE.Group(),c=pickR(['#d9534f','#5b8bd6','#f2c14e','#6fae5a','#3a3f45','#b58ad8','#e08a5a','#f2f2f2']);const body=new THREE.Mesh(GC,M(c));body.scale.set(0.24,0.75,0.2);body.position.y=1.05;g.add(body);
 const legs=new THREE.Mesh(GC,M(pickR(['#2b3a5a','#3a3f45','#6b4a2b','#1d1f22'])));legs.scale.set(0.2,0.7,0.16);legs.position.y=0.35;g.add(legs);S(0.17,pickR(['#f1c9a0','#d9a07a','#a86f4a','#6e4a32','#f6d6b8']),0,1.6,0,g);return g;}
function boatModel(){const g=new THREE.Group();B(3.2,1,12,'#fbfbfb',0,-0.3,0,g);B(2.8,1.6,6,'#d9e6ee',0,0.7,-1,g);B(3.25,0.2,12.1,'#2f74c0',0,0.3,0,g);return g;}
function startLife(){movers.forEach(m=>world.remove(m.g));movers=[];const C=CITY;const cars=C.cars||[];
 const NC=Math.min(140,Math.floor(cars.length*0.7)),NP=Math.min(160,Math.floor(C.foot.length*0.9)+20);
 const spawn=(list,kind)=>{if(!list.length)return;const way=pickR(list),i=Math.floor(Math.random()*(way.pts.length-1));const g=kind==='person'?personModel():kind==='boat'?boatModel():carModel(kind);world.add(g);
  movers.push({g,kind,way,i,t:Math.random(),dir:way.oneway?1:(Math.random()<0.5?1:-1),sp:kind==='person'?1.2+Math.random()*0.6:kind==='bus'?7:kind==='boat'?4:8+Math.random()*5,ph:Math.random()*6});};
 const busRoads=cars.filter(w=>w.bus);for(let k=0;k<NC;k++)spawn(k%9===0&&busRoads.length?busRoads:cars,k%9===0&&busRoads.length?'bus':(O.cc==='gb'&&k%5===0?'cab':'car'));
 const walk=C.foot.length?C.foot:cars;for(let k=0;k<NP;k++)spawn(walk,'person');
 const riv=C.rivers.map(el=>({pts:el.geometry.filter(Boolean).map(p=>toL(p.lat,p.lon)),oneway:false,w:20,y:0})).filter(w=>w.pts.length>1);for(let k=0;k<Math.min(6,riv.length*3);k++)spawn(riv,'boat');}
function stepMovers(dt){const C=CITY;if(!C)return;for(const m of movers){const pts=m.way.pts;let a=pts[m.i],b=pts[m.i+1];if(!a||!b){m.i=0;continue;}const len=Math.hypot(b[0]-a[0],b[1]-a[1])||0.01;
  let ahead=false;if(m.kind!=='person'&&m.kind!=='boat'){const red=Math.sin(T*0.25+m.ph)>0.85;if(red&&((m.dir>0&&m.t>0.8)||(m.dir<0&&m.t<0.2))&&len>20)ahead=true;}
  if(!ahead)m.t+=m.dir*m.sp*dt/len;
  if(m.t>1||m.t<0){const endIdx=m.t>1?m.i+1:m.i;let nextSeg=m.dir>0?m.i+1:m.i-1;
   if(nextSeg>=0&&nextSeg<pts.length-1&&m.kind!=='boat'){const nid=m.way.ids&&m.way.ids[endIdx],g=m.kind==='person'?C.fgraph:C.graph,opts=nid&&g.get(nid)?g.get(nid).filter(o=>o[0]!==m.way):[];
    if(opts.length&&Math.random()<0.35){const [w,j]=pickR(opts);m.way=w;if(w.oneway||j===0){m.dir=1;m.i=Math.min(j,w.pts.length-2);m.t=0;}else if(j===w.pts.length-1){m.dir=-1;m.i=j-1;m.t=1;}else{m.dir=Math.random()<0.5?1:-1;m.i=m.dir>0?j:j-1;m.t=m.dir>0?0:1;}}
    else{m.i=nextSeg;m.t=m.dir>0?0:1;}}
   else{const nid=m.way.ids&&m.way.ids[endIdx],g=m.kind==='person'?C.fgraph:C.graph,opts=nid&&g.get(nid)?g.get(nid).filter(o=>o[0]!==m.way):[];
    if(opts.length&&m.kind!=='boat'){const [w,j]=pickR(opts);m.way=w;if(w.oneway||j===0){m.dir=1;m.i=Math.min(j,w.pts.length-2);m.t=0;}else if(j===w.pts.length-1){m.dir=-1;m.i=j-1;m.t=1;}else{m.dir=Math.random()<0.5?1:-1;m.i=m.dir>0?j:j-1;m.t=m.dir>0?0:1;}}
    else if(!m.way.oneway){m.dir*=-1;m.t=clamp(m.t,0,1);}else{m.i=0;m.t=0;}}
   a=m.way.pts[m.i];b=m.way.pts[m.i+1];if(!a||!b)continue;}
  const len2=Math.hypot(b[0]-a[0],b[1]-a[1])||0.01,dx=(b[0]-a[0])/len2*m.dir,dz=(b[1]-a[1])/len2*m.dir;
  let off=m.kind==='person'?(m.way.w>4?m.way.w/2+0.8:0.5)*(m.ph>3?1:-1):m.kind==='boat'?0:(Math.max(1.6,m.way.w/4))*(O.left?-1:1)*(m.way.oneway?0.3:1);
  const x=a[0]+(b[0]-a[0])*m.t+(-dz)*-off,z=a[1]+(b[1]-a[1])*m.t+dx*-off;m.g.position.set(x,(m.way.y||0)+(m.kind==='boat'?0.2:0),z);m.g.rotation.y=Math.atan2(dx,dz);
  if(m.kind==='person'){m.g.position.y+=Math.abs(Math.sin(T*8+m.ph))*0.06;}
  m.g.visible=Math.hypot(x-camera.position.x,z-camera.position.z)<(pl.mode==='map'?900:450);}
 SIGNALS.forEach(s=>{const ph=(T*0.25+s.userData.ph)%3;s.userData.L[0].material.color.set(ph<1?'#ff3b30':'#3a0c0c');s.userData.L[1].material.color.set(ph>=1&&ph<1.3?'#ffcc00':'#3a300c');s.userData.L[2].material.color.set(ph>=1.3?'#34c759':'#0c3a14');});}
/* ---------- real local sun & time ---------- */
let timeMode='live',manualHour=12;
function localSolarHour(){const d=new Date();return ((d.getUTCHours()+d.getUTCMinutes()/60+O.lon/15)%24+24)%24;}
function cityHour(){return timeMode==='live'?localSolarHour():manualHour;}
function updateSky(){const h=cityHour(),doy=Math.floor((Date.now()-Date.UTC(new Date().getUTCFullYear(),0,0))/864e5),decl=23.44*Math.sin((284+doy)/365*2*Math.PI)*Math.PI/180,lat=O.lat*Math.PI/180,ha=(h-12)*15*Math.PI/180;
 const el=Math.asin(Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos(ha)),az=Math.atan2(-Math.sin(ha),Math.tan(decl)*Math.cos(lat)-Math.sin(lat)*Math.cos(ha));
 const day=clamp((el*180/Math.PI+6)/14,0,1);sun.position.set(Math.sin(az)*Math.cos(el)*500,Math.max(30,Math.sin(el)*500),-Math.cos(az)*Math.cos(el)*500);sun.intensity=0.85*day+0.03;hemi.intensity=0.35+0.45*day;
 const sky=new THREE.Color('#0b1530').lerp(new THREE.Color(el<0.12&&el>-0.1?'#f0a868':'#9fc9e6'),day);if(typeof WX!=='undefined'&&WX&&LAY.weather&&(WX.cloud_cover>70||WX.weather_code>=51))sky.lerp(new THREE.Color('#8a949e'),0.45*day);scene.background=sky;scene.fog.color.copy(sky);
 const night=1-day;bMat.emissiveIntensity=night*0.95;if(LAMPS)LAMPS.material.emissive.set(night>0.4?'#f2d27a':'#000');movers.forEach(m=>{if(m.g.userData.lights)m.g.userData.lights.forEach(l=>l.visible=night>0.4);});
 const hh=Math.floor(h),mm=Math.floor((h-hh)*60);$('clock').textContent=(timeMode==='live'?'🕐 Live sun time ':'🕐 ')+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
/* ---------- info card (real data + online pictures) ---------- */
let infoB=null;$('iInside').onclick=()=>enterInside(infoB);
async function showInfo(b,poi){infoB=b;$('iInside').style.display=b?'':'none';const t=Object.assign({},b?b.t:{},poi?poi.t:{});const pois=(b&&b.pois)||[];if(!poi&&pois.length)Object.assign(t,pois[0].t,{name:pois[0].t.name||t.name});
 const name=t.name||(t['addr:housenumber']?(t['addr:housenumber']+' '+(t['addr:street']||'')):'Building');const kindTxt=(poiKind(t)||'building').replace(/_/g,' ');
 const rows=[];const add=(k,v)=>{if(v)rows.push('<div><b>'+k+'</b> '+String(v).replace(/</g,'&lt;')+'</div>');};
 add('Type',poiEmoji(t)+' '+kindTxt);add('Address',[t['addr:housenumber'],t['addr:street'],t['addr:postcode']].filter(Boolean).join(' '));if(b&&!b.outlineOnly){add('Height',Math.round(b.top)+' m');}add('Floors',t['building:levels']);
 add('Built',t.start_date);add('Architect',t.architect);add('Style',t['building:architecture']);add('Opening hours',t.opening_hours);add('Cuisine',t.cuisine&&t.cuisine.replace(/_/g,' ').replace(/;/g,', '));add('Phone',t.phone||t['contact:phone']);add('Religion',t.religion);add('Operator',t.operator);
 const web=t.website||t['contact:website'];if(pois.length>1)add('Also inside',pois.slice(1,6).map(p=>poiEmoji(p.t)+' '+p.t.name).join(' · '));
 $('iTitle').textContent=poiEmoji(t)+' '+name;$('iBody').innerHTML=rows.join('')+(web?'<div><b>Website</b> <a href="'+encodeURI(web)+'" target="_blank" rel="noopener">'+web.replace(/^https?:\/\//,'').slice(0,40)+'</a></div>':'');$('iImg').innerHTML='<i>Looking for real photos online…</i>';$('iWiki').textContent='';$('info').style.display='flex';
 say(pickR(['Ooh, '+name+'!','Let\'s look inside '+name+' 👀','I\'ve heard of '+name+'!']),3.5);
 const c=b?centroid(b.poly.outer):poi.p,ll=toLL(c[0],c[1]);let img=null,extract='',link='';
 try{let title=null,lang='en';if(t.wikipedia){const m=t.wikipedia.split(':');if(m.length>1){lang=m[0];title=m.slice(1).join(':');}else title=t.wikipedia;}
  if(!title&&t.wikidata){const r=await fetch('https://www.wikidata.org/wiki/Special:EntityData/'+t.wikidata+'.json');const j=await r.json();const e=j.entities[t.wikidata];const sl=e.sitelinks&&e.sitelinks.enwiki;if(sl)title=sl.title;
   const p18=e.claims&&e.claims.P18&&e.claims.P18[0].mainsnak.datavalue;if(p18)img='https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(p18.value)+'?width=480';}
  if(!title&&t.name){const r=await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${ll[0]}|${ll[1]}&gsradius=80&gslimit=6&format=json&origin=*`);const j=await r.json();const hit=(j.query&&j.query.geosearch||[]).find(g=>g.title.toLowerCase().includes(t.name.toLowerCase().split(' ')[0]))||null;if(hit)title=hit.title;}
  if(title){const r=await fetch('https://'+lang+'.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(title.replace(/ /g,'_')));const j=await r.json();extract=j.extract||'';if(!img&&j.thumbnail)img=(j.originalimage&&j.originalimage.source)||j.thumbnail.source;link=j.content_urls&&j.content_urls.desktop&&j.content_urls.desktop.page;}
  if(!img){const r=await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${ll[0]}|${ll[1]}&ggsradius=60&ggslimit=6&ggsnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=480&format=json&origin=*`);const j=await r.json();const pg=j.query&&Object.values(j.query.pages||{}).find(p=>p.imageinfo);if(pg)img=pg.imageinfo[0].thumburl;}}catch(e){}
 $('iImg').innerHTML=img?'<img src="'+img+'" alt="'+name.replace(/"/g,'')+'">':'<i>No photo found online for this one.</i>';
 $('iWiki').innerHTML=extract?(extract.slice(0,420)+(extract.length>420?'…':'')+(link?' <a href="'+link+'" target="_blank" rel="noopener">Read more on Wikipedia</a>':'')):'';}
$('iClose').onclick=()=>{$('info').style.display='none';};
/* ---------- player, camera, controls ---------- */
const pl={x:0,y:0,z:0,yaw:Math.PI,pitch:0,mode:'map'};const keys={};const orbit={r:520,theta:1.1,phi:0.85,tx:0,tz:0};
function setMode(m){pl.mode=m;['mWalk','mFly','mMap'].forEach(id=>$(id).classList.remove('on'));$({walk:'mWalk',fly:'mFly',map:'mMap'}[m]).classList.add('on');$('updn').style.display=m==='fly'?'flex':'none';$('joy').style.display=m==='map'?'none':'block';
 if(m==='map'){orbit.tx=pl.x;orbit.tz=pl.z;}if(m==='walk')pl.y=0;if(m==='fly'&&pl.y<20)pl.y=40;
 showHint(m==='walk'?'Walk: WASD / arrows or the circle · drag to look · Shift = run · click buildings & signs for info':m==='fly'?'Fly: WASD to move · Space/E up · C/Q down · Shift = fast':'Overview: drag to spin · right-drag/two fingers to move · wheel to zoom · click a building for info, the ground to send Buddy',6);}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=true;if(e.code==='KeyF')setMode(pl.mode==='fly'?'walk':'fly');if(e.code==='KeyM')setMode(pl.mode==='map'?'walk':'map');});
addEventListener('keyup',e=>{keys[e.code]=false;});
const joyV=[0,0];let upDn=0;
function updatePlayer(dt){let f=0,s=0;if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyA||keys.ArrowLeft)s-=1;if(keys.KeyD||keys.ArrowRight)s+=1;f+=-joyV[1];s+=joyV[0];const fast=keys.ShiftLeft||keys.ShiftRight;
 if(pl.mode==='map'){const sp=orbit.r*0.8*dt,fx=-Math.cos(orbit.theta),fz=-Math.sin(orbit.theta);orbit.tx+=(fx*f+fz*s)*sp;orbit.tz+=(fz*f-fx*s)*sp;return;}
 const sp=(pl.mode==='fly'?40:4.5)*(fast?(pl.mode==='fly'?3.5:2.4):1)*dt,fx=Math.sin(pl.yaw),fz=Math.cos(pl.yaw),nx=pl.x+(fx*f-fz*s)*sp,nz=pl.z+(fz*f+fx*s)*sp;
 if(pl.mode==='walk'&&CITY){if(!CITY.buildingAt(nx,pl.z))pl.x=nx;if(!CITY.buildingAt(pl.x,nz))pl.z=nz;pl.y=0;}else{pl.x=nx;pl.z=nz;let u=upDn;if(keys.Space||keys.KeyE)u+=1;if(keys.KeyC||keys.KeyQ)u-=1;pl.y=Math.max(3,pl.y+u*sp);}}
function updateCam(){if(pl.mode==='map'){orbit.phi=clamp(orbit.phi,0.12,1.45);orbit.r=clamp(orbit.r,25,2600);const sp=Math.sin(orbit.phi);camera.position.set(orbit.tx+orbit.r*sp*Math.cos(orbit.theta),Math.max(3,orbit.r*Math.cos(orbit.phi)),orbit.tz+orbit.r*sp*Math.sin(orbit.theta));camera.lookAt(orbit.tx,0,orbit.tz);return;}
 const eye=pl.mode==='walk'?1.7:0;camera.position.set(pl.x,pl.y+eye,pl.z);camera.lookAt(pl.x+Math.sin(pl.yaw)*Math.cos(pl.pitch),pl.y+eye+Math.sin(pl.pitch),pl.z+Math.cos(pl.yaw)*Math.cos(pl.pitch));}
const ptrs=new Map();let tapStart=null,pinch0=null;
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,b:e.button});try{cv.setPointerCapture(e.pointerId);}catch(_){}if(ptrs.size===1)tapStart={x:e.clientX,y:e.clientY,t:performance.now()};else{tapStart=null;const a=[...ptrs.values()];pinch0={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),r:orbit.r,mx:(a[0].x+a[1].x)/2,my:(a[0].y+a[1].y)/2};}});
cv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 const pan=(px,py)=>{const k=orbit.r*0.0016,s=Math.sin(orbit.theta),c=Math.cos(orbit.theta);orbit.tx+=(-px*s+py*c)*k*-1;orbit.tz+=(px*c+py*s)*k*-1;};
 if(ptrs.size===1){if(pl.mode==='map'){if(p.b===2)pan(dx,dy);else{orbit.theta+=dx*0.006;orbit.phi-=dy*0.005;}}else{pl.yaw-=dx*0.005;pl.pitch=clamp(pl.pitch-dy*0.004,-1.3,1.2);}}
 else if(ptrs.size===2&&pinch0&&pl.mode==='map'){const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);orbit.r=pinch0.r*pinch0.d/Math.max(d,1);const mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;pan(mx-pinch0.mx,my-pinch0.my);pinch0.mx=mx;pinch0.my=my;}});
function pup(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch0=null;if(tapStart&&!ptrs.size&&Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y)<8&&performance.now()-tapStart.t<400)tap(e.clientX,e.clientY);if(!ptrs.size)tapStart=null;}
cv.addEventListener('pointerup',pup);cv.addEventListener('pointercancel',pup);
cv.addEventListener('wheel',e=>{if(pl.mode==='map')orbit.r*=e.deltaY>0?1.12:0.89;else if(pl.mode==='fly')pl.y=Math.max(3,pl.y+(e.deltaY>0?-5:5));e.preventDefault();},{passive:false});
const joy=$('joy'),knob=$('knob');let joyId=null;
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;try{joy.setPointerCapture(e.pointerId);}catch(_){}joyMove(e);e.stopPropagation();});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e);});
const joyEnd=e=>{if(e.pointerId!==joyId)return;joyId=null;joyV[0]=joyV[1]=0;knob.style.left='40px';knob.style.top='40px';};joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
function joyMove(e){const r=joy.getBoundingClientRect();let x=(e.clientX-r.left-65)/50,y=(e.clientY-r.top-65)/50;const m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}joyV[0]=x;joyV[1]=y;knob.style.left=(40+x*40)+'px';knob.style.top=(40+y*40)+'px';}
[['bUp',1],['bDn',-1]].forEach(q=>{const b=$(q[0]);b.addEventListener('pointerdown',e=>{upDn=q[1];e.stopPropagation();});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{upDn=0;}));});
const ray=new THREE.Raycaster(),v2=new THREE.Vector2();let petTarget=null;
function tap(sx,sy){if(!CITY)return;v2.set(sx/innerWidth*2-1,-(sy/innerHeight)*2+1);ray.setFromCamera(v2,camera);
 if(pet.root.visible&&ray.intersectObject(pet.root,true).length){pet.waveT=1.3;pet.happy=2.5;say(pickR(['Hi!! 👋','This city is amazing!','Take a photo of me here! 📸','I love exploring with you 💛',kind==='cat'?'Meow! 🐾':'Panda power! 🐼']));fxAt(sx,sy-30,'❤️');return;}
 if(layerTap(ray))return;
 const vis=SIGNS.filter(s=>s.visible);const hs=ray.intersectObjects(vis);const hb=ray.intersectObject(CITY.bMesh);const hg=ray.intersectObjects(world.children.filter(m=>m.isMesh&&m!==CITY.bMesh&&!m.isInstancedMesh));
 if(hs.length&&(!hb.length||hs[0].distance<hb[0].distance+2)){const p=hs[0].object.userData.poi;showInfo(p.b,p);return;}
 if(hb.length){const id=CITY.bIds[hb[0].faceIndex];const b=CITY.buildings.find(q=>q.id===id);if(b){let outer=b;if(b.part){const c=centroid(b.poly.outer);outer=CITY.buildings.find(q=>q.outlineOnly&&pip(c,q.poly.outer))||b;outer.pois=(outer.pois||[]).concat(b.pois||[]);}showInfo(outer.outlineOnly?Object.assign({},outer,{top:b.top}):outer,null);}return;}
 if(hg.length){const p=hg[0].point;petTarget=[p.x,p.z];fxAt(sx,sy,'👣');if(pl.mode==='map'){pl.x=p.x;pl.z=p.z;}}}
function fxAt(x,y,s){const d=document.createElement('div');d.className='fx';d.textContent=s;d.style.left=(x-12)+'px';d.style.top=(y-14)+'px';document.body.appendChild(d);requestAnimationFrame(()=>{d.style.transform='translateY(-50px)';d.style.opacity='0';});setTimeout(()=>d.remove(),1500);}
let hintT=0;function showHint(t,s){const h=$('hint');h.textContent=t;h.style.display='block';hintT=s||4;}
function showErr(t){$('errT').textContent=t;$('err').style.display='flex';}$('eClose').onclick=()=>{$('err').style.display='none';$('start').style.display='flex';};
const say=(t,s)=>{pet.say=t;pet.sayT=s||3.8;};
/* ---------- Buddy ---------- */
const seenPoi=new Set();let poiT=0;
function updateBuddy(dt){let pose='sit',moving=false;let tx,tz;
 if(petTarget){tx=petTarget[0];tz=petTarget[1];}else if(pl.mode==='map'){tx=pl.x;tz=pl.z;}else{const fx=Math.sin(pl.yaw),fz=Math.cos(pl.yaw);tx=pl.x+fx*6.5-fz*2.2;tz=pl.z+fz*6.5+fx*2.2;}
 const dx=tx-pet.x,dz=tz-pet.z,d=Math.hypot(dx,dz);
 if(d>120){pet.x=tx;pet.z=tz;}else if(d>1.1){const sp=Math.min(d,(d>8?9:4)*dt*(d>3?1.6:1));pet.x+=dx/d*sp;pet.z+=dz/d*sp;pet.ang=Math.atan2(dx,dz);moving=true;pose=d>6?'run':'walk';}
 else{if(petTarget){petTarget=null;say(pickR(['Here! 🐾','What\'s around here?','Nice spot!']),2.5);}pose=pet.waveT>0?'wave':((T%26)<5?'stars':'sit');}
 pet.y=pl.mode==='fly'&&!petTarget?pl.y-1.9:0;if(pl.mode==='fly'&&!petTarget){const fx=Math.sin(pl.yaw),fz=Math.cos(pl.yaw);pet.x=pl.x+fx*6.5-fz*2.8;pet.z=pl.z+fz*6.5+fx*2.8;pet.ang=pl.yaw+Math.PI;pose='sit';moving=false;}
 setPose(pose,T,moving);pet.root.position.set(pet.x,pet.y,pet.z);pet.root.rotation.y=pet.ang;pet.root.scale.setScalar(pl.mode==='map'?clamp(orbit.r/120,1.35,9):1.35);
 if(pet.sayT>0)pet.sayT-=dt;if(pet.waveT>0)pet.waveT-=dt;if(pet.happy>0)pet.happy-=dt;
 poiT-=dt;if(poiT<=0&&CITY){poiT=1.5;let best=null,bd=28;for(const p of CITY.pois){const dd=Math.hypot(p.p[0]-pet.x,p.p[1]-pet.z);if(dd<bd&&p.t.name&&!seenPoi.has(p.t.name)){bd=dd;best=p;}}
  if(best&&pet.sayT<=0){seenPoi.add(best.t.name);const k=poiKind(best.t);say(poiEmoji(best.t)+' '+(k==='restaurant'||k==='cafe'||k==='fast_food'?'Ooh, food! '+best.t.name:k==='museum'?'A museum: '+best.t.name+'!':k==='courthouse'?'That\'s '+best.t.name+' ⚖️':'Look: '+best.t.name+'!'),4);}}
 pet.chatT-=dt;if(pet.chatT<=0){pet.chatT=30+Math.random()*25;if(pet.sayT<=0)say(pickR(['So many real buildings! 🏙️','Listen to the traffic 🚗','Let\'s find a café ☕','Every street here is real!','Where shall we go next?']));}
 if(pet.sayT>0&&pet.say){pet.parts.head.getWorldPosition(tmpV);tmpV.y+=0.6*pet.root.scale.x/1.35;tmpV.project(camera);if(tmpV.z<1&&Math.abs(tmpV.x)<1.2&&Math.abs(tmpV.y)<1.2){bub.style.display='block';bub.textContent=pet.say;const bw=bub.offsetWidth;bub.style.left=clamp((tmpV.x+1)/2*innerWidth-bw/2,6,innerWidth-bw-6)+'px';bub.style.top=clamp((1-tmpV.y)/2*innerHeight-bub.offsetHeight-12,60,innerHeight-120)+'px';}else bub.style.display='none';}else bub.style.display='none';}
/* ---------- places ---------- */
const PRESETS=[['🇬🇧 Westminster & Big Ben, London',51.5007,-0.1246,'gb'],['🇬🇧 Tower Bridge & the Tower, London',51.5068,-0.0754,'gb'],['🇬🇧 Trafalgar Square, London',51.508,-0.1281,'gb'],['🇬🇧 British Museum, London',51.5194,-0.127,'gb'],
 ['🇬🇧 Piccadilly Circus, London',51.5101,-0.1340,'gb'],['🇬🇧 Royal Courts of Justice, London',51.5136,-0.1132,'gb'],['🇬🇧 Canary Wharf, London',51.5045,-0.0195,'gb'],['🇬🇧 St Paul\'s Cathedral, London',51.5138,-0.0984,'gb'],
 ['🇵🇰 Minar-e-Pakistan & Badshahi, Lahore',31.5904,74.3097,'pk'],['🇵🇰 Blue Area, Islamabad',33.7104,73.0597,'pk'],['🇫🇷 Eiffel Tower, Paris',48.8584,2.2945,'fr'],['🇺🇸 Times Square, New York',40.758,-73.9855,'us'],
 ['🇯🇵 Shibuya, Tokyo',35.6595,139.7005,'jp'],['🇦🇪 Downtown Dubai',25.1972,55.2744,'ae'],['🇮🇹 Colosseum, Rome',41.8902,12.4922,'it'],['🇦🇺 Sydney Harbour',-33.858,151.212,'au']];
function goTo(name,lat,lon,cc){$('start').style.display='none';$('places').style.display='none';$('info').style.display='none';O.lat=lat;O.lon=lon;O.name=name.replace(/^\S+\s/,'');O.cc=cc||'';O.left=LEFT_CC.includes(O.cc);O.R=+$('size').value||550;$('place').textContent=name;seenPoi.clear();
 orbit.tx=0;orbit.tz=0;orbit.r=O.R*0.95;scene.fog.near=O.R*1.2;scene.fog.far=O.R*3.2;camera.far=O.R*6;camera.updateProjectionMatrix();loadCity();}
function fill(box){PRESETS.forEach(p=>{const b=document.createElement('button');b.textContent=p[0];b.onclick=()=>goTo(p[0],p[1],p[2],p[3]);box.appendChild(b);});}fill($('pre1'));fill($('pre2'));
async function search(q,box){box.innerHTML='<i>Searching…</i>';try{const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q='+encodeURIComponent(q));const d=await r.json();box.innerHTML='';
 if(!d.length){box.innerHTML='<i>Nothing found — try another name.</i>';return;}d.forEach(it=>{const b=document.createElement('button');b.textContent='📍 '+it.display_name.split(',').slice(0,3).join(',');b.onclick=()=>goTo('📍 '+it.display_name.split(',')[0],+it.lat,+it.lon,(it.address&&it.address.country_code)||'');box.appendChild(b);});}
 catch(e){box.innerHTML='<i>Search needs internet.</i>';}}
[['q1','r1','s1'],['q2','r2','s2']].forEach(a=>{const go=()=>{const v=$(a[0]).value.trim();if(v)search(v,$(a[1]));};$(a[2]).onclick=go;$(a[0]).addEventListener('keydown',e=>{if(e.key==='Enter')go();});});
$('bPlaces').onclick=()=>{$('places').style.display='flex';};$('pClose').onclick=()=>{$('places').style.display='none';};
$('mWalk').onclick=()=>setMode('walk');$('mFly').onclick=()=>setMode('fly');$('mMap').onclick=()=>{orbit.r=Math.max(orbit.r,200);setMode('map');};
const kindLabel=()=>{$('bKind').textContent=kind==='cat'?'🐼 Panda':'🐱 Cat';};kindLabel();
$('bKind').onclick=()=>{kind=kind==='cat'?'panda':'cat';sset('bh.kind',kind);kindLabel();buildPet();say(kind==='cat'?'Meow! 🐱':'Panda here! 🐼');};
$('bFs').onclick=()=>{const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;try{f&&f.call(d);}catch(e){}};
/* time + history controls */
$('tSlider').oninput=e=>{timeMode='manual';manualHour=+e.target.value;$('tLive').classList.remove('on');updateSky();};$('tLive').onclick=()=>{timeMode='live';$('tLive').classList.add('on');updateSky();};
$('yr').oninput=e=>{const y=+e.target.value;yearU.value=y>=2026?2100:y;$('yrL').textContent=y>=2026?'Now':y;histPlay=false;$('yPlay').textContent='▶';};
let histPlay=false;$('yPlay').onclick=()=>{histPlay=!histPlay;$('yPlay').textContent=histPlay?'⏸':'▶';if(histPlay&&+$('yr').value>=2026)$('yr').value=$('yr').min;};
function stepHistory(dt){if(!histPlay)return;let y=+$('yr').value+dt*25;if(y>=2026){y=2026;histPlay=false;$('yPlay').textContent='▶';}$('yr').value=y;yearU.value=y>=2026?2100:y;$('yrL').textContent=y>=2026?'Now':Math.floor(y);}
/* =================== DISCOVERY LAYERS: live planes, airports, satellites, stories, photos, incidents, weather, interiors =================== */
const LAY={planes:false,sats:false,stories:true,photos:true,incidents:false,weather:true,airports:false};
const layerG=new THREE.Group();scene.add(layerG);
function farMat(c,e){return new THREE.MeshBasicMaterial({color:c,fog:false});}
function labelSprite(txt,emo,bg){const st=signTex(txt,emo);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:st.t,depthTest:false,transparent:true,fog:false}));s.userData.tex=st;s.renderOrder=5;return s;}
function setSpriteScale(s,k){const t=s.userData.tex;if(t)s.scale.set(t.w/t.h*k,k,1);}
async function jget(url,opt){const r=await fetch(url,opt);if(!r.ok)throw new Error(r.status);return r.json();}
/* ---------- live planes (ADS-B: adsb.lol / airplanes.live / OpenSky) ---------- */
const planes=new Map();let planeT=0,planeSrc='';
function planeModel(){const g=new THREE.Group();const m=farMat('#f4f4f0');const body=new THREE.Mesh(GC,m);body.scale.set(1.6,16,1.6);body.rotation.x=Math.PI/2;g.add(body);
 const w=new THREE.Mesh(GB,farMat('#c9d6e2'));w.scale.set(18,0.4,3);g.add(w);const tl=new THREE.Mesh(GB,farMat('#d9534f'));tl.scale.set(0.4,3.5,2.4);tl.position.set(0,1.8,-7);g.add(tl);const ts=new THREE.Mesh(GB,farMat('#c9d6e2'));ts.scale.set(6,0.3,1.8);ts.position.set(0,0,-7);g.add(ts);
 const blink=new THREE.Mesh(GS,new THREE.MeshBasicMaterial({color:'#ff3b30',fog:false}));blink.scale.setScalar(0.7);blink.position.set(0,-1,0);g.add(blink);g.userData.blink=blink;return g;}
async function fetchPlanes(){const lat=O.lat.toFixed(4),lon=O.lon.toFixed(4);let ac=null;
 for(const u of [`https://api.adsb.lol/v2/point/${lat}/${lon}/40`,`https://api.airplanes.live/v2/point/${lat}/${lon}/40`]){try{const j=await jget(u);if(j&&j.ac){ac=j.ac.map(a=>({id:a.hex,cs:(a.flight||a.r||a.hex||'').trim(),lat:a.lat,lon:a.lon,alt:(a.alt_geom||(typeof a.alt_baro==='number'?a.alt_baro:0))*0.3048,trk:a.track||0,gs:(a.gs||0)*0.514,type:a.t||'',ground:a.alt_baro==='ground'}));planeSrc=u.includes('adsb.lol')?'adsb.lol':'airplanes.live';break;}}catch(e){}}
 if(!ac){try{const d=0.6;const j=await jget(`https://opensky-network.org/api/states/all?lamin=${O.lat-d}&lomin=${O.lon-d*1.6}&lamax=${O.lat+d}&lomax=${O.lon+d*1.6}`);ac=(j.states||[]).map(s=>({id:s[0],cs:(s[1]||s[0]).trim(),lon:s[5],lat:s[6],alt:s[13]||s[7]||0,trk:s[10]||0,gs:s[9]||0,ground:s[8]}));planeSrc='OpenSky';}catch(e){}}
 if(!ac){showHint('✈️ Live plane data is not reachable right now (the free flight-tracking servers may be busy).',5);return;}
 const seen=new Set();for(const a of ac){if(a.lat==null||a.lon==null||a.ground)continue;seen.add(a.id);let p=planes.get(a.id);
  if(!p){const g=planeModel();layerG.add(g);const lab=labelSprite(a.cs+(a.type?' · '+a.type:''),'✈️');layerG.add(lab);p={g,lab};planes.set(a.id,p);}
  const q=toL(a.lat,a.lon);Object.assign(p,{x:q[0],z:q[1],y:Math.max(60,a.alt),trk:a.trk,gs:a.gs,a,t0:performance.now()});}
 for(const [id,p] of planes)if(!seen.has(id)){layerG.remove(p.g);layerG.remove(p.lab);planes.delete(id);}
 if(ac.length&&!fetchPlanes.said){fetchPlanes.said=1;say('Look up! '+planes.size+' real planes in the sky right now ✈️',4.5);}}
function updatePlanes(dt){if(!LAY.planes)return;planeT-=dt;if(planeT<=0){planeT=10;fetchPlanes();}
 const cam=camera.position;for(const [,p] of planes){const el=(performance.now()-p.t0)/1000,r=p.trk*Math.PI/180,x=p.x+Math.sin(r)*p.gs*el,z=p.z-Math.cos(r)*p.gs*el;
  p.g.position.set(x,p.y,z);p.g.rotation.y=Math.atan2(Math.sin(r),-Math.cos(r));const d=Math.hypot(x-cam.x,p.y-cam.y,z-cam.z),k=Math.max(3,d/260);p.g.scale.setScalar(k);
  p.g.userData.blink.visible=(T*2%1)<0.3;p.lab.position.set(x,p.y+12*k,z);setSpriteScale(p.lab,7*k);}}
/* ---------- airports (OpenStreetMap) ---------- */
let airportsLoaded=false;
async function loadAirports(){if(airportsLoaded)return;airportsLoaded=true;const q=`[out:json][timeout:25];nwr["aeroway"="aerodrome"]["iata"](around:70000,${O.lat},${O.lon});out center tags;`;
 for(const ep of OVP){try{const j=await jget(ep,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
  (j.elements||[]).forEach(e=>{const c=e.center||e;if(c.lat==null)return;const p=toL(c.lat,c.lon),t=e.tags||{};const g=new THREE.Group();g.position.set(p[0],0,p[1]);
   const tw=new THREE.Mesh(GC,farMat('#e8e2d6'));tw.scale.set(12,90,12);tw.position.y=45;g.add(tw);const cab=new THREE.Mesh(GC,farMat('#5b8bd6'));cab.scale.set(20,14,20);cab.position.y=97;g.add(cab);
   const km=(Math.hypot(p[0],p[1])/1000).toFixed(0);const lab=labelSprite((t.name||'Airport')+' ('+t.iata+') · '+km+' km','🛫');lab.position.y=170;setSpriteScale(lab,60);g.add(lab);g.userData.airport=t;layerG.add(g);});
  if(j.elements&&j.elements.length)say('There are '+j.elements.length+' airports around here 🛫',4);break;}catch(e){}}}
/* ---------- satellites (CelesTrak + satellite.js) ---------- */
let SATS=[],satT=0,satLoading=false;const satG=new THREE.Group();scene.add(satG);
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
async function loadSats(){if(SATS.length||satLoading)return;satLoading=true;try{if(!window.satellite)await loadScript('https://cdn.jsdelivr.net/npm/satellite.js@5.0.0/dist/satellite.min.js');
 const txt=[];for(const grp of ['stations','visual']){try{const r=await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP='+grp+'&FORMAT=tle');if(r.ok)txt.push(await r.text());}catch(e){}}
 const lines=txt.join('\n').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);const seen=new Set();
 for(let i=0;i+2<lines.length;i++){if(lines[i+1].startsWith('1 ')&&lines[i+2].startsWith('2 ')){const name=lines[i];if(!seen.has(name)){seen.add(name);try{SATS.push({name,rec:satellite.twoline2satrec(lines[i+1],lines[i+2])});}catch(e){}}i+=2;}}
 if(!SATS.length)throw new Error('none');say('Tracking '+SATS.length+' real satellites! 🛰️',4);}catch(e){showHint('🛰️ Satellite data could not load right now.',4);}satLoading=false;}
function updateSats(dt){satG.visible=LAY.sats;if(!LAY.sats||!SATS.length)return;satT-=dt;if(satT>0)return;satT=1;const now=new Date(),gmst=satellite.gstime(now),obs={longitude:satellite.degreesToRadians(O.lon),latitude:satellite.degreesToRadians(O.lat),height:0.02};
 let up=0;satG.position.copy(camera.position);
 for(const s of SATS){let v=null;try{const pv=satellite.propagate(s.rec,now);if(pv.position){const ecf=satellite.eciToEcf(pv.position,gmst);const la=satellite.ecfToLookAngles(obs,ecf);if(la.elevation>0.09)v=la;}}catch(e){}
  if(!v){if(s.m)s.m.visible=s.l.visible=false;continue;}up++;
  if(!s.m){const iss=/ISS|ZARYA/.test(s.name);s.m=new THREE.Mesh(GS,new THREE.MeshBasicMaterial({color:iss?'#ffd27a':'#e8f0ff',fog:false}));s.m.scale.setScalar(iss?22:12);satG.add(s.m);
   s.l=labelSprite(iss?'ISS — International Space Station':s.name.replace(/\s+\(.*/,''),iss?'🧑‍🚀':'🛰️');satG.add(s.l);}
  const R=2600,el=v.elevation,az=v.azimuth,x=Math.sin(az)*Math.cos(el)*R,y=Math.sin(el)*R,z=-Math.cos(az)*Math.cos(el)*R;s.m.position.set(x,y,z);s.m.visible=true;s.l.visible=true;s.l.position.set(x,y+60,z);setSpriteScale(s.l,48);}
 if(!updateSats.said&&up){updateSats.said=1;const iss=SATS.find(s=>/ISS|ZARYA/.test(s.name)&&s.m&&s.m.visible);say(iss?'The ISS is above us right now! 🧑‍🚀':up+' satellites are above us right now 🛰️',5);}}
/* ---------- stories & history (Wikipedia + Wikidata) ---------- */
let STORIES=[],storyLoaded=false;
async function loadStories(){if(storyLoaded||!CITY)return;storyLoaded=true;const rad=Math.min(10000,Math.round(O.R*1.4));const got=new Map();
 try{const j=await jget(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${O.lat}|${O.lon}&gsradius=${rad}&gslimit=150&format=json&origin=*`);(j.query&&j.query.geosearch||[]).forEach(g=>got.set('w:'+g.pageid,{title:g.title,lat:g.lat,lon:g.lon,year:0,src:'wiki'}));}catch(e){}
 try{const q=`SELECT ?item ?itemLabel ?coord (MIN(?d) AS ?date) (SAMPLE(?enwiki) AS ?wp) WHERE { SERVICE wikibase:around { ?item wdt:P625 ?coord. bd:serviceParam wikibase:center "Point(${O.lon} ${O.lat})"^^geo:wktLiteral. bd:serviceParam wikibase:radius "${(rad/1000).toFixed(2)}". } { ?item wdt:P585 ?d } UNION { ?item wdt:P571 ?d } UNION { ?item wdt:P580 ?d } OPTIONAL { ?enwiki schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>. } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } GROUP BY ?item ?itemLabel ?coord LIMIT 400`;
  const j=await jget('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q));
  (j.results&&j.results.bindings||[]).forEach(b=>{const m=b.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);if(!m)return;const y=parseInt((b.date&&b.date.value||'').replace(/^-/,'-'),10);const title=b.wp?decodeURIComponent(b.wp.value.split('/wiki/')[1]).replace(/_/g,' '):b.itemLabel.value;
   const key='t:'+title;const ex=[...got.values()].find(s=>s.title===title);if(ex){if(y)ex.year=y;ex.qid=b.item.value.split('/').pop();}else if(!/^Q\d+$/.test(title))got.set(key,{title,lat:+m[2],lon:+m[1],year:y||0,qid:b.item.value.split('/').pop(),src:'wd',wiki:!!b.wp});});}catch(e){}
 for(const s of got.values()){const p=toL(s.lat,s.lon);if(Math.abs(p[0])>O.R*1.6||Math.abs(p[1])>O.R*1.6)continue;const b=CITY&&CITY.buildingAt(p[0],p[1]);const h=b?b.top+6:8;
  const g=new THREE.Group();g.position.set(p[0],0,p[1]);const pole=new THREE.Mesh(GC,M('#8a6237'));pole.scale.set(0.12,h,0.12);pole.position.y=h/2;g.add(pole);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(1.2),new THREE.MeshLambertMaterial({color:s.year&&s.year<1900?'#b58ad8':'#f2c14e',emissive:'#403010'}));gem.position.y=h+1.5;g.add(gem);g.userData.gem=gem;
  const lab=labelSprite((s.year?(s.year<0?Math.abs(s.year)+' BC':s.year)+' · ':'')+s.title,s.year?'📜':'📖');lab.position.y=h+4;lab.visible=false;g.add(lab);g.userData.story=s;g.userData.lab=lab;layerG.add(g);STORIES.push(g);}
 if(STORIES.length)say('I found '+STORIES.length+' real stories and history spots here 📜',4.5);}
let lastHistYear=0;
function updateStories(){const cam=camera.position,yr=yearU.value;let shown=0;for(const g of STORIES){const s=g.userData.story;const vis=LAY.stories&&(!s.year||s.year<=yr);g.visible=vis;if(!vis)continue;
 const d=Math.hypot(g.position.x-cam.x,g.position.z-cam.z);g.userData.gem.rotation.y+=0.03;const near=d<(pl.mode==='map'?Math.min(500,orbit.r*1.1):160)&&shown<60;g.userData.lab.visible=near;if(near){shown++;setSpriteScale(g.userData.lab,pl.mode==='map'?clamp(d/26,1.2,20):clamp(d/20,0.8,3));}}
 if(histPlay){const y=Math.floor(yr);if(y!==lastHistYear){lastHistYear=y;const ev=STORIES.find(g=>g.userData.story.year===y);if(ev)say('📜 '+y+': '+ev.userData.story.title,3.5);}}}
async function storyCard(s){$('iTitle').textContent=(s.year?'📜 ':'📖 ')+s.title;$('iBody').innerHTML=s.year?'<div><b>Date</b> '+(s.year<0?Math.abs(s.year)+' BC':s.year)+'</div>':'';$('iImg').innerHTML='<i>Loading from Wikipedia…</i>';$('iWiki').textContent='';$('iInside').style.display='none';$('info').style.display='flex';
 try{const j=await jget('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(s.title.replace(/ /g,'_')));$('iImg').innerHTML=j.thumbnail?'<img src="'+((j.originalimage&&j.originalimage.source)||j.thumbnail.source)+'" alt="">':'';
  $('iWiki').innerHTML=(j.extract||'')+(j.content_urls?' <a href="'+j.content_urls.desktop.page+'" target="_blank" rel="noopener">Read more on Wikipedia</a>':'');}catch(e){$('iImg').innerHTML='<i>Could not load the story right now.</i>';}}
/* ---------- real photos placed where they were taken (Wikimedia Commons) ---------- */
let PHOTOS=[],photosLoaded=false;
async function loadPhotos(){if(photosLoaded)return;photosLoaded=true;const rad=Math.min(10000,Math.round(O.R*1.2));
 try{const j=await jget(`https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${O.lat}|${O.lon}&ggsradius=${rad}&ggslimit=60&ggsnamespace=6&prop=imageinfo|coordinates&iiprop=url|extmetadata&iiurlwidth=512&format=json&origin=*`);
  const pages=Object.values(j.query&&j.query.pages||{});const loader=new THREE.TextureLoader();loader.setCrossOrigin('anonymous');
  pages.forEach(pg=>{const ii=pg.imageinfo&&pg.imageinfo[0],c=pg.coordinates&&pg.coordinates[0];if(!ii||!c||!/\.(jpe?g|png)$/i.test(pg.title))return;const md=ii.extmetadata||{};const date=(md.DateTimeOriginal&&md.DateTimeOriginal.value||md.DateTime&&md.DateTime.value||'').replace(/<[^>]*>/g,'');const yr=parseInt((date.match(/\d{4}/)||[0])[0],10)||0;
   const p=toL(c.lat,c.lon);if(CITY&&CITY.buildingAt(p[0],p[1]))return;const g=new THREE.Group();g.position.set(p[0],0,p[1]);const post=new THREE.Mesh(GC,M('#3a3f45'));post.scale.set(0.1,5,0.1);post.position.y=2.5;g.add(post);
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({color:'#ffffff'}));sp.position.y=7;sp.scale.set(6,4.5,1);g.add(sp);loader.load(ii.thumburl,t=>{sp.material.map=t;sp.material.needsUpdate=true;const a=t.image.width/t.image.height;sp.scale.set(4.5*a,4.5,1);},undefined,()=>{g.visible=false;});
   g.userData.photo={title:pg.title.replace(/^File:/,'').replace(/\.\w+$/,''),url:ii.thumburl,page:ii.descriptionurl,date,yr,artist:(md.Artist&&md.Artist.value||'').replace(/<[^>]*>/g,'').trim(),lic:md.LicenseShortName&&md.LicenseShortName.value};g.userData.sp=sp;layerG.add(g);PHOTOS.push(g);});}catch(e){}}
function updatePhotos(){const yr=yearU.value,cam=camera.position;for(const g of PHOTOS){const ph=g.userData.photo;g.visible=LAY.photos&&(!ph.yr||ph.yr<=yr)&&Math.hypot(g.position.x-cam.x,g.position.z-cam.z)<(pl.mode==='map'?900:300);const k=pl.mode==='map'?clamp(orbit.r/120,1,6):1;g.scale.setScalar(k);}}
function photoCard(ph){$('iTitle').textContent='📷 '+ph.title;$('iImg').innerHTML='<img src="'+ph.url+'" alt="">';$('iBody').innerHTML=(ph.date?'<div><b>Taken</b> '+ph.date+'</div>':'')+(ph.artist?'<div><b>Photographer</b> '+ph.artist.slice(0,80).replace(/</g,'&lt;')+'</div>':'')+(ph.lic?'<div><b>Licence</b> '+ph.lic+'</div>':'');
 $('iWiki').innerHTML='A real photo taken at this exact spot, from Wikimedia Commons. <a href="'+ph.page+'" target="_blank" rel="noopener">See it on Commons</a>';$('iInside').style.display='none';$('info').style.display='flex';}
/* ---------- reported incidents (UK police open data) ---------- */
let INC=[],incLoaded=false;const INC_E={'anti-social-behaviour':'📢','bicycle-theft':'🚲','burglary':'🏠','criminal-damage-arson':'🔥','drugs':'💊','other-theft':'👜','possession-of-weapons':'⚠️','public-order':'📢','robbery':'💰','shoplifting':'🛒','theft-from-the-person':'👛','vehicle-crime':'🚗','violent-crime':'⚠️','other-crime':'❗'};
async function loadIncidents(){if(incLoaded)return;incLoaded=true;if(O.cc!=='gb'){showHint('🚓 Reported-incident data is only available for the UK (police open data).',5);return;}
 try{const a=await jget(`https://data.police.uk/api/crimes-street/all-crime?lat=${O.lat}&lng=${O.lon}`);const by=new Map();
  a.forEach(c=>{const k=c.location.latitude+','+c.location.longitude;if(!by.has(k))by.set(k,[]);by.get(k).push(c);});
  for(const [k,list] of by){const [la,lo]=k.split(',').map(Number),p=toL(la,lo);const g=new THREE.Group();g.position.set(p[0],0,p[1]);const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,0.15,16),new THREE.MeshBasicMaterial({color:'#5b8bd6',transparent:true,opacity:0.75}));disc.position.y=0.2;g.add(disc);
   const lab=labelSprite(list.length+' report'+(list.length>1?'s':'')+' · '+list[0].month,INC_E[list[0].category]||'❗');lab.position.y=4;setSpriteScale(lab,2.4);g.add(lab);g.userData.inc=list;layerG.add(g);INC.push(g);}
  say('These are real police reports near here from '+(a[0]?a[0].month:'last month')+' 🚓',4.5);}catch(e){showHint('🚓 Police data could not load right now.',4);}}
function incCard(list){$('iTitle').textContent='🚓 Reported near '+(list[0].location.street&&list[0].location.street.name||'here');$('iImg').innerHTML='';const counts={};list.forEach(c=>counts[c.category]=(counts[c.category]||0)+1);
 $('iBody').innerHTML='<div><b>Month</b> '+list[0].month+'</div>'+Object.entries(counts).map(([k,v])=>'<div><b>'+(INC_E[k]||'❗')+' '+k.replace(/-/g,' ')+'</b> '+v+'</div>').join('');
 $('iWiki').innerHTML='From data.police.uk (open data). Locations are moved to a nearby point on purpose to protect privacy.';$('iInside').style.display='none';$('info').style.display='flex';}
/* ---------- live weather (Open-Meteo) ---------- */
let WX=null,wxT=0;const rainGeo=new THREE.BufferGeometry(),rainN=2500,rainArr=new Float32Array(rainN*3);for(let i=0;i<rainN;i++){rainArr[i*3]=(Math.random()-.5)*120;rainArr[i*3+1]=Math.random()*60;rainArr[i*3+2]=(Math.random()-.5)*120;}
rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArr,3));const rainMat=new THREE.PointsMaterial({color:0xaac8e8,size:0.15,transparent:true,opacity:0.8});const rain=new THREE.Points(rainGeo,rainMat);rain.frustumCulled=false;rain.visible=false;scene.add(rain);
const WCODE=c=>c===0?['☀️','clear sky']:c<=3?['⛅','partly cloudy']:c<=48?['🌫️','foggy']:c<=57?['🌦️','drizzle']:c<=67?['🌧️','rain']:c<=77?['🌨️','snow']:c<=82?['🌧️','rain showers']:c<=86?['🌨️','snow showers']:['⛈️','thunderstorm'];
async function loadWeather(){try{const j=await jget(`https://api.open-meteo.com/v1/forecast?latitude=${O.lat}&longitude=${O.lon}&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover`);WX=j.current;const w=WCODE(WX.weather_code);
 $('wx').textContent=w[0]+' '+Math.round(WX.temperature_2m)+'°C · '+w[1]+' · wind '+Math.round(WX.wind_speed_10m)+' km/h';say('Real weather here right now: '+w[1]+', '+Math.round(WX.temperature_2m)+'°C '+w[0],4.5);}catch(e){WX=null;$('wx').textContent='';}}
function updateWeather(dt){wxT-=dt;if(LAY.weather&&wxT<=0){wxT=600;loadWeather();}const c=WX&&LAY.weather?WX.weather_code:0,wet=c>=51&&c<=67||c>=80&&c<=82||c>=95,snow=c>=71&&c<=77||c>=85&&c<=86;
 rain.visible=(wet||snow)&&pl.mode!=='map';if(rain.visible){rainMat.color.set(snow?0xffffff:0xaac8e8);rainMat.size=snow?0.3:0.15;rain.position.set(camera.position.x,camera.position.y-25,camera.position.z);const sp=snow?2:20;for(let i=0;i<rainN;i++){rainArr[i*3+1]-=sp*dt;if(rainArr[i*3+1]<0)rainArr[i*3+1]+=60;}rainGeo.attributes.position.needsUpdate=true;}
}
/* ---------- inside buildings (OpenStreetMap indoor data, or a reconstructed interior) ---------- */
const hideU={value:new Array(8).fill(-5)};let inside=null;
function parseLevels(v){if(v==null)return[0];return String(v).split(/;|,/).map(s=>{const m=s.match(/-?\d+(\.\d+)?/);return m?parseFloat(m[0]):0;});}
async function enterInside(b){if(!b||!CITY)return;$('info').style.display='none';exitInside();const ids=[];if(!b.outlineOnly&&b.id>=0)ids.push(b.id);
 CITY.buildings.forEach(q=>{if(q.part&&ids.length<8&&pip(centroid(q.poly.outer),b.poly.outer))ids.push(q.id);});hideU.value=ids.concat(new Array(8-ids.length).fill(-5)).slice(0,8);
 const g=new THREE.Group();world.add(g);const top=b.top||20,lv=parseFloat(b.t['building:levels'])||Math.max(1,Math.round(top*0.85/3.3)),nL=clamp(Math.round(lv),1,60),FH=Math.min(3.6,Math.max(2.8,(top*0.9)/nL));
 inside={b,g,n:nL,FH,floors:[]};const outer=b.poly.outer;const c=centroid(outer);
 const kindT=poiKind(Object.assign({},b.t,...(b.pois||[]).map(p=>p.t)));
 // glass shell
 const glass=new THREE.MeshLambertMaterial({color:'#bcd4e6',transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false});
 for(let k=0;k<nL;k++){const fg=new THREE.Group();fg.position.y=k*FH;g.add(fg);inside.floors.push(fg);const A=Acc();A.uv=A.yr=A.id=null;addFlatPoly(A,outer,b.poly.holes,0.06,new THREE.Color(k%2?'#d9c9a8':'#e6d8bc'));
  const sl=meshFrom(A,flatMat);world.remove(sl);fg.add(sl);
  for(let i=0;i<outer.length-1;i++){const a=outer[i],bb=outer[i+1],len=Math.hypot(bb[0]-a[0],bb[1]-a[1]);if(len<0.3)continue;const w=new THREE.Mesh(GB,glass);w.scale.set(len,FH,0.15);w.position.set((a[0]+bb[0])/2,FH/2,(a[1]+bb[1])/2);w.rotation.y=-Math.atan2(bb[1]-a[1],bb[0]-a[0]);fg.add(w);}}
 // core: stairs + lift
 for(let k=0;k<nL;k++){const fg=inside.floors[k];const core=new THREE.Mesh(GB,M('#9aa0a6'));core.scale.set(3,FH,3);core.position.set(c[0],FH/2,c[1]);fg.add(core);}
 showHint('Looking inside '+(b.t.name||'this building')+'… checking OpenStreetMap indoor maps',4);
 // OSM indoor data
 let rooms=[];try{const bb=b.bb,ll0=toLL(bb[0],bb[3]),ll1=toLL(bb[2],bb[1]);const q=`[out:json][timeout:25][bbox:${ll0[0]},${ll0[1]},${ll1[0]},${ll1[1]}];(way["indoor"];relation["indoor"];way["room"];node["level"]["name"];);out geom;`;
  for(const ep of OVP){try{const j=await jget(ep,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});rooms=j.elements||[];break;}catch(e){}}}catch(e){}
 if(!inside||inside.b!==b)return;let usedIndoor=0;const minLv=Math.min(0,...rooms.filter(e=>e.tags&&e.tags.level!=null).map(e=>Math.min(...parseLevels(e.tags.level))));
 for(const el of rooms){const t=el.tags||{};if(el.type==='node'){continue;}if(!t.indoor&&!t.room)continue;for(const lv0 of parseLevels(t.level)){const k=clamp(Math.round(lv0-minLv),0,nL-1);const fg=inside.floors[k];
   for(const poly of polysOf(el)){if(!pip(centroid(poly.outer),outer))continue;usedIndoor++;const A=Acc();A.uv=A.yr=A.id=null;const col=t.indoor==='corridor'?'#efe9dc':t.indoor==='area'?'#e2ecd6':['#cfe0ec','#ecd9cf','#dcd6ec','#e6ecd0','#f0e0c0'][hashStr(String(el.id))%5];addFlatPoly(A,poly.outer,poly.holes,0.1,new THREE.Color(col));const m=meshFrom(A,flatMat);world.remove(m);fg.add(m);
    if(t.indoor==='room'||t.room){const r=poly.outer;for(let i=0;i<r.length-1;i++){const a=r[i],bb=r[i+1],len=Math.hypot(bb[0]-a[0],bb[1]-a[1]);if(len<0.3)continue;const w=new THREE.Mesh(GB,M('#f4efe6'));w.scale.set(len,FH*0.8,0.12);w.position.set((a[0]+bb[0])/2,FH*0.4,(a[1]+bb[1])/2);w.rotation.y=-Math.atan2(bb[1]-a[1],bb[0]-a[0]);fg.add(w);}}
    if(t.name||t.ref){const lab=labelSprite(t.name||('Room '+t.ref),t.amenity?poiEmoji(t):'🚪');const cc=centroid(poly.outer);lab.position.set(cc[0],FH*0.9,cc[1]);setSpriteScale(lab,1.4);fg.add(lab);}}}}
 if(!usedIndoor)reconstructInterior(b,kindT,FH,nL);
 // shops/POIs on their level
 (b.pois||[]).forEach(p=>{const lv=p.t.level!=null?parseLevels(p.t.level)[0]:0;const k=clamp(Math.round(lv-minLv),0,nL-1);const lab=labelSprite(p.t.name,poiEmoji(p.t));lab.position.set(p.p[0],FH*0.95,p.p[1]);setSpriteScale(lab,1.6);inside.floors[k].add(lab);});
 $('insideBar').style.display='flex';$('floor').max=nL;$('floor').value=nL;$('floorL').textContent='All '+nL+' floors';
 setMode('map');orbit.tx=c[0];orbit.tz=c[1];orbit.r=Math.max(40,Math.sqrt(Math.abs(area(outer)))*2.2);orbit.phi=0.9;
 say(usedIndoor?'Real indoor map from OpenStreetMap! 🗺️':'Here\'s how it might look inside 🏢',4);showHint(usedIndoor?'🏢 Real indoor rooms from OpenStreetMap · use the floor slider':'🏢 No public indoor map for this building, so this inside is reconstructed from its type, size and floors · use the floor slider',7);}
function reconstructInterior(b,kindT,FH,nL){const outer=b.poly.outer,bb=b.bb,step=kindT==='museum'?9:kindT==='courthouse'?8:6;
 for(let k=0;k<nL;k++){const fg=inside.floors[k],A=Acc();A.uv=A.yr=A.id=null;const wallC=new THREE.Color('#f4efe6');
  for(let x=bb[0]+step;x<bb[2];x+=step)for(let z=bb[1];z<bb[3];z+=step){const mid=[x,z+step/2];if(!pip(mid,outer)||Math.random()<0.3)continue;const w=new THREE.Mesh(GB,M('#f4efe6'));w.scale.set(0.15,FH*0.85,step*0.75);w.position.set(x,FH*0.42,z+step/2);fg.add(w);}
  for(let z=bb[1]+step;z<bb[3];z+=step)for(let x=bb[0];x<bb[2];x+=step){const mid=[x+step/2,z];if(!pip(mid,outer)||Math.random()<0.3)continue;const w=new THREE.Mesh(GB,M('#f4efe6'));w.scale.set(step*0.75,FH*0.85,0.15);w.position.set(x+step/2,FH*0.42,z);fg.add(w);}
  for(let x=bb[0]+step/2;x<bb[2];x+=step)for(let z=bb[1]+step/2;z<bb[3];z+=step){if(!pip([x,z],outer))continue;furnish(fg,x,z,kindT,k,FH);}}}
function furnish(fg,x,z,kindT,k,FH){const r=Math.random();const add=(w,h,d,c,dx,dz,y)=>{const m=new THREE.Mesh(GB,M(c));m.scale.set(w,h,d);m.position.set(x+dx,(y||0)+h/2,z+dz);fg.add(m);};
 if(kindT==='museum'||kindT==='gallery'){add(1,1,1,'#e8e2d6',0,0);const s=new THREE.Mesh(r<0.5?new THREE.IcosahedronGeometry(0.4,0):new THREE.TorusKnotGeometry(0.25,0.08,24,6),M(pickR(['#d9b45a','#b8a27a','#7fb8a8','#c9734a'])));s.position.set(x,1.45,z);fg.add(s);add(2.2,1.4,0.08,pickR(['#c9734a','#5b8bd6','#6fae5a']),0,-2.4,1);}
 else if(kindT==='courthouse'){add(3,1,1,'#6b4a2b',0,-1.5);add(0.8,0.5,0.8,'#8a6237',0,-2.8,1);for(let i=-1;i<=1;i++)add(2.6,0.45,0.6,'#8a6237',0,i*1.2+0.8);}
 else if(/restaurant|cafe|pub|bar|fast_food/.test(kindT)&&k===0){for(let i=-1;i<=1;i+=2){add(1,0.05,1,'#fbfbfb',i*1.3,0,0.75);add(0.1,0.75,0.1,'#6b4a2b',i*1.3,0);[[-0.7,0],[0.7,0]].forEach(q=>add(0.45,0.45,0.45,'#c9734a',i*1.3+q[0],q[1]));}}
 else if(/shop|supermarket|convenience|clothes|books/.test(kindT)&&k===0){for(let i=-1;i<=1;i++)add(0.6,1.8,3,pickR(['#f2c14e','#d9534f','#5b8bd6','#6fae5a']),i*1.6,0);}
 else if(/apartments|house|residential|detached|terrace/.test(kindT)){if(r<0.4){add(2,0.5,1.4,'#fbf7ee',0,0);add(2,0.2,1.4,'#7aa6d8',0,0,0.5);}else if(r<0.75){add(2,0.45,0.9,'#e08a5a',0,0);add(1.2,0.4,0.6,'#8a5a3a',0,1.2);}else add(1.4,0.75,0.8,'#b8875a',0,0);}
 else{if(r<0.7){add(1.6,0.05,0.8,'#e8e2d6',0,0,0.75);add(0.08,0.75,0.08,'#555',0,0);add(0.5,0.35,0.05,'#222',0,-0.2,0.8);add(0.5,0.5,0.5,'#3a3f45',0,0.6);}else add(0.8,1.6,0.4,'#9aa0a6',0,0);}}
function exitInside(){if(!inside)return;world.remove(inside.g);inside.g.traverse(o=>{if(o.geometry&&o.geometry!==GB&&o.geometry!==GC&&o.geometry!==GS)o.geometry.dispose();});inside=null;hideU.value=new Array(8).fill(-5);$('insideBar').style.display='none';}
$('floor').oninput=e=>{if(!inside)return;const n=+e.target.value;inside.floors.forEach((f,i)=>f.visible=i<n);$('floorL').textContent=n>=inside.n?'All '+inside.n+' floors':'Up to floor '+(n-1);};
$('exitIn').onclick=exitInside;
/* ---------- layers panel ---------- */
function layerUI(){const box=$('layList');box.innerHTML='';[['stories','📜 Stories & history','Wikipedia + Wikidata: real events and places with dates, shown on the history slider'],['photos','📷 Real photos on the spot','Wikimedia Commons photos placed where they were taken'],['planes','✈️ Live planes','Real aircraft overhead right now (ADS-B flight tracking)'],['airports','🛫 Airports nearby','Airports within 70 km, from OpenStreetMap'],['sats','🛰️ Satellites overhead','Real satellites and the ISS above this city right now'],['weather','🌦️ Live weather','Real current weather here (Open-Meteo)'],['incidents','🚓 Reported incidents (UK)','Police open data for the latest month (locations are approximate)']].forEach(r=>{
 const b=document.createElement('button');b.className=LAY[r[0]]?'on':'';b.innerHTML=r[1]+'<br><small>'+r[2]+'</small>';b.style.textAlign='left';b.onclick=()=>{LAY[r[0]]=!LAY[r[0]];b.className=LAY[r[0]]?'on':'';applyLayer(r[0]);};box.appendChild(b);});}
function applyLayer(k){if(k==='planes'){planes.forEach(p=>{p.g.visible=p.lab.visible=LAY.planes;});if(LAY.planes){planeT=0;camera.far=Math.max(camera.far,90000);camera.updateProjectionMatrix();}}
 if(k==='sats'&&LAY.sats){loadSats();camera.far=Math.max(camera.far,9000);camera.updateProjectionMatrix();}if(k==='stories'&&LAY.stories)loadStories();if(k==='photos'&&LAY.photos)loadPhotos();if(k==='incidents'){INC.forEach(g=>g.visible=LAY.incidents);if(LAY.incidents)loadIncidents();}
 if(k==='airports'){layerG.children.forEach(c=>{if(c.userData.airport)c.visible=LAY.airports;});if(LAY.airports){loadAirports();camera.far=Math.max(camera.far,90000);camera.updateProjectionMatrix();}}if(k==='weather'){wxT=LAY.weather?0:1e9;if(!LAY.weather){$('wx').textContent='';rain.visible=false;}}}
$('bLayers').onclick=()=>{layerUI();$('layers').style.display='flex';};$('lClose').onclick=()=>{$('layers').style.display='none';};
function resetLayers(){exitInside();planes.forEach(p=>{layerG.remove(p.g);layerG.remove(p.lab);});planes.clear();for(let i=layerG.children.length-1;i>=0;i--)layerG.remove(layerG.children[i]);STORIES=[];PHOTOS=[];INC=[];storyLoaded=photosLoaded=incLoaded=airportsLoaded=false;fetchPlanes.said=0;updateSats.said=0;wxT=0;$('wx').textContent='';}
function afterCityLoaded(){Object.keys(LAY).forEach(k=>{if(LAY[k])applyLayer(k);});}
function layerTap(ray){const hits=ray.intersectObjects(layerG.children,true);if(!hits.length)return false;let o=hits[0].object;while(o&&!o.userData.story&&!o.userData.photo&&!o.userData.inc&&!o.userData.airport&&o.parent!==layerG)o=o.parent;
 if(o&&o.userData.story){storyCard(o.userData.story);return true;}if(o&&o.userData.photo){photoCard(o.userData.photo);return true;}if(o&&o.userData.inc){incCard(o.userData.inc);return true;}
 for(const [,p] of planes){if(hits[0].object===p.lab||p.g.children.includes(hits[0].object)){const a=p.a;$('iTitle').textContent='✈️ '+(a.cs||'Aircraft');$('iImg').innerHTML='';$('iBody').innerHTML='<div><b>Altitude</b> '+Math.round(a.alt)+' m ('+Math.round(a.alt/0.3048)+' ft)</div><div><b>Speed</b> '+Math.round(a.gs*3.6)+' km/h</div><div><b>Heading</b> '+Math.round(a.trk)+'°</div>'+(a.type?'<div><b>Aircraft type</b> '+a.type+'</div>':'')+'<div><b>Data</b> '+planeSrc+' (live)</div>';$('iWiki').innerHTML=a.cs?'<a href="https://globe.adsb.lol/?icao='+a.id+'" target="_blank" rel="noopener">Follow this flight live</a>':'';$('iInside').style.display='none';$('info').style.display='flex';return true;}}
 return false;}
function updateLayers(dt){updatePlanes(dt);updateSats(dt);updateStories();updatePhotos();updateWeather(dt);}

/* ---------- loop ---------- */
let T=0,last=0,slowT=0;const tmpV=new THREE.Vector3(),bub=$('bubble');
function frame(now){requestAnimationFrame(frame);if(!last)last=now;const dt=Math.min(0.1,(now-last)/1000);last=now;T+=dt;
 if(hintT>0){hintT-=dt;if(hintT<=0)$('hint').style.display='none';}
 updatePlayer(dt);updateCam();if(CITY){stepMovers(dt);updateBuddy(dt);stepHistory(dt);updateLayers(dt);}
 slowT-=dt;if(slowT<=0){slowT=0.5;updateSky();updateSigns();if(CITY){const ll=toLL(pl.mode==='map'?orbit.tx:pl.x,pl.mode==='map'?orbit.tz:pl.z);$('coords').textContent=ll[0].toFixed(5)+', '+ll[1].toFixed(5);}}
 renderer.render(scene,camera);}
buildPet();updateSky();requestAnimationFrame(frame);
