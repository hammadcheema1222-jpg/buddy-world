
/* ===================== EXTRAS 2: Quaternius + Kenney models, Poly Haven textures, Yuka AI, Rapier physics ===================== */
const ASSET='assets/';let GL=null,MODELS={},modelsReady=false,TREE_LIST=[];const ANIMALS=[];let riding=null;let YUKA=null,yEM=null,RAP=null,rWorld=null,rBall=null;
const PRETTY=(()=>{try{return localStorage.getItem('bw.pretty')!=='0';}catch(e){return true;}})();
async function needGLTF(){if(GL)return GL;if(!THREE.GLTFLoader)await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');if(!THREE.SkeletonUtils)await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/SkeletonUtils.js');GL=new THREE.GLTFLoader();return GL;}
function loadModel(name){if(MODELS[name])return MODELS[name];return MODELS[name]=needGLTF().then(l=>new Promise((res,rej)=>l.load(ASSET+'models/'+name+'.glb',g=>{g.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.material&&o.material.isMeshStandardMaterial){const m=o.material;o.material=new THREE.MeshLambertMaterial({color:m.color,map:m.map,skinning:!!o.isSkinnedMesh,vertexColors:!!o.geometry.attributes.color});}}});res(g);},undefined,rej)));}
function fitSize(obj,size,axis){obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj),s=new THREE.Vector3();b.getSize(s);const cur=axis==='y'?s.y:Math.max(s.x,s.z);if(cur>0)obj.scale.multiplyScalar(size/cur);obj.updateMatrixWorld(true);const b2=new THREE.Box3().setFromObject(obj);obj.position.y-=b2.min.y;return obj;}
function cloneAnimated(g,size){const root=new THREE.Group();const m=THREE.SkeletonUtils.clone(g.scene);fitSize(m,size);root.add(m);const mix=new THREE.AnimationMixer(m);const clips={};g.animations.forEach(a=>{clips[a.name.split('|').pop()]=mix.clipAction(a);});root.userData={mix,clips,cur:null};return root;}
function playA(root,name){const u=root.userData;if(u.cur===name)return;const a=u.clips[name]||u.clips.Walk||u.clips.Idle;if(!a)return;if(u.cur&&u.clips[u.cur])u.clips[u.cur].fadeOut(0.25);a.reset().fadeIn(0.25).play();u.cur=name;}

