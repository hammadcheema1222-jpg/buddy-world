
/* ===================== EXTRAS 10: street names on the roads, shop signs on the buildings, label de-cluttering, phone-first clean layout, live Nearby panel ===================== */

/* ---------- 1. Street names painted on the road surface (like a real map, readable from both sides) ---------- */
const nameTexCache=new Map();
function nameTex(txt,kind){const k=kind+'|'+txt;if(nameTexCache.has(k))return nameTexCache.get(k);const c=document.createElement('canvas'),g=c.getContext('2d');const fs=kind==='shop'?44:48;g.font=(kind==='shop'?'600 ':'bold ')+fs+'px '+(kind==='shop'?'Georgia, serif':'Arial, sans-serif');const w=Math.min(1024,Math.ceil(g.measureText(txt).width)+(kind==='shop'?60:24));c.width=w;c.height=kind==='shop'?72:64;
 g.font=(kind==='shop'?'600 ':'bold ')+fs+'px '+(kind==='shop'?'Georgia, serif':'Arial, sans-serif');g.textAlign='center';g.textBaseline='middle';
 if(kind==='road'){g.lineWidth=7;g.strokeStyle='rgba(20,20,24,0.85)';g.strokeText(txt,w/2,34);g.fillStyle='rgba(255,255,255,0.92)';g.fillText(txt,w/2,34);}
 else{g.fillStyle='#fff';g.fillText(txt,w/2,38);}
 const t=new THREE.CanvasTexture(c);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const r={t,w,h:c.height};nameTexCache.set(k,r);return r;}
