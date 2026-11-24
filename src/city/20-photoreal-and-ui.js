
/* ===================== EXTRAS 11: photo-real roofs & ground from satellite, real wall materials, seasons, wet roads, street photos while walking, logo & UI polish ===================== */

/* ---------- 1. Satellite photo draped on every roof and on the ground ---------- */
const SAT={tex:null,b:new THREE.Vector4(0,0,1,1),on:{value:0}};
async function satCanvas(){const R=O.R*1.25;let z=18;const n0=2**z;const tl=(lat,lon,n)=>{const la=lat*DEG;return [(lon+180)/360*n,(1-Math.log(Math.tan(la)+1/Math.cos(la))/Math.PI)/2*n];};
 let nw=toLL(-R,-R),se=toLL(R,R),a=tl(nw[0],nw[1],n0),b=tl(se[0],se[1],n0);if((Math.floor(b[0])-Math.floor(a[0])+1)*256>4096){z=17;}const n=2**z;a=tl(nw[0],nw[1],n);b=tl(se[0],se[1],n);const x0=Math.floor(a[0]),y0=Math.floor(a[1]),x1=Math.floor(b[0]),y1=Math.floor(b[1]),W=(x1-x0+1)*256,H=(y1-y0+1)*256;
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');let done=0,okN=0;const tot=(x1-x0+1)*(y1-y0+1);
 await Promise.all([...Array(tot).keys()].map(i=>new Promise(r=>{const x=x0+i%(x1-x0+1),y=y0+Math.floor(i/(x1-x0+1));const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{okN++;g.drawImage(im,(x-x0)*256,(y-y0)*256);if(++done%20===0)showHint('📸 Satellite photo '+Math.round(done/tot*100)+'%',2);r();};im.onerror=r;im.src='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/'+z+'/'+y+'/'+x;})));
 const lonOf=x=>x/n*360-180,latOf=y=>{const m=Math.PI-2*Math.PI*y/n;return 180/Math.PI*Math.atan(0.5*(Math.exp(m)-Math.exp(-m)));};const tlw=toL(latOf(y0),lonOf(x0)),brw=toL(latOf(y1+1),lonOf(x1+1));
 const tex=new THREE.CanvasTexture(cv);tex.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());tex.minFilter=THREE.LinearMipmapLinearFilter;if(okN<tot*0.6)throw new Error('imagery unavailable');return {tex,x0:tlw[0],z0:tlw[1],w:brw[0]-tlw[0],h:brw[1]-tlw[1],z};}
let photoMesh=null;async function photoReal(on){SAT.on.value=0;if(!on){if(photoMesh)photoMesh.visible=false;return;}if(!SAT.tex||SAT.lat!==O.lat){showHint('📸 Downloading the satellite photo of this area…',3);let s;try{s=await satCanvas();}catch(e){showHint('📸 Satellite photo not reachable right now.',3);return;}SAT.tex=s.tex;SAT.lat=O.lat;SAT.b.set(s.x0,s.z0,s.w,s.h);SAT.z=s.z;
  if(photoMesh)world.remove(photoMesh);const geo=new THREE.PlaneGeometry(s.w,s.h);geo.rotateX(-Math.PI/2);photoMesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:s.tex,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));photoMesh.position.set(s.x0+s.w/2,0.02,s.z0+s.h/2);photoMesh.renderOrder=-1;world.add(photoMesh);
  if(!/Esri/.test($('attr').textContent))$('attr').textContent+=' · Imagery © Esri, Maxar, Earthstar Geographics';}
 if(photoMesh)photoMesh.visible=true;SAT.on.value=1;showHint('📸 Photo-real: every roof and the ground now use the real satellite photo (zoom '+SAT.z+').',4);}

/* ---------- 2. Real wall materials (Poly Haven brick, plaster, concrete) chosen by each building's colour ---------- */
const WT={};{const tl=new THREE.TextureLoader();[['brick','red_brick_03'],['plaster','beige_wall_001'],['concrete','concrete_wall_001']].forEach(([k,f])=>{const t=tl.load(ASSET+'tex/'+f+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;WT[k]=t;});}
const satDummy=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1);
{const prev=bMat.onBeforeCompile;bMat.onBeforeCompile=(sh,r)=>{prev&&prev(sh,r);Object.assign(sh.uniforms,{tSat:{get value(){return SAT.tex||satDummy;}},uSatB:{value:SAT.b},uSatOn:SAT.on,tBrick:{value:WT.brick},tPlaster:{value:WT.plaster},tConc:{value:WT.concrete},uDetail:{get value(){return GQ==='low'?0:1;}}});
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tSat;uniform vec4 uSatB;uniform float uSatOn;uniform sampler2D tBrick;uniform sampler2D tPlaster;uniform sampler2D tConc;uniform float uDetail;').replace('diffuseColor.rgb*=1.0+(1.0-wall)*0.08;}','diffuseColor.rgb*=1.0+(1.0-wall)*0.08;\n if(uDetail>0.5&&wall>0.5){vec2 tg=normalize(vec2(-vNWb.z,vNWb.x));vec2 wuv=vec2(dot(vWPb.xz,tg),vWPb.y)/3.2;vec3 c0=vColor.rgb;float redness=c0.r-max(c0.g,c0.b);float light=dot(c0,vec3(0.33));vec3 det=redness>0.12?texture2D(tBrick,wuv).rgb*1.7:light>0.68?texture2D(tPlaster,wuv*0.6).rgb*1.25:texture2D(tConc,wuv*0.5).rgb*1.45;diffuseColor.rgb*=mix(vec3(1.0),det,0.55*(1.0-shop));}\n if(uSatOn>0.5&&vNWb.y>0.6){vec2 suv=vec2((vWPb.x-uSatB.x)/uSatB.z,1.0-(vWPb.z-uSatB.y)/uSatB.w);diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(tSat,suv).rgb*1.08,0.92);}}');};bMat.needsUpdate=true;}