/* ---- Poly Haven textures on streets & parks (world-space UVs, no seams) ---- */
function prettyGround(){if(!PRETTY)return;const tl=new THREE.TextureLoader();const asp=tl.load(ASSET+'tex/asphalt_02.jpg'),grs=tl.load(ASSET+'tex/aerial_grass_rock.jpg');[asp,grs].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;});
 flatMat.onBeforeCompile=sh=>{sh.uniforms.tAsp={value:asp};sh.uniforms.tGrs={value:grs};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform sampler2D tAsp;uniform sampler2D tGrs;').replace('#include <color_fragment>','#include <color_fragment>\n{vec3 a=texture2D(tAsp,vWP.xz/9.0).rgb;vec3 g=texture2D(tGrs,vWP.xz/14.0).rgb;float green=step(vColor.r*1.12,vColor.g)*step(vColor.b,vColor.g);vec3 detail=mix(vec3(dot(a,vec3(.33))*1.9),g*1.8,green);diffuseColor.rgb*=mix(vec3(1.0),detail,0.55);}');};flatMat.needsUpdate=true;}

/* ---- Quaternius trees ---- */
let OLD_TREES=[];const _buildTrees=buildTrees;buildTrees=function(list){TREE_LIST=list;if(!PRETTY||!modelsReady){const n0=world.children.length;_buildTrees(list);OLD_TREES=world.children.slice(n0);return;}qTrees(list);};
async function qTrees(list){const gs=await Promise.all(['Tree1','Tree2','Tree3','Tree4','Bush1','Bush2'].map(loadModel));const L=list.filter(p=>!CITY.buildingAt(p[0],p[1])).slice(0,5000);
 gs.forEach((g,gi)=>{const sub=L.filter((p,i)=>i%gs.length===gi);if(!sub.length)return;const tpl=g.scene.clone();fitSize(tpl,gi<4?9:2.2,'y');tpl.updateMatrixWorld(true);
  tpl.traverse(o=>{if(!o.isMesh)return;const im=new THREE.InstancedMesh(o.geometry,o.material,sub.length);sub.forEach((p,i)=>{const s=0.75+((i*7919)%10)/16;tmpM.compose(tmpP.set(p[0],0,p[1]),tmpQ.setFromAxisAngle(UPV,i*2.4),tmpS.set(s,s,s));im.setMatrixAt(i,tmpM.multiply(o.matrixWorld));});world.add(im);});});}

/* ---- Kenney trucks & motorbikes in traffic ---- */
const KEN=['vehicle-truck-red','vehicle-truck-yellow','vehicle-truck-green','vehicle-motorcycle'];let kenG={};let kenN=0;
const _carModel=carModel;carModel=function(kind){if(kind==='car'&&modelsReady&&PRETTY&&(kenN++%4===0)){const nm=KEN[kenN%KEN.length];const g=kenG[nm];if(g){const wrap=new THREE.Group();const m=g.scene.clone();fitSize(m,nm.includes('motor')?2.2:5.2);wrap.add(m);return wrap;}}return _carModel(kind);};

/* ---- Quaternius animals with Yuka steering (wander, stay home, flee) ---- */
const SPECIES=[['Horse',2.6,'park'],['Horse_White',2.6,'park'],['Deer',1.9,'park'],['Stag',2.1,'park'],['Husky',1.0,'dog'],['ShibaInu',0.85,'dog'],['Fox',0.9,'night'],['Alpaca',1.8,'park'],['Donkey',1.9,'park'],['Cow',2.4,'park'],['Wolf',1.2,'night']];
async function needYuka(){if(YUKA)return YUKA;try{YUKA=await import('https://cdn.jsdelivr.net/npm/yuka@0.7.8/build/yuka.module.js');yEM=new YUKA.EntityManager();}catch(e){YUKA=null;}return YUKA;}
async function spawnAnimals(){if(!CITY||!PRETTY)return;clearAnimals();const Y=await needYuka();const spots=TREE_LIST.filter(p=>!CITY.buildingAt(p[0],p[1])&&Math.hypot(p[0],p[1])<O.R*0.95);const hour=cityHour(),night=hour<6||hour>20;
 const want=[];const nP=Math.min(14,Math.floor(spots.length/25));for(let i=0;i<nP;i++)want.push(SPECIES.filter(s=>s[2]==='park')[i%7]);for(let i=0;i<6;i++)want.push(SPECIES[4+(i%2)]);if(night)for(let i=0;i<4;i++)want.push(SPECIES[6+(i%2)*4]);
 for(const sp of want){let g;try{g=await loadModel(sp[0]);}catch(e){continue;}if(!CITY)return;const home=spots.length?pickR(spots):[(Math.random()-.5)*O.R,(Math.random()-.5)*O.R];const root=cloneAnimated(g,sp[1]*1.2);root.position.set(home[0],0,home[1]);world.add(root);
  const a={root,sp:sp[0],kind:sp[2],home,speed:sp[2]==='dog'?1.6:sp[0].includes('Horse')?1.4:1.1,v:null,owner:null,eat:0};
  if(sp[2]==='dog'){const ps=movers.filter(m=>m.kind==='person');a.owner=ps.length?pickR(ps):null;}
  if(Y){const v=new Y.Vehicle();v.position.set(home[0],0,home[1]);v.maxSpeed=a.speed;v.boundingRadius=1;const w=new Y.WanderBehavior(2,4,0.5);w.weight=1;v.steering.add(w);const back=new Y.ArriveBehavior(new Y.Vector3(home[0],0,home[1]),3);back.weight=0;v.steering.add(back);const flee=new Y.FleeBehavior(new Y.Vector3(),6);flee.weight=0;v.steering.add(flee);v.userData={w,back,flee};yEM.add(v);a.v=v;}
  ANIMALS.push(a);}
 if(ANIMALS.length)say('Look, real animated animals! 🐴 Walk up to a horse and press H to ride it!',5);}
function clearAnimals(){ANIMALS.forEach(a=>{world.remove(a.root);if(a.v&&yEM)yEM.remove(a.v);});ANIMALS.length=0;riding=null;}
function updAnimals(dt){if(yEM)yEM.update(dt);for(const a of ANIMALS){a.root.userData.mix.update(dt);if(a===riding)continue;const r=a.root;
  if(a.owner&&a.owner.g.parent){const o=a.owner.g.position;const dx=o.x-r.position.x,dz=o.z-r.position.z,d=Math.hypot(dx,dz);if(d>1.6){const s=Math.min(d-1.4,3.2*dt*(d>6?2:1));r.position.x+=dx/d*s;r.position.z+=dz/d*s;r.rotation.y=Math.atan2(dx,dz);playA(r,d>5?'Gallop':'Walk');}else playA(r,'Idle');continue;}
  if(a.v){const v=a.v,u=v.userData,dh=Math.hypot(v.position.x-a.home[0],v.position.z-a.home[1]);u.back.weight=dh>22?2:0;const dp=Math.hypot(v.position.x-pl.x,v.position.z-pl.z);
   const shy=a.kind!=='park'||!a.sp.includes('Horse');u.flee.target.set(pl.x,0,pl.z);u.flee.weight=shy&&pl.mode==='walk'&&dp<5?3:0;
   if(CITY.buildingAt(v.position.x,v.position.z)){v.velocity.multiplyScalar(-1);v.position.x=r.position.x;v.position.z=r.position.z;}
   a.eat-=dt;if(a.eat>0){v.velocity.set(0,0,0);playA(r,'Eating');}else{if(Math.random()<dt*0.04){a.eat=4+Math.random()*5;}const sp=v.getSpeed();v.maxSpeed=u.flee.weight?a.speed*3:a.speed;r.position.set(v.position.x,0,v.position.z);if(sp>0.05)r.rotation.y=Math.atan2(v.velocity.x,v.velocity.z);playA(r,sp>a.speed*1.6?'Gallop':sp>0.15?'Walk':'Idle');}}}
 if(riding){const r=riding.root;r.position.set(pl.x,0,pl.z);r.rotation.y=pl.yaw;const mv=keys.KeyW||keys.KeyS||keys.ArrowUp||keys.ArrowDown||Math.abs(joyV[1])>0.2;playA(r,mv?(keys.ShiftLeft||keys.ShiftRight?'Gallop':'Walk'):'Idle');}}
function toggleRide(){if(riding){riding.root.userData.mix&&playA(riding.root,'Idle');if(riding.v){riding.v.position.set(pl.x,0,pl.z);}riding=null;say('Thanks horsey! 🐴',3);return;}
 const h=ANIMALS.filter(a=>a.sp.includes('Horse')||a.sp==='Donkey').sort((a,b)=>Math.hypot(a.root.position.x-pl.x,a.root.position.z-pl.z)-Math.hypot(b.root.position.x-pl.x,b.root.position.z-pl.z))[0];
 if(!h){showHint('🐴 No horse here yet. Find a park!',3);return;}const d=Math.hypot(h.root.position.x-pl.x,h.root.position.z-pl.z);if(d>10&&pl.mode==='walk'){showHint('🐴 Walk closer to a horse ('+Math.round(d)+' m away), then press H.',3);petTarget=[h.root.position.x,h.root.position.z];return;}
 if(pl.mode!=='walk')setMode('walk');pl.x=h.root.position.x;pl.z=h.root.position.z;riding=h;say('Yeehaw! Hold Shift to gallop! 🐎',4);}
const _updPlayer2=updatePlayer;updatePlayer=function(dt){if(riding&&pl.mode==='walk'){const fast=keys.ShiftLeft||keys.ShiftRight;const x0=pl.x,z0=pl.z;_updPlayer2(dt);const k=fast?3.2:1.6;let nx=x0+(pl.x-x0)*k,nz=z0+(pl.z-z0)*k;if(!CITY.buildingAt(nx,z0))pl.x=nx;else pl.x=x0;if(!CITY.buildingAt(pl.x,nz))pl.z=nz;else pl.z=z0;pl.y+=1.3;return;}_updPlayer2(dt);};

/* ---- Nature pins show a real 3D animal when we have one ---- */
const NAT3D={fox:'Fox',deer:'Deer',horse:'Horse',dog:'Husky',wolf:'Wolf',cow:'Cow',cattle:'Cow',donkey:'Donkey',alpaca:'Alpaca',stag:'Stag'};
async function natModels(){if(!PRETTY)return;for(const g of (X2.nature||[])){const s=g.userData.nat;if(!s||g.userData.m3)continue;const key=Object.keys(NAT3D).find(k=>(s.name||'').toLowerCase().includes(k));if(!key)continue;try{const m=await loadModel(NAT3D[key]);const r=cloneAnimated(m,1.1);g.add(r);r.position.x=0.8;playA(r,'Idle');g.userData.m3=r;ANIM_EXTRA.push(r);}catch(e){}}}
const ANIM_EXTRA=[];

/* ---- Quaternius furniture inside buildings ---- */
const FURN={home:['Couch_Medium1','Table_RoundLarge','Bookshelf','Houseplant_1','Bed_King','Carpet_1','Light_Floor1','Drawer_1'],restaurant:['Table_RoundLarge','Chair_1','Chair_1','Table_RoundLarge','Chair_1','Houseplant_3','Kitchen_Oven','Kitchen_Fridge','Stool'],cafe:['Table_RoundLarge','Chair_1','Stool','Houseplant_3','Chair_1'],office:['Table_RoundLarge','Chair_1','Bookshelf','Houseplant_1','Light_Floor1','Drawer_1'],library:['Bookshelf','Bookshelf','Bookshelf','Table_RoundLarge','Chair_1','Light_Floor1'],hotel:['Bed_King','Couch_Medium1','Houseplant_1','Light_Floor1','Bathroom_Toilet','Drawer_1']};
const FURN_H={Couch_Medium1:0.9,Table_RoundLarge:0.8,Bookshelf:2,Houseplant_1:1.1,Houseplant_3:0.9,Bed_King:0.9,Carpet_1:0.05,Light_Floor1:1.7,Drawer_1:1,Chair_1:1,Kitchen_Oven:0.95,Kitchen_Fridge:1.9,Stool:0.7,Bathroom_Toilet:0.8};
async function furnishQ(b,kt){if(!PRETTY||(typeof isMall==='function'&&isMall(b)))return;const set=FURN[/restaurant|fast_food|pub|bar/.test(kt)?'restaurant':/cafe|ice_cream|bakery/.test(kt)?'cafe':/office|bank|townhall|courthouse/.test(kt)?'office':/library|school|university|college/.test(kt)?'library':/hotel|hostel/.test(kt)?'hotel':/museum|gallery/.test(kt)?null:'home'];if(!set)return;
 const outer=b.poly.outer,bb=b.bb||(()=>{let a=[1e9,1e9,-1e9,-1e9];outer.forEach(p=>{a[0]=Math.min(a[0],p[0]);a[1]=Math.min(a[1],p[1]);a[2]=Math.max(a[2],p[0]);a[3]=Math.max(a[3],p[1]);});return a;})();
 for(let fl=0;fl<Math.min(inside?inside.floors.length:0,3);fl++)for(let i=0;i<Math.min(14,set.length*2);i++){if(!inside||inside.b!==b)return;const nm=set[i%set.length];let x,z,ok=false;for(let t=0;t<12&&!ok;t++){x=bb[0]+Math.random()*(bb[2]-bb[0]);z=bb[1]+Math.random()*(bb[3]-bb[1]);ok=pip([x,z],outer);}if(!ok)continue;
  try{const g=await loadModel(nm);const m=g.scene.clone();fitSize(m,FURN_H[nm]||1,'y');m.position.set(x,m.position.y+0.08,z);m.rotation.y=Math.round(Math.random()*4)*Math.PI/2;if(inside&&inside.floors[fl]){m.userData.qfurn=true;inside.floors[fl].add(m);}}catch(e){}}}

/* ---- Rapier physics for the football (falls back to the simple physics) ---- */
async function needRapier(){if(RAP)return RAP;try{const m=await import('https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/+esm');RAP=m.default||m;await RAP.init();}catch(e){RAP=null;}return RAP;}
let rCol=[],rCenter=null;
async function rapierBall(){const R=await needRapier();if(!R||!ball)return;rWorld=new R.World({x:0,y:-9.81,z:0});rWorld.createCollider(R.ColliderDesc.cuboid(5000,0.1,5000).setTranslation(0,-0.1,0).setFriction(0.9));
 const p=ball.m.position;rBall=rWorld.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setLinearDamping(0.35).setAngularDamping(0.4));rWorld.createCollider(R.ColliderDesc.ball(0.35).setRestitution(0.6).setFriction(0.8).setDensity(0.4),rBall);rCol=[];rCenter=null;}