let streetG=null;function buildStreetNames(){if(!CITY)return;if(streetG){world.remove(streetG);}streetG=new THREE.Group();world.add(streetG);const placed=new Map();let n=0;
 const ok=t=>t.name&&t.highway&&!/footway|path|steps|cycleway|service|track|corridor|bridleway|proposed|construction/.test(t.highway);
 const roads=CITY.roads.filter(el=>el.tags&&ok(el.tags)).sort((a,b)=>(ROADW[b.tags.highway]||5)-(ROADW[a.tags.highway]||5));
 for(const el of roads){if(n>450)break;const t=el.tags,pts=el.geometry.filter(Boolean).map(p=>toL(p.lat,p.lon)),w=ROADW[t.highway]||6;const h=clamp(w*0.42,1.6,4.2);const nt=nameTex(t.name,'road'),len=nt.w/nt.h*h;
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],sl=dist2(a,b);if(sl<len+6)continue;const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;const prev=placed.get(t.name)||[];if(prev.some(p=>Math.hypot(p[0]-mx,p[1]-mz)<140))continue;prev.push([mx,mz]);placed.set(t.name,prev);
   let ang=Math.atan2(b[1]-a[1],b[0]-a[0]);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
   const m=new THREE.Mesh(new THREE.PlaneGeometry(len,h),new THREE.MeshBasicMaterial({map:nt.t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.rotation.order='YXZ';m.rotation.set(-Math.PI/2,-ang,0);m.position.set(mx,(t.layer>0?6:0)+0.16,mz);m.renderOrder=1;streetG.add(m);n++;}}
 return n;}
function updStreetNames(){if(!streetG)return;const c=camera.position,far=pl.mode==='map'?Math.max(250,orbit.r*1.4):220;const show=!(pl.mode==='map'&&orbit.r>1400);streetG.visible=show;if(!show)return;for(const m of streetG.children)m.visible=Math.abs(m.position.x-c.x)<far&&Math.abs(m.position.z-c.z)<far;}

/* ---------- 2. Real shop signs on the shopfronts (name boards in brand-like colours, lit at night) ---------- */
const SIGN_C=k=>/restaurant|fast_food/.test(k)?['#7a1712','#f6e7c8']:/cafe|bakery|ice_cream/.test(k)?['#3b2a1d','#f4e3c3']:/pub|bar|biergarten|nightclub/.test(k)?['#14351f','#e8c66a']:/bank|atm|bureau/.test(k)?['#13284d','#ffffff']:/pharmacy|chemist|doctors|dentist|clinic/.test(k)?['#0d6e3b','#ffffff']:/hotel|hostel/.test(k)?['#2b2b2b','#e8d6a0']:/supermarket|convenience|greengrocer/.test(k)?['#0b5d8a','#ffffff']:/clothes|shoes|boutique|jewelry/.test(k)?['#111111','#f0f0f0']:/books|stationery|gift/.test(k)?['#5a2a5a','#ffffff']:['#24323f','#f2efe6'];
function boardTex(txt,k){const key='shop|'+k+'|'+txt;if(nameTexCache.has(key))return nameTexCache.get(key);const [bg,fg]=SIGN_C(k);const c=document.createElement('canvas'),g=c.getContext('2d');g.font='600 44px Georgia, serif';const w=Math.min(1024,Math.ceil(g.measureText(txt).width)+70);c.width=w;c.height=72;
 g.fillStyle=bg;g.fillRect(0,0,w,72);g.strokeStyle=fg;g.globalAlpha=0.5;g.lineWidth=3;g.strokeRect(6,6,w-12,60);g.globalAlpha=1;g.fillStyle=fg;g.font='600 44px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,w/2,39);
 const t=new THREE.CanvasTexture(c);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const r={t,w,h:72};nameTexCache.set(key,r);return r;}
let shopG=null,shopMats=[];const SIGNED=new Set();function buildShopSigns(){if(!CITY)return;if(shopG)world.remove(shopG);shopG=new THREE.Group();world.add(shopG);shopMats=[];SIGNED.clear();let n=0;const used=new Map();
 for(const p of CITY.pois){if(n>600)break;const t=p.t,k=poiKind(t);if(!t.name||!(t.shop||/restaurant|cafe|fast_food|pub|bar|bank|pharmacy|hotel|ice_cream|bakery|bureau_de_change|nightclub|cinema|theatre/.test(k)))continue;
  const b=p.b||CITY.buildingAt(p.p[0],p.p[1]);const o=b&&b.poly&&b.poly.outer;if(!o)continue;const c=centroid(o);let best=null,bd=1e9;
  for(let i=0;i<o.length-1;i++){const a=o[i],q=o[i+1],L=dist2(a,q);if(L<3)continue;const dx=q[0]-a[0],dz=q[1]-a[1];let tt=((p.p[0]-a[0])*dx+(p.p[1]-a[1])*dz)/(L*L);tt=clamp(tt,0.15,0.85);const x=a[0]+dx*tt,z=a[1]+dz*tt,d=Math.hypot(x-p.p[0],z-p.p[1]);if(d<bd){bd=d;best={a,q,L,x,z,i};}}
  if(!best||bd>25)continue;const ek=b.id+':'+best.i;const cnt=used.get(ek)||0;if(cnt>=Math.floor(best.L/5))continue;used.set(ek,cnt+1);
  let nx=-(best.q[1]-best.a[1])/best.L,nz=(best.q[0]-best.a[0])/best.L;if((c[0]-best.x)*nx+(c[1]-best.z)*nz>0){nx=-nx;nz=-nz;}
  const bt=boardTex(t.name,k),hh=0.62,ww=Math.min(best.L*0.9,Math.max(2.4,bt.w/bt.h*hh));const mat=new THREE.MeshLambertMaterial({map:bt.t,emissive:'#ffffff',emissiveMap:bt.t,emissiveIntensity:0});shopMats.push(mat);
  const m=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,0.12),mat);m.position.set(best.x+nx*0.12,3.35,best.z+nz*0.12);m.rotation.y=Math.atan2(nx,nz);m.userData.poi=p;shopG.add(m);SIGNED.add(p);
  if(t.amenity&&/pub|cafe|restaurant/.test(t.amenity)&&best.L>6){const hs=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.75,0.75),mat);hs.position.set(best.x+nx*0.6+(best.q[0]-best.a[0])/best.L*(ww/2+0.6),4.2,best.z+nz*0.6+(best.q[1]-best.a[1])/best.L*(ww/2+0.6));hs.rotation.y=Math.atan2(nx,nz)+Math.PI/2;shopG.add(hs);const arm=new THREE.Mesh(GB,M('#222'));arm.scale.set(0.05,0.05,0.9);arm.position.set(hs.position.x,4.62,hs.position.z);arm.rotation.y=Math.atan2(nx,nz);shopG.add(arm);}
  n++;}return n;}