/* ---------- 3. Seasons: autumn colours in Sept–Nov, bare-ish brown in winter, fresh green in spring (flipped south of the equator) ---------- */
function seasonTint(){const m=new Date().getMonth(),south=O.lat<0,mm=south?(m+6)%12:m;const autumn=mm===8?0.25:mm===9?0.6:mm===10?0.85:0;const winter=mm===11||mm<=1?0.6:0;const spring=mm>=2&&mm<=4?0.3:0;
 const target=autumn?new THREE.Color('#c8762a'):winter?new THREE.Color('#7d6a4a'):new THREE.Color('#7cc24f');const amt=autumn||winter||spring;if(!amt)return;
 world.traverse(o=>{const mat=o.material;if(!mat||Array.isArray(mat)||!mat.color||mat.userData.seasoned)return;const c=mat.color;if(!(c.g>c.r*1.05&&c.g>c.b*1.1))return;if(mat===flatMat)return;mat.userData.seasoned=1;const base=c.clone();c.copy(base.lerp(target,amt*(0.55+Math.random()*0.35)));});}

/* ---------- 4. Wet roads after real rain: darker, glossy-looking surfaces with sky glints ---------- */
const wetU={value:0};{const prev=flatMat.onBeforeCompile;flatMat.onBeforeCompile=(sh,r)=>{prev&&prev(sh,r);sh.uniforms.uWet=wetU;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uWet;').replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float grey=1.0-step(0.08,abs(vColor.r-vColor.b))*0.0;float isRoad=step(abs(vColor.r-vColor.g),0.06)*step(abs(vColor.g-vColor.b),0.08);float puddle=smoothstep(0.55,0.9,sin(vWP.x*0.21)*sin(vWP.z*0.17)*0.5+0.5);gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*0.62+vec3(0.06,0.08,0.11)*puddle*1.6,uWet*isRoad);}');};flatMat.needsUpdate=true;}
function updWet(dt){const raining=WX&&(WX.weather_code>=51&&WX.weather_code<=67||WX.weather_code>=80&&WX.weather_code<=82||WX.weather_code>=95)?1:WX&&WX.precipitation>0?0.6:0;wetU.value+=(raining-wetU.value)*Math.min(1,dt*0.2);}

/* ---------- 5. Real street photos while you walk (Panoramax picture-in-picture) ---------- */
let pipOn=false,pipLast=null,pipBusy=false;const PIP=document.createElement('div');PIP.id='pip';PIP.className='paper';PIP.style.cssText='position:fixed;right:10px;bottom:120px;width:210px;z-index:7;padding:4px;border-radius:12px;display:none;font:11px Georgia,serif';PIP.innerHTML='<img id="pipI" style="width:100%;border-radius:8px;display:block;cursor:zoom-in"><div id="pipT" style="padding:2px 4px"></div>';document.body.appendChild(PIP);
const pipCss=document.createElement('style');pipCss.textContent='@media (max-width:760px){#pip{width:150px!important;bottom:134px!important;right:6px!important}}body.clean #pip{display:none!important}';document.head.appendChild(pipCss);
async function updPip(){if(!pipOn||pl.mode!=='walk'||pipBusy)return;if(pipLast&&Math.hypot(pl.x-pipLast[0],pl.z-pipLast[1])<35)return;pipBusy=true;pipLast=[pl.x,pl.z];const ll=toLL(pl.x,pl.z),e=0.0007;
 try{const j=await jget(`https://api.panoramax.xyz/api/search?bbox=${ll[1]-e},${ll[0]-e},${ll[1]+e},${ll[0]+e}&limit=1`);const f=j.features&&j.features[0];if(f){const a=f.assets||{};$('pipI').src=(a.sd||a.thumb||{}).href;$('pipI').onclick=()=>card('📸 Real street photo here','<img src="'+esc((a.hd||a.sd||a.thumb).href)+'">','<div><b>Taken</b> '+esc((f.properties.datetime||'').slice(0,10))+'</div>','<a target="_blank" rel="noopener" href="https://api.panoramax.xyz/#focus=pic&pic='+f.id+'">Open in Panoramax (360° where available)</a>');$('pipT').textContent='📸 Real photo here · '+(f.properties.datetime||'').slice(0,10);PIP.style.display='block';}else{$('pipT').textContent='No open street photo here yet';}}catch(e){}pipBusy=false;}