function rapierWalls(){if(!rWorld||!CITY)return;const p=ball.m.position;if(rCenter&&Math.hypot(p.x-rCenter[0],p.z-rCenter[1])<40)return;rCol.forEach(c=>rWorld.removeCollider(c,false));rCol=[];rCenter=[p.x,p.z];
 for(const b of CITY.buildings){if(b.outlineOnly||!b.poly)continue;const o=b.poly.outer;const c=centroid(o);if(Math.hypot(c[0]-p.x,c[1]-p.z)>90)continue;const top=b.top||10;
  for(let i=0;i<o.length-1;i++){const a=o[i],q=o[i+1],len=Math.hypot(q[0]-a[0],q[1]-a[1]);if(len<0.5)continue;const d=RAP.ColliderDesc.cuboid(len/2,top/2,0.3).setTranslation((a[0]+q[0])/2,top/2,(a[1]+q[1])/2).setRotation(new THREE.Quaternion().setFromAxisAngle(UPV,-Math.atan2(q[1]-a[1],q[0]-a[0])));rCol.push(rWorld.createCollider(d));}}}
const _updPhysics=updPhysics;updPhysics=function(dt){if(!rWorld||!rBall||!ball){_updPhysics(dt);return;}
 if(petJump>0){petJump+=dt;pet.root.position.y+=Math.max(0,Math.sin(petJump*Math.PI/0.6))*1.1;if(petJump>0.6)petJump=0;}
 rapierWalls();const t=rBall.translation(),p=ball.m.position;const kick=(x,z,pow)=>{const dx=t.x-x,dz=t.z-z,d=Math.hypot(dx,dz);if(d<0.9&&t.y<1.2){rBall.setLinvel({x:dx/d*pow,y:pow*0.45,z:dz/d*pow},true);}};kick(pl.x,pl.z,9);kick(pet.x,pet.z,6);
 ANIMALS.forEach(a=>kick(a.root.position.x,a.root.position.z,5));rWorld.timestep=Math.min(dt,1/30);rWorld.step();const n=rBall.translation(),r=rBall.rotation();p.set(n.x,n.y,n.z);ball.m.quaternion.set(r.x,r.y,r.z,r.w);const v=rBall.linvel();ball.v.set(v.x,v.y,v.z);if(room)room.ball();
 if(Math.hypot(v.x,v.z)<0.3&&!petTarget&&Math.hypot(pet.x-p.x,pet.z-p.z)>1)petTarget=[p.x,p.z];};