function updShopSigns(){if(!shopG)return;const night=clamp((-solar().el/DEG+3)/9,0,1);shopMats.forEach(m=>m.emissiveIntensity=night*0.75);const c=camera.position,far=pl.mode==='map'?Math.min(500,orbit.r*1.3):260;shopG.visible=!(pl.mode==='map'&&orbit.r>900);if(shopG.visible)for(const m of shopG.children)m.visible=Math.abs(m.position.x-c.x)<far&&Math.abs(m.position.z-c.z)<far;}

/* ---------- 3. Label de-cluttering: project every label to the screen, keep the most important, hide overlaps (greedy rectangle packing) ---------- */
const v3=new THREE.Vector3();let dcT=0;
function declutter(dt){dcT-=dt;if(dcT>0)return;dcT=0.12;const f=innerHeight/(2*Math.tan(camera.fov*DEG/2));const items=[];const cam=camera.position;
 const add=(spr,pri)=>{if(!spr||!spr.visible)return;let p=spr.parent,ok=true;while(p){if(p.visible===false){ok=false;break;}p=p.parent;}if(!ok)return;spr.getWorldPosition(v3);const d=v3.distanceTo(cam);v3.project(camera);if(v3.z>1||Math.abs(v3.x)>1.2||Math.abs(v3.y)>1.2)return;
  const sx=(v3.x+1)/2*innerWidth,sy=(1-v3.y)/2*innerHeight,w=spr.scale.x/d*f,h=spr.scale.y/d*f;items.push({spr,pri:pri-d/1000,x:sx-w/2,y:sy-h/2,w,h});};
 for(const [,v] of VEH)add(v.g.userData.lab,5);for(const k in X2)if(Array.isArray(X2[k]))X2[k].forEach(g=>{if(g.visible)add(g.userData.lab,k==='help'?4.5:k==='cases'?3.5:3);});
 for(const s of SIGNS){if(s.visible&&pl.mode!=='map'&&SIGNED.has(s.userData.poi)&&s.position.distanceTo(cam)<90){s.visible=false;continue;}add(s,2);}
 items.sort((a,b)=>b.pri-a.pri);const kept=[];for(const it of items){let clash=false;for(const k of kept){const ox=Math.min(it.x+it.w,k.x+k.w)-Math.max(it.x,k.x),oy=Math.min(it.y+it.h,k.y+k.h)-Math.max(it.y,k.y);if(ox>4&&oy>4&&ox*oy>0.25*Math.min(it.w*it.h,k.w*k.h)){clash=true;break;}}if(clash)it.spr.visible=false;else kept.push(it);}}