/* ---------- 6. Logo, favicon & UI polish ---------- */
{const l=document.createElement('link');l.rel='icon';l.type='image/svg+xml';l.href=ASSET+'logo.svg';document.head.appendChild(l);const a=document.createElement('link');a.rel='apple-touch-icon';a.href=ASSET+'apple-touch-icon.png';document.head.appendChild(a);const m=document.createElement('meta');m.name='theme-color';m.content='#2f6fbf';document.head.appendChild(m);document.title='Buddy World · City';
 const ui=document.createElement('style');ui.textContent=`
 :root{--ink:#2b1d10;--paper:rgba(250,244,230,.92);--line:rgba(107,79,46,.55);--accent:#2f6fbf;--warm:#f09a3e}
 .paper{background:var(--paper)!important;border:1px solid var(--line)!important;border-radius:14px!important;box-shadow:0 6px 22px rgba(30,20,8,.18),0 1px 0 rgba(255,255,255,.6) inset!important;-webkit-backdrop-filter:blur(10px) saturate(1.2);backdrop-filter:blur(10px) saturate(1.2)}
 button{border-radius:10px;border:1px solid var(--line);background:#fffaf0;color:var(--ink);font-family:inherit;transition:transform .08s,background .15s;cursor:pointer}
 button:active{transform:scale(.96)}button.on{background:linear-gradient(#ffe2b8,#f7c98a)!important;box-shadow:inset 0 0 0 2px var(--warm)!important}
 #hud{display:flex!important;gap:8px;align-items:center}#hudLogo{width:34px;height:34px;flex:none;border-radius:9px}
 .over{background:rgba(20,14,8,.35)!important;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
 .card h1{display:flex;align-items:center;gap:10px}
 #info .card,#layers .card{animation:bwUp .22s ease-out}@keyframes bwUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
 #layList button{min-height:56px;border-radius:12px}#layList>div{color:var(--accent);letter-spacing:.3px}
 input[type=range]{accent-color:var(--warm)}
 @media (max-width:760px){#hudLogo{width:26px;height:26px}}`;document.head.appendChild(ui);
 const hud=$('hud');const lg=document.createElement('img');lg.id='hudLogo';lg.src=ASSET+'logo.svg';lg.alt='Buddy World';const wrap=document.createElement('div');while(hud.firstChild)wrap.appendChild(hud.firstChild);hud.appendChild(lg);hud.appendChild(wrap);
 const sh=document.querySelector('#start .card h1');if(sh){const im=document.createElement('img');im.src=ASSET+'logo.svg';im.style.cssText='width:56px;height:56px';sh.prepend(im);}
 const ld=$('ldPet');if(ld){const im=document.createElement('img');im.src=ASSET+'logo.svg';im.style.cssText='width:64px;height:64px;display:block;margin:0 auto 4px';ld.parentNode.insertBefore(im,ld);ld.style.fontSize='26px';}}

/* ---------- wiring ---------- */
const _layerUI11=layerUI;layerUI=function(){_layerUI11();const box=$('layList');const h=document.createElement('div');h.style.cssText='grid-column:1/-1;font-weight:bold;margin-top:6px';h.textContent='📸 Real-world looks';box.appendChild(h);
 [['📸 Photo-real roofs & ground: '+(SAT.on.value?'ON':'OFF'),'Drapes the real satellite photo over every roof and the ground',()=>photoReal(!SAT.on.value)],['🚶📷 Street photos while walking: '+(pipOn?'ON':'OFF'),'A real photo of where you are, updating as you walk (Panoramax)',()=>{pipOn=!pipOn;pipLast=null;if(!pipOn)PIP.style.display='none';else{if(pl.mode!=='walk')setMode('walk');updPip();}}]].forEach(r=>{const b=document.createElement('button');b.innerHTML=r[0]+'<br><small>'+r[1]+'</small>';b.style.textAlign='left';b.onclick=()=>{$('layers').style.display='none';r[2]();};box.appendChild(b);});};
const _after11=afterCityLoaded;afterCityLoaded=function(){_after11();setTimeout(seasonTint,5000);if(GQ==='ultra')photoReal(true);};
const _reset11=resetLayers;resetLayers=function(){_reset11();SAT.on.value=0;SAT.tex=null;SAT.lat=null;if(photoMesh){world.remove(photoMesh);photoMesh=null;}pipLast=null;};
let pipT=0;const _upd11=updateLayers;updateLayers=function(dt){_upd11(dt);updWet(dt);pipT-=dt;if(pipT<=0){pipT=1;updPip();}};