const _spawnBall=spawnBall;spawnBall=function(){_spawnBall();rapierBall();};

/* ---------- wiring ---------- */
async function loadPretty(){if(!PRETTY)return;try{await needGLTF();const ks=await Promise.all(KEN.map(n=>loadModel(n).catch(()=>null)));KEN.forEach((n,i)=>{if(ks[i])kenG[n]=ks[i];});modelsReady=true;if(CITY){OLD_TREES.forEach(m=>world.remove(m));OLD_TREES=[];qTrees(TREE_LIST);startLife();spawnAnimals();}}catch(e){console.warn('pretty mode off',e);}}
prettyGround();loadPretty();
const _after2=afterCityLoaded;afterCityLoaded=function(){_after2();if(modelsReady)spawnAnimals();};
const _reset2=resetLayers;resetLayers=function(){_reset2();clearAnimals();ANIM_EXTRA.length=0;natModels.done=0;rWorld=null;rBall=null;};
const _upd2=updateLayers;updateLayers=function(dt){_upd2(dt);updAnimals(dt);ANIM_EXTRA.forEach(r=>r.userData.mix.update(dt));if(LAY.nature&&X2.nature&&X2.nature.length&&!natModels.done){natModels.done=1;natModels();}};
const _ent2=enterInside;enterInside=async function(b){await _ent2(b);if(!inside)return;furnishQ(b,poiKind(Object.assign({},b.t,...(b.pois||[]).map(p=>p.t))));};
const _layerUI2=layerUI;layerUI=function(){_layerUI2();const box=$('layList');[['🐴 Ride a horse (H)','Walk up to a horse in a park, press H. Shift = gallop',toggleRide],[PRETTY?'✨ Pretty mode: ON':'✨ Pretty mode: OFF','Quaternius 3D animals, trees & furniture, Kenney vehicles, Poly Haven textures. Turn off for slow laptops',()=>{try{localStorage.setItem('bw.pretty',PRETTY?'0':'1');}catch(e){}location.reload();}]].forEach(r=>{const b=document.createElement('button');b.innerHTML=r[0]+'<br><small>'+r[1]+'</small>';b.style.textAlign='left';b.onclick=()=>{$('layers').style.display='none';r[2]();};box.appendChild(b);});};
addEventListener('keydown',e=>{if(e.code==='KeyH'&&!e.target.closest('input'))toggleRide();});
window.BW_DEBUG=()=>({pl,ANIMALS,ball,toggleRide});