/* ---------- 4. Phone-first, clean layout ---------- */
const CSS=document.createElement('style');CSS.textContent=`
#timebar.hide{display:none!important}
#nearP{position:fixed;left:8px;top:96px;width:250px;max-height:45vh;overflow:auto;z-index:5;padding:6px 8px;border-radius:12px;font:13px Georgia,serif}
#nearP .ni{display:flex;gap:6px;align-items:center;padding:3px 2px;border-bottom:1px solid rgba(107,79,46,.15);cursor:pointer}#nearP .ni:hover{background:#f3e8cf}#nearP .nd{margin-left:auto;font-size:11px;opacity:.7;white-space:nowrap}
#nearP h4{margin:2px 0 4px;font-size:13px;display:flex;justify-content:space-between;cursor:pointer}#nearP.min .ni{display:none}
#eyeB{position:fixed;left:8px;bottom:8px;z-index:12;width:40px;height:40px;border-radius:50%;padding:0;font-size:18px}
body.clean #hud,body.clean #top,body.clean #timebar,body.clean #nearP,body.clean #attr,body.clean #qbWrap,body.clean #mmC,body.clean #hint,body.clean #radar{display:none!important}
@media (max-width:760px){
 #hud{top:6px!important;left:6px!important;max-width:58vw!important;padding:3px 9px!important;font-size:12px!important;line-height:1.3;border-radius:14px}#hud #coords{display:none}#hud #place{font-size:13px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 #top{left:0!important;right:0!important;top:auto!important;bottom:0!important;max-width:100vw!important;border-radius:14px 14px 0 0!important;justify-content:space-around!important;flex-wrap:nowrap!important;padding:4px 2px calc(4px + env(safe-area-inset-bottom))!important;gap:2px!important}
 #top button{font-size:19px;padding:5px 0;min-width:42px;flex:1}
 #timebar{display:none!important;bottom:62px!important;width:94vw}#timebar.open{display:flex!important}
 #joy{bottom:178px!important;left:10px!important;width:104px!important;height:104px!important}#knob{width:40px!important;height:40px!important}
 #attr{bottom:94px!important;left:4px;right:auto!important;max-width:60vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:8px!important;opacity:.75}#attr.open{white-space:normal;max-width:94vw;font-size:10px!important}
 #hint{top:auto!important;bottom:126px!important;font-size:12px!important;max-width:88vw;white-space:normal!important;text-align:center}
 #mmC{top:6px!important;right:6px!important;width:84px!important;height:84px!important}
 #qbWrap{top:96px!important;right:6px!important}#qbWrap button{width:38px!important;height:38px!important;font-size:17px!important}
 #nearP{left:0;right:0;top:auto;bottom:56px;width:auto;max-height:38vh;border-radius:14px 14px 0 0;font-size:13px}#nearP.min{max-height:34px;overflow:hidden}
 #info{align-items:flex-end!important}#info .card{max-width:100vw!important;width:100vw;border-radius:16px 16px 0 0;max-height:62vh;margin-bottom:56px}
 #layers .card{max-height:75vh;margin-bottom:56px}#layers{align-items:flex-end!important}
 #folBar{bottom:126px!important}#radar{bottom:200px!important;width:120px!important;height:120px!important}
 #eyeB{bottom:auto;top:96px;left:auto;right:50px;width:38px;height:38px}
 .over .card{padding:12px 14px!important}
}`;document.head.appendChild(CSS);
MM.id='mmC';QB.id='qbWrap';
// on phones the buttons show just their icon; a ⏱️ button opens the time/history bar
const phone=()=>innerWidth<=760;function compactTop(){document.querySelectorAll('#top button').forEach(b=>{const cur=b.textContent;if(!b.dataset.full||(cur!==b.dataset.full&&cur!==b.dataset.full.split(' ')[0]))b.dataset.full=cur;const target=phone()?b.dataset.full.split(' ')[0]:b.dataset.full;b.title=b.dataset.full;if(cur!==target)b.textContent=target;});}
{const tb=document.createElement('button');tb.id='bTime';tb.textContent='⏱️ Time';tb.onclick=()=>$('timebar').classList.toggle(phone()?'open':'hide');$('top').insertBefore(tb,$('bFs'));const ab=$('attr');ab.onclick=()=>ab.classList.toggle('open');}
new MutationObserver(()=>setTimeout(compactTop,0)).observe($('top'),{subtree:true,characterData:true,childList:true});addEventListener('resize',compactTop);compactTop();
const EYE=document.createElement('button');EYE.id='eyeB';EYE.textContent='👁️';EYE.title='Clean view: hide everything but the map';EYE.onclick=()=>{document.body.classList.toggle('clean');EYE.textContent=document.body.classList.contains('clean')?'🙈':'👁️';};document.body.appendChild(EYE);

/* ---------- 5. Live "Nearby" side panel (bottom sheet on phones) ---------- */
const NP=document.createElement('div');NP.id='nearP';NP.className='paper'+(phone()?' min':'');NP.innerHTML='<h4 id="npH"><span>📡 Nearby</span><span id="npN"></span></h4><div id="npL"></div>';document.body.appendChild(NP);$('npH').onclick=()=>NP.classList.toggle('min');let npT=0;
function updNearby(dt){npT-=dt;if(npT>0||!CITY)return;npT=1.5;const f=focusXZ();const R=pl.mode==='map'?Math.max(200,orbit.r*0.8):220;const L=[];const d=(x,z)=>Math.hypot(x-f[0],z-f[1]);
 for(const [k,v] of VEH){if(v.x==null||!v.g.visible)continue;const dd=d(v.x,v.z);if(dd<R*1.5){const n=nextStop(v);L.push({e:v.L.tube?'🚇':'🚌',t:'<b>'+esc(v.L.name)+'</b> → '+esc((v.dest||'').slice(0,16))+(n?' <small>· '+esc(n.name.slice(0,14))+' '+(n.min?n.min+'m':'now')+'</small>':''),d:dd,pri:3,go:()=>follow(v.g,v,vehLabelText(v))});}}
 for(const k in X2)if(Array.isArray(X2[k])&&LAY[k])X2[k].forEach(g=>{if(!g.visible||!g.userData.text)return;const dd=d(g.position.x,g.position.z);if(dd<R)L.push({e:g.userData.emo||'📍',t:esc(g.userData.text.slice(0,40)),d:dd,pri:k==='help'?2.5:k==='cases'||k==='transit'?2:1,go:()=>{flyTo(g.position.x,g.position.z,Math.min(orbit.r,140));g.userData.card();}});});
 CITY.pois.forEach(p=>{if(!p.t.name)return;const dd=d(p.p[0],p.p[1]);if(dd<R*0.6)L.push({e:poiEmoji(p.t),t:esc(p.t.name.slice(0,36)),d:dd,pri:0.5,go:()=>{flyTo(p.p[0],p.p[1],Math.min(orbit.r,120));showInfo(null,p);}});});
 L.sort((a,b)=>(b.pri-a.pri)*80+(a.d-b.d));const seen=new Set();const top=L.filter(it=>{const k=it.t;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,phone()?12:12);$('npN').textContent=L.length+' ▾';
 $('npL').innerHTML=top.map((it,i)=>'<div class="ni" data-i="'+i+'"><span>'+it.e+'</span><span>'+it.t+'</span><span class="nd">'+(it.d<1000?Math.round(it.d)+' m':(it.d/1000).toFixed(1)+' km')+'</span></div>').join('');$('npL').querySelectorAll('.ni').forEach(el=>el.onclick=()=>{stopFollow();top[+el.dataset.i].go();if(phone())NP.classList.add('min');});}

/* ---------- wiring ---------- */
const _after10=afterCityLoaded;afterCityLoaded=function(){_after10();setTimeout(()=>{const a=buildStreetNames(),b=buildShopSigns();showHint('🏷️ '+a+' street names painted on the roads, '+b+' shop signs on the buildings.',4);},300);};
const _reset10=resetLayers;resetLayers=function(){_reset10();if(streetG){world.remove(streetG);streetG=null;}if(shopG){world.remove(shopG);shopG=null;}SIGNED.clear();};
const _upd10=updateLayers;updateLayers=function(dt){_upd10(dt);updStreetNames();updShopSigns();updNearby(dt);declutter(dt);};
